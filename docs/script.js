(() => {
  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('.menu-button');
  const nav = document.querySelector('.nav-links');
  const progress = document.querySelector('.progress span');
  const reveals = document.querySelectorAll('.reveal');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const themeToggle = document.querySelector('.theme-toggle');
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  const root = document.documentElement;
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');

  const getStoredTheme = () => {
    try {
      return localStorage.getItem('site-theme');
    } catch {
      return null;
    }
  };

  const applyTheme = (theme, persist = false) => {
    const normalized = theme === 'light' ? 'light' : 'dark';
    root.dataset.theme = normalized;
    if (themeColorMeta) themeColorMeta.setAttribute('content', normalized === 'light' ? '#f7f8fc' : '#0a0a0f');

    if (themeToggle) {
      const isLight = normalized === 'light';
      themeToggle.setAttribute('aria-pressed', String(isLight));
      themeToggle.setAttribute('aria-label', isLight ? 'Passer au thème sombre' : 'Passer au thème clair');
      themeToggle.title = isLight ? 'Passer au thème sombre' : 'Passer au thème clair';
    }

    if (persist) {
      try {
        localStorage.setItem('site-theme', normalized);
      } catch {}
    }
  };

  applyTheme(root.dataset.theme || (systemTheme.matches ? 'dark' : 'light'));

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      applyTheme(root.dataset.theme === 'light' ? 'dark' : 'light', true);
    });
  }

  systemTheme.addEventListener?.('change', (event) => {
    if (!getStoredTheme()) applyTheme(event.matches ? 'dark' : 'light');
  });

  const updateScroll = () => {
    const y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 14);

    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = max > 0 ? `${Math.min(100, Math.max(0, (y / max) * 100))}%` : '0%';
    }
  };

  updateScroll();
  window.addEventListener('scroll', updateScroll, { passive: true });

  if (menuButton && nav) {
    const closeMenu = () => {
      nav.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
    };

    menuButton.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('menu-open', open);

      if (open) {
        const firstLink = nav.querySelector('a');
        if (firstLink) firstLink.focus({ preventScroll: true });
      }
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && nav.classList.contains('open')) {
        closeMenu();
        menuButton.focus({ preventScroll: true });
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 760 && nav.classList.contains('open')) closeMenu();
    });
  }

  if (reducedMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((item) => item.classList.add('visible'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

    reveals.forEach((item) => observer.observe(item));
  }

  const promptTarget = document.querySelector('#rotating-prompt');
  if (promptTarget && !reducedMotion) {
    const prompts = [
      'Résume-moi la vidéo :',
      'Donne-moi les idées clés :',
      'Explique cette vidéo simplement :',
      'Fais-moi un plan détaillé :'
    ];
    let index = 0;

    window.setInterval(() => {
      index = (index + 1) % prompts.length;
      promptTarget.animate(
        [
          { opacity: 1, transform: 'translateY(0)' },
          { opacity: 0, transform: 'translateY(-4px)' },
          { opacity: 0, transform: 'translateY(4px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ],
        { duration: 360, easing: 'ease-out' }
      );
      window.setTimeout(() => {
        promptTarget.textContent = prompts[index];
      }, 160);
    }, 2900);
  }

  const flow = document.querySelector('.hero-visual[data-flow-phase]');
  if (flow) {
    const statusText = flow.querySelector('.flow-status-text');
    const promptOutput = flow.querySelector('.composer-prompt');
    const fullPrompt = promptOutput?.dataset.fullPrompt || 'Résume-moi la vidéo : youtube.com/watch?v=VIDEO_ID';

    let currentMode = 'watch';

    const phaseLabels = {
      watch: {
        idle: 'Page vidéo YouTube',
        approach: 'Le curseur va vers Résumer',
        click: 'Clic sur Résumer',
        transfer: 'Ouverture de Gemini',
        compose: 'Prompt injecté automatiquement',
        send: 'Envoi automatique',
        thinking: 'Gemini analyse la vidéo',
        answer: 'Résumé généré'
      },
      feed: {
        idle: 'Accueil YouTube',
        approach: 'Le curseur va vers ⋮',
        click: 'Ouverture du menu',
        select: 'Clic sur Résumer',
        transfer: 'Ouverture de Gemini',
        compose: 'Prompt injecté automatiquement',
        send: 'Envoi automatique',
        thinking: 'Gemini analyse la vidéo',
        answer: 'Résumé généré'
      }
    };

    const sequences = {
      watch: [
        ['idle', 800],
        ['approach', 1050],
        ['click', 560],
        ['transfer', 1150],
        ['compose', null],
        ['send', 620],
        ['thinking', 1850],
        ['answer', 3550]
      ],
      feed: [
        ['idle', 850],
        ['approach', 1000],
        ['click', 780],
        ['select', 900],
        ['transfer', 1150],
        ['compose', null],
        ['send', 620],
        ['thinking', 1850],
        ['answer', 3550]
      ]
    };

    const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

    const setMode = (mode) => {
      currentMode = mode;
      flow.dataset.flowMode = mode;
    };

    const setPhase = (phase) => {
      flow.dataset.flowPhase = phase;
      if (statusText) statusText.textContent = phaseLabels[currentMode]?.[phase] || '';
    };

    const getCursorTarget = (phase) => {
      if (currentMode === 'watch') {
        return flow.querySelector('.yt-resume-action');
      }

      if (phase === 'approach' || phase === 'click') {
        return flow.querySelector('.yt-card-more');
      }

      if (phase === 'select') {
        return flow.querySelector('.yt-card-resume');
      }

      return null;
    };

    const updateCursorTarget = (phase = flow.dataset.flowPhase || 'approach') => {
      const target = getCursorTarget(phase);
      if (!target) return;

      const flowRect = flow.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const x = targetRect.left - flowRect.left + targetRect.width * 0.52;
      const y = targetRect.top - flowRect.top + targetRect.height * 0.55;

      flow.style.setProperty('--cursor-target-x', `${x}px`);
      flow.style.setProperty('--cursor-target-y', `${y}px`);
    };

    const typePrompt = async () => {
      if (!promptOutput) return;
      promptOutput.textContent = '';

      const perCharacter = Math.max(14, Math.min(28, Math.round(1050 / fullPrompt.length)));
      for (const character of fullPrompt) {
        promptOutput.textContent += character;
        await sleep(perCharacter);
      }
    };

    const resetGeminiPrompt = () => {
      if (promptOutput) promptOutput.textContent = '';
    };

    window.addEventListener('resize', () => updateCursorTarget(), { passive: true });

    if (reducedMotion) {
      setMode('watch');
      if (promptOutput) promptOutput.textContent = fullPrompt;
      setPhase('answer');
    } else {
      let demoVisible = true;

      if ('IntersectionObserver' in window) {
        const flowObserver = new IntersectionObserver((entries) => {
          demoVisible = Boolean(entries[0]?.isIntersecting);
        }, { threshold: 0.18 });
        flowObserver.observe(flow);
      }

      const waitUntilVisible = async () => {
        while (!demoVisible || document.hidden) {
          await sleep(350);
        }
      };

      const modes = ['watch', 'feed'];
      let modeIndex = 0;

      const runScenario = async (mode) => {
        setMode(mode);
        resetGeminiPrompt();
        setPhase('idle');

        // Allow the new mockup to become visible before measuring cursor targets.
        await sleep(120);

        for (const [phase, duration] of sequences[mode]) {
          setPhase(phase);

          if (phase === 'approach' || phase === 'click' || phase === 'select') {
            updateCursorTarget(phase);
          }

          if (phase === 'compose') {
            await typePrompt();
            await sleep(260);
          } else {
            await sleep(duration);
          }
        }

        setPhase('idle');
        await sleep(900);
      };

      const runFlow = async () => {
        while (true) {
          await waitUntilVisible();
          const mode = modes[modeIndex % modes.length];
          modeIndex += 1;
          await runScenario(mode);
        }
      };

      runFlow();
    }
  }

})();
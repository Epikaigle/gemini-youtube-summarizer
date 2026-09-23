(() => {
  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('.menu-button');
  const nav = document.querySelector('.nav-links');
  const progress = document.querySelector('.progress span');
  const reveals = document.querySelectorAll('.reveal');
  const themeToggle = document.querySelector('.theme-toggle');
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  const compactNav = window.matchMedia('(max-width: 920px)');

  /* ---------------- Thème Sombre / Clair ---------------- */
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

    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', normalized === 'light' ? '#f7f8fc' : '#0a0a0f');
    }

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

  themeToggle?.addEventListener('click', () => {
    applyTheme(root.dataset.theme === 'light' ? 'dark' : 'light', true);
  });

  systemTheme.addEventListener?.('change', (event) => {
    if (!getStoredTheme()) applyTheme(event.matches ? 'dark' : 'light');
  });

  /* ---------------- Barre de Défilement Throttlée ---------------- */
  let scrollTicking = false;
  const updateScroll = () => {
    const y = window.scrollY;
    header?.classList.toggle('scrolled', y > 14);

    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = max > 0 ? `${Math.min(100, Math.max(0, (y / max) * 100))}%` : '0%';
    }
  };

  updateScroll();
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      window.requestAnimationFrame(() => {
        updateScroll();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });

  /* ---------------- Navigation Mobile Accessible ---------------- */
  if (menuButton && nav) {
    const updateMenuText = (isOpen) => {
      const sr = menuButton.querySelector('.sr-only');
      if (sr) sr.textContent = isOpen ? 'Fermer le menu' : 'Ouvrir le menu';
    };

    const closeMenu = ({ restoreFocus = false } = {}) => {
      nav.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
      updateMenuText(false);
      document.body.classList.remove('menu-open');
      if (restoreFocus) menuButton.focus({ preventScroll: true });
    };

    menuButton.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(open));
      updateMenuText(open);
      document.body.classList.toggle('menu-open', open);

      if (open) nav.querySelector('a')?.focus({ preventScroll: true });
    });

    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => closeMenu()));

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && nav.classList.contains('open')) {
        closeMenu({ restoreFocus: true });
      }
    });

    document.addEventListener('click', (event) => {
      if (nav.classList.contains('open') && !nav.contains(event.target) && !menuButton.contains(event.target)) {
        closeMenu();
      }
    });

    const syncNavMode = () => {
      if (!compactNav.matches && nav.classList.contains('open')) closeMenu();
    };
    compactNav.addEventListener?.('change', syncNavMode);
  }

  /* ---------------- Animations d'apparition (Reveal) ---------------- */
  if (reducedMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((item) => item.classList.add('visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

    reveals.forEach((item) => revealObserver.observe(item));
  }

  /* ---------------- Studio de Personnalisation du Prompt ---------------- */
  const studioInput = document.querySelector('#interactive-prompt-input');
  const studioPreview = document.querySelector('#interactive-prompt-preview');
  const presetChips = document.querySelectorAll('.preset-chip');

  if (studioInput && studioPreview) {
    const sampleVideoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

    const updateStudioPreview = (value) => {
      const clean = (typeof value === 'string' ? value : studioInput.value).trim();
      const output = clean ? `${clean} ${sampleVideoUrl}` : sampleVideoUrl;
      studioPreview.textContent = output;
    };

    studioInput.addEventListener('input', () => {
      updateStudioPreview(studioInput.value);
      // Synchroniser l'état des puces prédéfinies
      presetChips.forEach((chip) => {
        chip.classList.toggle('active', chip.dataset.preset === studioInput.value);
      });
    });

    presetChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        presetChips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        studioInput.value = chip.dataset.preset;
        updateStudioPreview(studioInput.value);
        studioInput.focus();
      });
    });

    updateStudioPreview(studioInput.value);
  }

  /* ---------------- Démonstration Hero Animée & Contrôles ---------------- */
  const flow = document.querySelector('.hero-visual[data-flow-phase]');
  if (!flow) return;

  const promptOutput = flow.querySelector('.composer-prompt');
  const fullPrompt = promptOutput?.dataset.fullPrompt || 'Résume-moi la vidéo : youtube.com/watch?v=VIDEO_ID';
  const ctrlToggle = document.querySelector('#demo-ctrl-toggle');
  const ctrlReplay = document.querySelector('#demo-ctrl-replay');
  const modeTabs = document.querySelectorAll('.demo-mode-tab');

  let currentMode = 'watch';
  let demoVisible = true;
  let isPaused = false;
  let flowAbortController = new AbortController();

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

  const waitWhileActive = async (ms, signal) => {
    let elapsed = 0;
    while (elapsed < ms) {
      if (signal?.aborted) throw new Error('aborted');
      if (isPaused || !demoVisible || document.hidden) {
        await sleep(200);
        continue;
      }
      const slice = Math.min(100, ms - elapsed);
      await sleep(slice);
      elapsed += slice;
    }
  };

  const waitUntilVisible = async (signal) => {
    while (isPaused || !demoVisible || document.hidden) {
      if (signal?.aborted) throw new Error('aborted');
      await sleep(200);
    }
  };

  const setMode = (mode) => {
    currentMode = mode;
    flow.dataset.flowMode = mode;
    modeTabs.forEach((tab) => {
      const match = tab.dataset.mode === mode;
      tab.classList.toggle('active', match);
      tab.setAttribute('aria-selected', String(match));
    });
  };

  const setPhase = (phase) => {
    flow.dataset.flowPhase = phase;
  };

  const getCursorTarget = (phase) => {
    if (currentMode === 'watch') return flow.querySelector('.yt-resume-action');
    if (phase === 'approach' || phase === 'click') return flow.querySelector('.yt-card-more');
    if (phase === 'select') return flow.querySelector('.yt-card-resume');
    return null;
  };

  const updateCursorTarget = (phase = flow.dataset.flowPhase || 'approach') => {
    const target = getCursorTarget(phase);
    if (!target) return;

    const flowRect = flow.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    flow.style.setProperty('--cursor-target-x', `${targetRect.left - flowRect.left + targetRect.width * 0.52}px`);
    flow.style.setProperty('--cursor-target-y', `${targetRect.top - flowRect.top + targetRect.height * 0.55}px`);
  };

  const typePrompt = async (signal) => {
    if (!promptOutput) return;
    promptOutput.textContent = '';

    const perCharacter = Math.max(14, Math.min(28, Math.round(1050 / fullPrompt.length)));
    for (const character of fullPrompt) {
      await waitUntilVisible(signal);
      promptOutput.textContent += character;
      await waitWhileActive(perCharacter, signal);
    }
  };

  const resetGeminiPrompt = () => {
    if (promptOutput) promptOutput.textContent = '';
  };

  let resizeFrame = 0;
  window.addEventListener('resize', () => {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(() => updateCursorTarget());
  }, { passive: true });

  /* ---------------- Contrôles Pause / Play / Replay / Modes ---------------- */
  if (ctrlToggle) {
    ctrlToggle.addEventListener('click', () => {
      isPaused = !isPaused;
      flow.classList.toggle('demo-paused', isPaused);
      ctrlToggle.classList.toggle('is-paused', isPaused);
      ctrlToggle.setAttribute('aria-label', isPaused ? 'Reprendre l’animation' : 'Mettre en pause l’animation');
      ctrlToggle.title = isPaused ? 'Reprendre l’animation' : 'Mettre en pause l’animation';
    });
  }

  const restartCurrentFlow = () => {
    flowAbortController.abort();
    flowAbortController = new AbortController();
    runFlow(flowAbortController.signal);
  };

  if (ctrlReplay) {
    ctrlReplay.addEventListener('click', () => {
      if (isPaused) {
        isPaused = false;
        flow.classList.remove('demo-paused');
        ctrlToggle?.classList.remove('is-paused');
      }
      restartCurrentFlow();
    });
  }

  modeTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const mode = tab.dataset.mode;
      if (mode && mode !== currentMode) {
        setMode(mode);
        restartCurrentFlow();
      }
    });
  });

  if (reducedMotion) {
    setMode('watch');
    if (promptOutput) promptOutput.textContent = fullPrompt;
    setPhase('answer');
    return;
  }

  if ('IntersectionObserver' in window) {
    const flowObserver = new IntersectionObserver((entries) => {
      demoVisible = Boolean(entries[0]?.isIntersecting);
    }, { threshold: 0.18 });
    flowObserver.observe(flow);
  }

  document.addEventListener('visibilitychange', () => {
    // La pause automatique se fait via document.hidden dans waitWhileActive
  });

  const runScenario = async (mode, signal) => {
    setMode(mode);
    resetGeminiPrompt();
    setPhase('idle');
    await waitWhileActive(120, signal);

    for (const [phase, duration] of sequences[mode]) {
      await waitUntilVisible(signal);
      setPhase(phase);

      if (phase === 'approach' || phase === 'click' || phase === 'select') {
        updateCursorTarget(phase);
      }

      if (phase === 'compose') {
        await typePrompt(signal);
        await waitWhileActive(260, signal);
      } else {
        await waitWhileActive(duration, signal);
      }
    }

    setPhase('idle');
    await waitWhileActive(900, signal);
  };

  const runFlow = async (signal) => {
    const modes = ['watch', 'feed'];
    try {
      while (!signal?.aborted) {
        await waitUntilVisible(signal);
        await runScenario(currentMode, signal);
        if (signal?.aborted) break;
        // Alterne automatiquement vers l'autre mode si l'utilisateur n'a pas sélectionné manuellement
        const nextMode = currentMode === 'watch' ? 'feed' : 'watch';
        setMode(nextMode);
      }
    } catch {
      // Annulé par changement de mode ou rejouer
    }
  };

  runFlow(flowAbortController.signal);
})();

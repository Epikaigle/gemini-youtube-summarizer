(() => {
  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('.menu-button');
  const nav = document.querySelector('.nav-links');
  const progress = document.querySelector('.progress span');
  const reveals = document.querySelectorAll('.reveal');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    const resumeButton = flow.querySelector('.yt-resume-action');
    const statusText = flow.querySelector('.flow-status-text');
    const promptOutput = flow.querySelector('.composer-prompt');
    const fullPrompt = promptOutput?.dataset.fullPrompt || 'Résume-moi la vidéo : youtube.com/watch?v=VIDEO_ID';

    const phaseLabels = {
      idle: 'Sur YouTube',
      approach: 'Le curseur va vers Résumer',
      click: 'Clic sur Résumer',
      transfer: 'Ouverture de Gemini',
      compose: 'Prompt injecté automatiquement',
      send: 'Envoi automatique',
      thinking: 'Gemini analyse la vidéo',
      answer: 'Résumé généré'
    };

    const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

    const setPhase = (phase) => {
      flow.dataset.flowPhase = phase;
      if (statusText) statusText.textContent = phaseLabels[phase] || '';
    };

    const updateCursorTarget = () => {
      if (!resumeButton) return;
      const flowRect = flow.getBoundingClientRect();
      const buttonRect = resumeButton.getBoundingClientRect();
      const x = buttonRect.left - flowRect.left + buttonRect.width * 0.52;
      const y = buttonRect.top - flowRect.top + buttonRect.height * 0.56;
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

    updateCursorTarget();
    window.addEventListener('resize', updateCursorTarget, { passive: true });

    if (reducedMotion) {
      if (promptOutput) promptOutput.textContent = fullPrompt;
      setPhase('answer');
    } else {
      let demoVisible = true;

      if ('IntersectionObserver' in window) {
        const flowObserver = new IntersectionObserver((entries) => {
          const entry = entries[0];
          demoVisible = Boolean(entry?.isIntersecting);
        }, { threshold: 0.18 });
        flowObserver.observe(flow);
      }

      const waitUntilVisible = async () => {
        while (!demoVisible || document.hidden) {
          await sleep(350);
        }
      };

      const runFlow = async () => {
        while (true) {
          await waitUntilVisible();
          updateCursorTarget();

          if (promptOutput) promptOutput.textContent = '';
          setPhase('idle');
          await sleep(750);

          setPhase('approach');
          await sleep(1050);

          setPhase('click');
          await sleep(560);

          setPhase('transfer');
          await sleep(1150);

          setPhase('compose');
          await typePrompt();
          await sleep(260);

          setPhase('send');
          await sleep(620);

          setPhase('thinking');
          await sleep(1850);

          setPhase('answer');
          await sleep(3550);

          setPhase('idle');
          await sleep(900);
        }
      };

      runFlow();
    }
  }

})();
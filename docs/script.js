(() => {
  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('.menu-button');
  const nav = document.querySelector('.main-nav');
  const progress = document.querySelector('.scroll-progress span');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const updateScrollState = () => {
    const y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 18);

    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      progress.style.width = `${ratio * 100}%`;
    }
  };

  updateScrollState();
  window.addEventListener('scroll', updateScrollState, { passive: true });

  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('menu-open', open);
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        menuButton.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-open');
      });
    });
  }

  const revealItems = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || reducedMotion) {
    revealItems.forEach((item) => item.classList.add('visible'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.11, rootMargin: '0px 0px -42px 0px' });

    revealItems.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min((index % 3) * 70, 140)}ms`;
      observer.observe(item);
    });
  }

  if (!reducedMotion && window.matchMedia('(pointer:fine)').matches) {
    window.addEventListener('pointermove', (event) => {
      root.style.setProperty('--mouse-x', `${event.clientX}px`);
      root.style.setProperty('--mouse-y', `${event.clientY}px`);
    }, { passive: true });

    document.querySelectorAll('.interactive-card').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--shine-x', `${event.clientX - rect.left}px`);
        card.style.setProperty('--shine-y', `${event.clientY - rect.top}px`);
      });
    });

    const tilt = document.querySelector('[data-tilt]');
    if (tilt) {
      tilt.addEventListener('pointermove', (event) => {
        const rect = tilt.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - .5;
        const py = (event.clientY - rect.top) / rect.height - .5;
        tilt.style.transform = `perspective(1200px) rotateX(${py * -2.4}deg) rotateY(${px * 3.2}deg)`;
      });

      tilt.addEventListener('pointerleave', () => {
        tilt.style.transform = '';
      });
    }
  }

  const prompts = [
    'Résume-moi la vidéo :',
    'Donne-moi les idées clés :',
    'Fais-moi un plan détaillé :',
    'Explique cette vidéo simplement :'
  ];

  const cycleTargets = [
    document.querySelector('.prompt-cycler-text'),
    document.querySelector('[data-rotating-copy]')
  ].filter(Boolean);

  let promptIndex = 0;
  if (cycleTargets.length && !reducedMotion) {
    setInterval(() => {
      promptIndex = (promptIndex + 1) % prompts.length;
      cycleTargets.forEach((target) => {
        target.animate(
          [
            { opacity: 1, transform: 'translateY(0)' },
            { opacity: 0, transform: 'translateY(-5px)' },
            { opacity: 0, transform: 'translateY(5px)' },
            { opacity: 1, transform: 'translateY(0)' }
          ],
          { duration: 420, easing: 'ease-out' }
        );
        window.setTimeout(() => {
          target.textContent = prompts[promptIndex];
        }, 190);
      });

      const typedPrompt = document.querySelector('.typed-prompt');
      if (typedPrompt) {
        window.setTimeout(() => {
          typedPrompt.textContent = prompts[promptIndex];
        }, 190);
      }
    }, 3200);
  }

  document.querySelectorAll('.faq-list details').forEach((details) => {
    details.addEventListener('toggle', () => {
      if (!details.open) return;
      document.querySelectorAll('.faq-list details').forEach((other) => {
        if (other !== details) other.removeAttribute('open');
      });
    });
  });
})();
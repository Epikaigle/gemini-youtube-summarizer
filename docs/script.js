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
})();
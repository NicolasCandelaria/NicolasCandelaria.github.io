/* Shared GSAP animation layer for the whole portfolio.
   Driven by data attributes so every page can opt in declaratively:
     data-split        — headline splits into words that rise in with stagger
     data-reveal       — fade/slide up when scrolled into view (data-delay optional)
     data-reveal-group — direct children stagger in as a group
     data-counter      — numeric text counts up from 0 (keeps suffix like "+" or "%")
     data-drift        — horizontal scroll-scrubbed drift (px, sign = direction)
     data-spin         — full rotation scrubbed to scroll
     data-float        — gentle endless bob (hero logos)
   Plus: nav entrance, scroll progress bar, card 3D tilt, magnetic footer socials. */
(() => {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const EASE = 'power3.out';

  /* ---------- Nav entrance ---------- */
  const nav = document.querySelector('nav');
  if (nav) gsap.from(nav, { y: -40, opacity: 0, duration: 0.9, ease: EASE, delay: 0.15, clearProps: 'all' });

  /* ---------- Scroll progress hairline ---------- */
  const bar = document.createElement('div');
  Object.assign(bar.style, {
    position: 'fixed', top: '0', left: '0', width: '100%', height: '2px',
    background: 'linear-gradient(90deg, #8a2033, #e8dcc4)',
    transformOrigin: '0 50%', transform: 'scaleX(0)', zIndex: '120', pointerEvents: 'none'
  });
  document.body.appendChild(bar);
  gsap.to(bar, {
    scaleX: 1, ease: 'none',
    scrollTrigger: { trigger: document.documentElement, start: 'top top', end: 'max', scrub: 0.3 }
  });

  /* ---------- Split headlines ---------- */
  function splitWords(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', words.join(' '));
    el.textContent = '';
    words.forEach((word, i) => {
      const mask = document.createElement('span');
      mask.setAttribute('aria-hidden', 'true');
      mask.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:bottom;padding-bottom:0.08em;margin-bottom:-0.08em;';
      const inner = document.createElement('span');
      inner.className = 'split-word';
      inner.style.display = 'inline-block';
      inner.textContent = word;
      mask.appendChild(inner);
      el.appendChild(mask);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
    return el.querySelectorAll('.split-word');
  }

  document.querySelectorAll('[data-split]').forEach(el => {
    const words = splitWords(el);
    gsap.from(words, {
      yPercent: 130, rotate: 4, duration: 1.2, stagger: 0.07, ease: 'power4.out',
      delay: parseFloat(el.dataset.delay || 0),
      scrollTrigger: { trigger: el, start: 'top 92%', once: true }
    });
  });

  /* ---------- Generic reveals ---------- */
  document.querySelectorAll('[data-reveal]').forEach(el => {
    gsap.from(el, {
      opacity: 0, y: 40, duration: 1.1, ease: EASE,
      delay: parseFloat(el.dataset.delay || 0),
      scrollTrigger: { trigger: el, start: 'top 90%', once: true }
    });
  });

  document.querySelectorAll('[data-reveal-group]').forEach(group => {
    const children = group.children;
    gsap.from(children, {
      opacity: 0, y: 30, duration: 0.9, stagger: 0.12, ease: EASE,
      scrollTrigger: {
        trigger: group,
        start: 'top bottom',
        once: true
      }
    });
  });

  /* ---------- Card grids: batched rise-in ---------- */
  const cards = gsap.utils.toArray('.work-card, .project-card, .service-card');
  if (cards.length) {
    gsap.set(cards, { opacity: 0, y: 70, scale: 0.97 });
    ScrollTrigger.batch(cards, {
      start: 'top 92%',
      once: true,
      onEnter: batch => gsap.to(batch, {
        opacity: 1, y: 0, scale: 1, duration: 1.1, stagger: 0.13, ease: EASE, overwrite: true
      })
    });
  }

  /* ---------- Counters ---------- */
  document.querySelectorAll('[data-counter]').forEach(el => {
    const match = el.textContent.trim().match(/^(\d+)(.*)$/);
    if (!match) return;
    const end = parseInt(match[1], 10);
    const suffix = match[2] || '';
    const state = { value: 0 };
    el.textContent = '0' + suffix;
    gsap.to(state, {
      value: end, duration: 2, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      onUpdate: () => { el.textContent = Math.round(state.value) + suffix; }
    });
  });

  /* ---------- Scroll-scrubbed drift / spin / float ---------- */
  document.querySelectorAll('[data-drift]').forEach(el => {
    const distance = parseFloat(el.dataset.drift) || 0;
    gsap.fromTo(el, { x: distance }, {
      x: -distance, ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: 1.2 }
    });
  });

  document.querySelectorAll('[data-spin]').forEach(el => {
    gsap.to(el, {
      rotation: 360, ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: 1.5 }
    });
  });

  // Delay past the entrance reveal so the two tweens never fight over `y`
  document.querySelectorAll('[data-float]').forEach(el => {
    gsap.to(el, { y: -12, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.8 });
  });

  /* ---------- 3D tilt on interactive cards ---------- */
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  if (finePointer) {
    gsap.utils.toArray('.work-card, .project-card').forEach(card => {
      gsap.set(card, { transformPerspective: 900 });
      const toRX = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power2.out' });
      const toRY = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power2.out' });
      card.addEventListener('pointermove', e => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        toRX(-py * 7);
        toRY(px * 7);
      });
      card.addEventListener('pointerleave', () => { toRX(0); toRY(0); });
    });
  }

  /* ---------- Magnetic footer social links ---------- */
  if (finePointer) {
    document.querySelectorAll('.footer-socials a, .social-btn').forEach(link => {
      const toX = gsap.quickTo(link, 'x', { duration: 0.4, ease: 'power2.out' });
      link.addEventListener('pointermove', e => {
        const rect = link.getBoundingClientRect();
        toX(((e.clientX - rect.left) / rect.width - 0.5) * 8);
      });
      link.addEventListener('pointerleave', () => toX(0));
    });
  }
})();

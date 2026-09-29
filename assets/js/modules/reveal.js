const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal--visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
);

export const initReveal = () => {
  const targets = document.querySelectorAll(
    '.archive-header, .archive__card, .press-section, .signup, .footer'
  );
  targets.forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${Math.min(i * 0.06, 0.4)}s`;
    revealObserver.observe(el);
  });
};

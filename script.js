/* ==========================================================================
   PARASOL SOUND CARTEL — Scripts
   - Sticky nav with scroll reveal
   - Tab switching (Newsletter / Press)
   - Email signup (Brevo API via subscribe.php)
   - Scroll reveal animations
   ========================================================================== */

(function () {
  'use strict';

  // ---------- Nav: show after scrolling past hero ----------
  const initNav = () => {
    const nav = document.getElementById('nav');
    const hero = document.getElementById('hero');
    const scrollHint = document.getElementById('scroll-hint');
    if (!nav || !hero) return;

    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const heroBottom = hero.offsetHeight * 0.6;
        const scrolled = window.scrollY;

        // Show nav after scrolling past ~60% of hero
        nav.classList.toggle('nav--visible', scrolled > heroBottom);
        nav.classList.toggle('nav--scrolled', scrolled > heroBottom);

        // Fade scroll hint
        if (scrollHint) {
          scrollHint.style.opacity = Math.max(0, 1 - scrolled / 300);
        }

        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  };

  // ---------- Tab Switching ----------
  const initTabs = () => {
    const tabs = document.querySelectorAll('.nav__tab');
    const panels = document.querySelectorAll('.tab-panel');
    if (!tabs.length || !panels.length) return;

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;

        // Update active tab
        tabs.forEach((t) => t.classList.remove('nav__tab--active'));
        tab.classList.add('nav__tab--active');

        // Switch panel
        panels.forEach((p) => {
          p.classList.remove('tab-panel--active');
          if (p.id === `panel-${target}`) {
            p.classList.add('tab-panel--active');
            // Re-trigger reveal for newly visible elements
            revealInPanel(p);
          }
        });

        // Scroll to main content if we're way down
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
          const navH = 64;
          const mainTop = mainContent.getBoundingClientRect().top + window.scrollY - navH - 20;
          if (window.scrollY > mainTop + 400) {
            window.scrollTo({ top: mainTop, behavior: 'smooth' });
          }
        }
      });
    });
  };

  // ---------- Scroll Reveal ----------
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

  const initReveal = () => {
    const targets = document.querySelectorAll(
      '.archive-header, .archive__card, .press-section, .signup, .footer'
    );
    targets.forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${Math.min(i * 0.06, 0.4)}s`;
      revealObserver.observe(el);
    });
  };

  const revealInPanel = (panel) => {
    const targets = panel.querySelectorAll('.reveal:not(.reveal--visible)');
    targets.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i * 0.06, 0.4)}s`;
      revealObserver.observe(el);
    });
  };

  // ---------- Email Signup (Brevo API via subscribe.php) ----------
  const initSignup = () => {
    const form = document.getElementById('signup-form');
    const input = document.getElementById('email-input');
    const button = document.getElementById('signup-button');
    const buttonText = button ? button.querySelector('.signup__button-text') : null;
    const buttonArrow = button ? button.querySelector('.signup__button-arrow') : null;
    const successEl = document.getElementById('signup-success');
    if (!form || !input || !button || !successEl) return;

    let isSubmitting = false;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (isSubmitting) return;

      const email = input.value.trim().toLowerCase();
      if (!email || !isValidEmail(email)) {
        shakeInput(input);
        return;
      }

      // --- Loading state ---
      isSubmitting = true;
      button.disabled = true;
      if (buttonText) buttonText.textContent = '...';
      if (buttonArrow) buttonArrow.style.display = 'none';

      try {
        const res = await fetch('subscribe.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();

        if (data.success) {
          const title = data.duplicate ? 'Already on the list!' : 'Subscribed.';
          showSuccess(form, successEl, title);
        } else {
          showError(input, data.error || 'Something went wrong. Please try again.');
          resetButton();
        }
      } catch (err) {
        console.error('[PARASOL] Signup error:', err);
        showError(input, 'Could not connect to server. Please try again.');
        resetButton();
      }

      function resetButton() {
        isSubmitting = false;
        button.disabled = false;
        if (buttonText) buttonText.textContent = 'Subscribe';
        if (buttonArrow) buttonArrow.style.display = '';
      }
    });
  };

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function shakeInput(el) {
    el.style.animation = 'none';
    el.offsetHeight; // trigger reflow
    el.style.animation = 'inputShake 0.4s ease';
    setTimeout(() => (el.style.animation = ''), 400);
  }

  function showSuccess(form, successEl, title) {
    form.hidden = true;
    successEl.hidden = false;
    const titleEl = successEl.querySelector('.signup__success-title');
    if (titleEl) titleEl.textContent = title;
  }

  function showError(input, message) {
    // Remove any existing error
    const existing = input.parentElement.parentElement.querySelector('.signup__error');
    if (existing) existing.remove();

    const errorEl = document.createElement('p');
    errorEl.className = 'signup__error';
    errorEl.textContent = message;
    errorEl.style.cssText = 'color: #e74c3c; font-size: 0.85rem; margin: 0.5rem 0 0; opacity: 0; transition: opacity 0.3s ease;';
    input.parentElement.after(errorEl);

    // Fade in
    requestAnimationFrame(() => { errorEl.style.opacity = '1'; });

    // Auto-remove after 4s
    setTimeout(() => {
      errorEl.style.opacity = '0';
      setTimeout(() => errorEl.remove(), 300);
    }, 4000);
  }

  // ---------- Smooth scroll for anchor links ----------
  const initSmoothScroll = () => {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  };

  // ---------- Add input shake keyframe dynamically ----------
  const addShakeKeyframe = () => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes inputShake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-8px); }
        40% { transform: translateX(8px); }
        60% { transform: translateX(-4px); }
        80% { transform: translateX(4px); }
      }
    `;
    document.head.appendChild(style);
  };

  // ---------- Newsletter Detail Switching ----------
  const initNewsletterViews = () => {
    const list = document.getElementById('archive-list');
    const cards = document.querySelectorAll('.archive__card');
    const backs = document.querySelectorAll('.issue-detail__back');
    const details = document.querySelectorAll('.issue-detail');

    if (!list || !cards.length) return;

    cards.forEach(card => {
      card.addEventListener('click', () => {
        const issueId = card.dataset.issue;
        const detail = document.getElementById(`issue-${issueId}`);
        if (detail) {
          list.hidden = true;
          details.forEach(d => d.hidden = true);
          detail.hidden = false;
          window.scrollTo({ top: list.parentElement.offsetTop - 80, behavior: 'smooth' });
        }
      });
    });

    backs.forEach(back => {
      back.addEventListener('click', () => {
        details.forEach(d => d.hidden = true);
        list.hidden = false;
        window.scrollTo({ top: list.parentElement.offsetTop - 80, behavior: 'smooth' });
      });
    });
  };

  // ---------- Init ----------
  document.addEventListener('DOMContentLoaded', () => {
    addShakeKeyframe();
    initNav();
    initTabs();
    initReveal();
    initSignup();
    initSmoothScroll();
    initNewsletterViews();
  });
})();

export const initSignup = () => {
  const form = document.getElementById('signup-form');
  const input = document.getElementById('email-input');
  const button = document.getElementById('signup-button');
  const successEl = document.getElementById('signup-success');
  const buttonText = button ? button.querySelector('.signup__button-text') : null;
  const buttonArrow = button ? button.querySelector('.signup__button-arrow') : null;

  if (!form || !input || !button || !successEl) return;

  let isSubmitting = false;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const email = input.value.trim();
    if (!isValidEmail(email)) {
      shakeInput(input);
      return;
    }

    isSubmitting = true;
    button.disabled = true;
    if (buttonText) buttonText.textContent = 'Wait...';
    if (buttonArrow) buttonArrow.style.display = 'none';

    try {
      const res = await fetch('api/subscribe.php', {
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
  const existing = input.parentElement.parentElement.querySelector('.signup__error');
  if (existing) existing.remove();

  const errorEl = document.createElement('p');
  errorEl.className = 'signup__error';
  errorEl.textContent = message;
  errorEl.style.cssText = 'color: #e74c3c; font-size: 0.85rem; margin: 0.5rem 0 0; opacity: 0; transition: opacity 0.3s ease;';
  input.parentElement.after(errorEl);

  requestAnimationFrame(() => { errorEl.style.opacity = '1'; });

  setTimeout(() => {
    errorEl.style.opacity = '0';
    setTimeout(() => errorEl.remove(), 300);
  }, 4000);
}

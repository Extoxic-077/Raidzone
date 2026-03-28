let container = null;

function getContainer() {
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

const ICONS = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
};

export function showToast(message, type = 'info') {
  const c = getContainer();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icon = document.createElement('span');
  icon.className = 'toast-icon';
  icon.textContent = ICONS[type] || ICONS.info;

  const msg = document.createElement('span');
  msg.className = 'toast-msg';
  msg.textContent = message;

  toast.appendChild(icon);
  toast.appendChild(msg);
  c.appendChild(toast);

  let dismissed = false;

  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    toast.classList.add('out');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  };

  const timer = setTimeout(dismiss, 3000);

  toast.addEventListener('click', () => {
    clearTimeout(timer);
    dismiss();
  });
}

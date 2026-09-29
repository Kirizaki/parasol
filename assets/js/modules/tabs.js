export const initTabs = () => {
  const tabs = document.querySelectorAll('.nav__tab');
  const panels = document.querySelectorAll('.tab-panel');
  if (!tabs.length || !panels.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('nav__tab--active'));
      panels.forEach((p) => p.classList.remove('tab-panel--active'));

      tab.classList.add('nav__tab--active');
      const targetId = `panel-${tab.dataset.tab}`;
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('tab-panel--active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
};

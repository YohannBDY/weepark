/* ============================================================
   Composant publicité — modale vidéo + récompense crédits
   ============================================================ */

window.WeePark = window.WeePark || {};

WeePark.Ads = (function () {
  const REWARD = 10;
  const MIN_WATCH_SECONDS = 5;
  const MAX_WATCH_SECONDS = 20;

  let timer = null;

  function open() {
    document.getElementById('ad-overlay').classList.remove('hidden');
    document.getElementById('ad-bar').style.width = '0%';

    const skipBtn = document.getElementById('ad-skip-btn');
    skipBtn.disabled = true;
    skipBtn.style.opacity = '.4';

    document.getElementById('ad-countdown').textContent =
      `Regardez ${MIN_WATCH_SECONDS}s pour gagner ${REWARD} crédits`;

    let elapsed = 0;
    clearInterval(timer);
    timer = setInterval(() => {
      elapsed++;
      document.getElementById('ad-bar').style.width = Math.min(100, elapsed * (100 / MAX_WATCH_SECONDS)) + '%';

      if (elapsed >= MIN_WATCH_SECONDS) {
        skipBtn.disabled = false;
        skipBtn.style.opacity = '1';
        document.getElementById('ad-countdown').innerHTML =
          `<i data-lucide="check-circle"></i> +${REWARD} crédits débloqués !`;
        lucide.createIcons();
      }

      if (elapsed >= MAX_WATCH_SECONDS) {
        clearInterval(timer);
        complete();
      }
    }, 1000);
  }

  function skip() {
    clearInterval(timer);
    complete();
  }

  function complete() {
    document.getElementById('ad-overlay').classList.add('hidden');
    WeePark.Credits.add(REWARD);
    alert(`+${REWARD} crédits ajoutés à votre solde !`);
  }

  function init() {
    document.querySelectorAll('[data-action="open-ad"]').forEach(el => {
      el.addEventListener('click', open);
    });
    document.getElementById('ad-skip-btn').addEventListener('click', skip);
  }

  return { init, open };
})();

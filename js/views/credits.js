/* ============================================================
   Vue Crédits — solde, gains, dépenses
   ============================================================ */

window.WeePark = window.WeePark || {};

WeePark.Credits = (function () {
  let credits = 50;
  let earned  = 50;
  let spent   = 0;

  function update() {
    document.getElementById('credit-balance').textContent = credits;
    document.getElementById('credit-earned').textContent  = earned;
    document.getElementById('credit-spent').textContent   = spent;
  }

  function add(amount) {
    credits += amount;
    earned  += amount;
    update();
  }

  function spend(amount) {
    if (amount > credits) return false;
    credits -= amount;
    spent   += amount;
    update();
    return true;
  }

  function init() {
    update();
  }

  return { init, add, spend };
})();

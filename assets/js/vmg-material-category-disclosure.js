/* Shared material catalogue disclosure, currently enabled for Auto Scrap only.
   Source contains every material; JS adds the collapse after successful init. */
(function () {
  'use strict';
  function init() {
    var grid = document.getElementById('vmg-material-grid');
    var button = document.getElementById('vmg-material-more');
    if (!grid || !button) return;
    var cards = Array.prototype.slice.call(grid.children).filter(function (node) {
      return node.classList && node.classList.contains('seo-catalogue-card');
    });
    if (cards.length <= 12) return;
    var expanded = false;
    function setExpanded(value) {
      expanded = !!value;
      grid.classList.toggle('is-expanded', expanded);
      button.setAttribute('aria-expanded', String(expanded));
      button.textContent = expanded
        ? 'Show Fewer Materials'
        : 'View All ' + cards.length + ' Material Examples';
    }
    function anchoredCard() {
      if (!window.location.hash) return null;
      var id;
      try { id = decodeURIComponent(window.location.hash.slice(1)); }
      catch (error) { id = window.location.hash.slice(1); }
      var card = document.getElementById(id);
      return card && grid.contains(card) && card.classList.contains('seo-catalogue-card')
        ? card : null;
    }
    var initialCard = anchoredCard();
    grid.classList.add('vmg-catalogue-collapsible');
    button.hidden = false;
    setExpanded(!!initialCard);
    button.addEventListener('click', function () { setExpanded(!expanded); });
    window.addEventListener('hashchange', function () {
      var target = anchoredCard();
      if (!target) return;
      setExpanded(true);
      window.requestAnimationFrame(function () {
        target.scrollIntoView({block:'start',behavior:'auto'});
      });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, {once:true});
  } else {
    init();
  }
})();
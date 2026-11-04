/* Product-category catalogue disclosure for VMG Aluminium only.
   All material cards remain in HTML and visible without JavaScript. */
(function () {
  'use strict';

  function ready() {
    var grid = document.getElementById('aluminium-material-grid');
    var button = document.getElementById('aluminium-show-more');
    if (!grid || !button) return;

    var items = Array.prototype.slice.call(grid.querySelectorAll(':scope > .seo-catalogue-card'));
    if (items.length <= 12) return;

    var total = items.length;
    var expanded = false;

    function setExpanded(next) {
      expanded = !!next;
      grid.classList.toggle('is-expanded', expanded);
      button.setAttribute('aria-expanded', String(expanded));
      button.textContent = expanded ? 'Show Fewer Materials' : 'View All ' + total + ' Aluminium Materials';
    }

    function cardFromHash() {
      var encoded = window.location.hash.slice(1);
      if (!encoded) return null;
      var id;
      try { id = decodeURIComponent(encoded); }
      catch (_) { id = encoded; }
      var card = document.getElementById(id);
      return card && grid.contains(card) && card.classList.contains('seo-catalogue-card') ? card : null;
    }

    // Enable disclosure only after all nodes are present. Direct links to any
    // subproduct remain accessible even when that card is beyond the initial set.
    var hashCard = cardFromHash();
    grid.classList.add('vmg-catalogue-collapsible');
    button.hidden = false;
    setExpanded(!!hashCard);

    button.addEventListener('click', function () {
      setExpanded(!expanded);
    });
    window.addEventListener('hashchange', function () {
      var target = cardFromHash();
      if (!target) return;
      setExpanded(true);
      window.requestAnimationFrame(function () {
        target.scrollIntoView({block: 'start', behavior: 'auto'});
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready, {once:true});
  } else {
    ready();
  }
})();

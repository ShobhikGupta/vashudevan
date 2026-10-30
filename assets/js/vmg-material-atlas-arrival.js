(function(){
  'use strict';
  function reveal(){
    if(!location.hash)return;
    var id;try{id=decodeURIComponent(location.hash.slice(1));}catch(e){id=location.hash.slice(1)}
    var el=document.getElementById(id);
    if(!el||!el.classList.contains('seo-catalogue-card'))return;
    var grid=el.closest('.seo-catalogue-grid');
    if(grid && grid.classList.contains('vmg-catalogue-collapsible')){
      grid.classList.add('is-expanded');
      var btn=document.querySelector('[aria-controls="'+grid.id+'"]');
      if(btn){btn.setAttribute('aria-expanded','true');btn.textContent='Show Fewer Materials'}
    }
    requestAnimationFrame(function(){
      el.scrollIntoView({block:'center',behavior:'auto'});
      el.classList.remove('vmg-material-arrived');
      void el.offsetWidth;
      el.classList.add('vmg-material-arrived');
      if(!el.hasAttribute('tabindex'))el.setAttribute('tabindex','-1');
      try{el.focus({preventScroll:true})}catch(e){el.focus()}
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',reveal,{once:true});else reveal();
  window.addEventListener('hashchange',reveal);
})();
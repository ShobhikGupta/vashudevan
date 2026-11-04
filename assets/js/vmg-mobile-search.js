/* VMG mobile search — native, catalogue-backed; no external UI libraries.
   Shared ranking helpers are exposed for the existing Products directory. */
(function(){
  'use strict';
  if(window.__vmgMobileSearchInitialized)return;
  window.__vmgMobileSearchInitialized=true;
  var ROOT='/assets/data/products.json';
  var cache=null;
  var loadPromise=null;
  function normalize(value){
    return String(value||'').toLowerCase()
      .replace(/aluminium/g,'aluminum')
      .replace(/non[\s-]?ferrous/g,'nonferrous')
      .replace(/&/g,' and ')
      .replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
  }
  function rank(text,term){
    var source=normalize(text),q=normalize(term);
    if(!q||!source)return Infinity;
    if(source===q)return 0;
    if(source.startsWith(q))return 1;
    if(source.includes(q))return 2;
    var terms=q.split(' ');
    if(terms.length>1&&terms.every(function(word){return source.split(' ').some(function(token){return token.startsWith(word);});}))return 3;
    return Infinity;
  }
  function catalogue(){
    if(cache)return Promise.resolve(cache);
    if(loadPromise)return loadPromise;
    loadPromise=fetch(ROOT,{credentials:'same-origin',cache:'no-cache'})
      .then(function(response){if(!response.ok)throw Error('Catalogue unavailable ('+response.status+')');return response.json();})
      .then(function(payload){
        if(!payload||!Array.isArray(payload.products)||!payload.products.length)throw Error('Invalid catalogue');
        cache=payload.products;
        return cache;
      })
      .catch(function(error){loadPromise=null;throw error;});
    return loadPromise;
  }
  window.VMGSearchCore={normalize:normalize,rank:rank,loadProducts:catalogue};

  var guides=[
    {name:'6061 vs 6063 Aluminium Scrap',keywords:'aluminum aluminium 6061 6063 alloy grade',href:'/resources/guides/aluminium-6061-vs-6063-scrap/'},
    {name:'What Is UBC Scrap?',keywords:'aluminum aluminium beverage cans ubc taldon',href:'/resources/guides/ubc-aluminium-scrap/'},
    {name:'Copper Scrap Grades',keywords:'copper berry candy birch cliff barley',href:'/resources/guides/copper-scrap-grades/'},
    {name:'Ferrous vs Non-Ferrous Scrap',keywords:'ferrous nonferrous basics steel copper brass',href:'/resources/guides/ferrous-vs-non-ferrous-scrap/'}
  ];
  var curated=['aluminum','copper','brass','stainless-steel','ferrous','lead'];
  var quick=['UBC','6063','HMS 1 & 2','Copper Berry','304 Solids','316 Solids','ZORBA','ZURIK'];
  var urls={
    aluminum:'/products/aluminium/',
    'auto-scrap':'/products/auto-scrap/',
    brass:'/products/brass/',copper:'/products/copper/',
    'copper-bearing':'/products/copper-bearing/',
    ferrous:'/products/ferrous/',lead:'/products/lead/',
    'shredder-scrap':'/products/shredder-scrap/',
    'stainless-steel':'/products/stainless-steel/',zinc:'/products/zinc/'
  };
  function label(p){return p.slug==='aluminum'?'Aluminium':p.name.toLowerCase().replace(/\b\w/g,function(c){return c.toUpperCase();});}
  function el(tag,className,textValue){
    var node=document.createElement(tag);
    if(className)node.className=className;
    if(textValue!==undefined)node.textContent=textValue;
    return node;
  }
  function urlFor(p,sub){
    var url=urls[p.slug]||'/products/';
    return sub?url+'#'+encodeURIComponent(sub.slug):url;
  }
  function makeLink(item,kind){
    var a=el('a','vmg-mobile-search-result');
    a.href=item.href;
    var img=item.img?el('img'):null;
    if(img){
      img.src=item.img;img.alt='';img.loading='lazy';img.decoding='async';
      img.addEventListener('error',function(){
        var fallback=el('span','vmg-mobile-search-fallback','▦');
        fallback.setAttribute('aria-hidden','true');
        if(img.parentNode)img.replaceWith(fallback);
      },{once:true});
      a.appendChild(img);
    }else{
      var fallback=el('span','vmg-mobile-search-fallback','▦');
      fallback.setAttribute('aria-hidden','true');a.appendChild(fallback);
    }
    var copy=el('span','vmg-mobile-search-resultcopy');
    copy.appendChild(el('strong',null,item.title));
    copy.appendChild(el('small',null,item.meta));
    var arrow=el('span','vmg-mobile-search-arrow','→');arrow.setAttribute('aria-hidden','true');
    a.append(copy,arrow);
    return a;
  }
  function init(){
    var row=document.querySelector('.site-header.vmg-econship-header .vmg-nav-brand-row');
    var hamburger=row&&row.querySelector('.nav-toggle');
    if(!row||!hamburger||document.querySelector('.vmg-mobile-search-trigger'))return;
    var button=el('button','vmg-mobile-search-trigger');
    button.type='button';button.setAttribute('aria-label','Search VMG materials and guides');
    button.setAttribute('aria-haspopup','dialog');
    button.setAttribute('aria-controls','vmg-mobile-search-dialog');
    button.setAttribute('aria-expanded','false');
    button.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="10.7" cy="10.7" r="6.5"/><path d="m16 16 5 5"/></svg>';
    row.insertBefore(button,hamburger);
    var dialog=el('div','vmg-mobile-search-dialog');
    dialog.id='vmg-mobile-search-dialog';
    dialog.setAttribute('role','dialog');
    dialog.setAttribute('aria-modal','true');
    dialog.setAttribute('aria-labelledby','vmg-mobile-search-title');
    dialog.hidden=true;
    var head=el('div','vmg-mobile-search-head');
    var titleRow=el('div','vmg-mobile-search-topline');
    var title=el('strong',null,'Search VMG');title.id='vmg-mobile-search-title';
    var closeButton=el('button','vmg-mobile-search-close');
    closeButton.type='button';closeButton.setAttribute('aria-label','Close search');
    closeButton.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 5 19 19M19 5 5 19"/></svg>';
    titleRow.append(title,closeButton);
    var field=el('div','vmg-mobile-search-field');
    field.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="10.5" cy="10.5" r="6.2"/><path d="m15 15 5 5"/></svg>';
    var input=el('input','vmg-mobile-search-input');
    input.type='search';input.autocomplete='off';input.autocorrect='off';input.spellcheck=false;
    input.placeholder='Search materials, grades, resources...';
    input.setAttribute('aria-label','Search materials, grades, and guides');
    var clearButton=el('button','vmg-mobile-search-clear','×');clearButton.type='button';
    clearButton.setAttribute('aria-label','Clear search');clearButton.hidden=true;
    field.append(input,clearButton);
    head.append(titleRow,field);
    var body=el('div','vmg-mobile-search-body');
    body.id='vmg-mobile-search-results';
    body.setAttribute('role','region');
    body.setAttribute('aria-label','Search suggestions and results');
    var status=el('p','vmg-mobile-search-summary');
    status.setAttribute('role','status');status.setAttribute('aria-live','polite');
    status.setAttribute('aria-atomic','true');
    dialog.append(head,body);
    document.body.appendChild(dialog);
    var opened=false,snapshot=[],lastFocus=null,restoreScroll=0,pushed=false;
    var products=null,error=null;
    function setBody(){
      snapshot=[];
      Array.from(document.body.children).forEach(function(node){
        if(node===dialog||node.tagName==='SCRIPT'||node.tagName==='STYLE')return;
        snapshot.push([node,node.inert]);
        node.inert=true;
      });
      restoreScroll=window.scrollY||0;
      document.body.classList.add('vmg-mobile-search-open');
    }
    function restoreBody(){
      snapshot.forEach(function(pair){pair[0].inert=pair[1];});
      snapshot=[];
      document.body.classList.remove('vmg-mobile-search-open');
    }
    function close(fromHistory){
      if(!opened)return;
      opened=false;
      dialog.hidden=true;
      dialog.setAttribute('aria-hidden','true');
      button.setAttribute('aria-expanded','false');
      restoreBody();
      if(lastFocus&&lastFocus.isConnected)lastFocus.focus({preventScroll:true});
      if(!fromHistory&&pushed&&history.state&&history.state.vmgSearchOverlay===true){
        pushed=false;history.back();
      }else pushed=false;
    }
    function open(){
      if(opened||!window.matchMedia('(max-width:991px)').matches)return;
      var nav=document.getElementById('site-nav');
      if(nav&&nav.classList.contains('open'))hamburger.click();
      var feedback=document.querySelector('.vmg-feedback-drawer[aria-hidden="false"] .vmg-feedback-close');
      if(feedback)feedback.click();
      lastFocus=document.activeElement;
      opened=true;setBody();
      dialog.hidden=false;dialog.setAttribute('aria-hidden','false');
      button.setAttribute('aria-expanded','true');
      input.value='';render();
      requestAnimationFrame(function(){input.focus({preventScroll:true});});
      try{
        var previous=history.state&&typeof history.state==='object'?history.state:{};
        history.pushState(Object.assign({},previous,{vmgSearchOverlay:true}),'',location.href);
        pushed=true;
      }catch(_){pushed=false;}
      if(!products)load();
    }
    function group(heading,count){
      var wrap=el('section','vmg-mobile-search-result-group');
      var h=el('h3','vmg-mobile-search-result-heading',heading);
      h.appendChild(el('small',null,String(count)));
      wrap.appendChild(h);return wrap;
    }
    function landing(){
      var intro=el('p','vmg-mobile-search-intro','Browse material categories or search by name, alloy, trade grade, or commonly used code.');
      body.appendChild(intro);
      var block=el('section','vmg-mobile-search-block');
      block.appendChild(el('h3','vmg-mobile-search-eyebrow','Explore Materials'));
      var grid=el('div','vmg-mobile-search-categories');
      curated.forEach(function(slug){
        var p=products.find(function(x){return x.slug===slug;});
        if(!p)return;
        var a=el('a','vmg-mobile-search-category');a.href=urlFor(p);
        a.appendChild(el('strong',null,label(p)));
        a.appendChild(el('small',null,p.subproducts.length+' material examples →'));
        grid.appendChild(a);
      });block.appendChild(grid);body.appendChild(block);
      var quickBlock=el('section','vmg-mobile-search-block');
      quickBlock.appendChild(el('h3','vmg-mobile-search-eyebrow','Quick Searches'));
      var chips=el('div','vmg-mobile-search-chips');
      quick.forEach(function(term){
        var b=el('button','vmg-mobile-search-chip',term);b.type='button';
        b.addEventListener('click',function(){input.value=term;input.focus();render();});
        chips.appendChild(b);
      });quickBlock.appendChild(chips);body.appendChild(quickBlock);
      var viewAll=el('a','vmg-mobile-search-more','View all material categories →');viewAll.href='/products/';
      body.appendChild(viewAll);
    }
    function render(){
      if(!opened)return;
      body.replaceChildren();
      var query=input.value.trim();
      clearButton.classList.toggle('is-visible',!!query);
      clearButton.hidden=!query;
      if(error){
        body.appendChild(el('p','vmg-mobile-search-error','Material search could not load. Check your connection and retry.'));
        var retry=el('button','vmg-mobile-search-retry','Retry search');
        retry.type='button';retry.addEventListener('click',load);
        body.appendChild(retry);
        return;
      }
      if(!products){
        body.appendChild(el('p','vmg-mobile-search-summary','Loading VMG material catalogue…'));
        return;
      }
      if(!query){landing();return;}
      var matchedCats=products.map(function(p,i){return {p:p,i:i,r:Math.min(rank(p.name,query),rank(p.slug,query))};})
        .filter(function(x){return Number.isFinite(x.r);})
        .sort(function(a,b){return a.r-b.r||a.i-b.i;});
      var matches=[],index=0;
      products.forEach(function(p){
        p.subproducts.forEach(function(sub){
          var direct=Math.min(rank(sub.name,query),rank(sub.slug,query));
          var combined=rank(p.name+' '+sub.name,query);
          var parent=rank(p.name,query);
          var r=Math.min(direct,Number.isFinite(combined)?combined+0.5:Infinity,Number.isFinite(parent)?parent+3:Infinity);
          if(Number.isFinite(r))matches.push({p:p,sub:sub,r:r,i:index});
          index++;
        });
      });
      matches.sort(function(a,b){return a.r-b.r||a.i-b.i;});
      var relevantGuides=guides.filter(function(g){return Number.isFinite(rank(g.name+' '+g.keywords,query));});
      var total=matchedCats.length+matches.length+relevantGuides.length;
      status.textContent=matchedCats.length+' categories · '+matches.length+' materials · '+relevantGuides.length+' guides';
      body.appendChild(status);
      if(!total){
        var empty=el('div','vmg-mobile-search-empty');
        empty.appendChild(el('strong',null,'No results found for “'+query+'”'));
        empty.appendChild(el('p',null,'Try another material, trade grade or keyword. You can also browse the complete catalogue.'));
        body.appendChild(empty);
      }
      if(matchedCats.length){
        var cats=group('Matching Categories',matchedCats.length);
        matchedCats.slice(0,4).forEach(function(x){cats.appendChild(makeLink({title:label(x.p),meta:x.p.subproducts.length+' material examples',img:x.p.icon,href:urlFor(x.p)}));});
        body.appendChild(cats);
      }
      if(matches.length){
        var mats=group('Matching Materials',matches.length);
        matches.slice(0,10).forEach(function(x){mats.appendChild(makeLink({title:x.sub.name,meta:label(x.p),img:x.sub.image||x.p.icon,href:urlFor(x.p,x.sub)}));});
        body.appendChild(mats);
      }
      if(relevantGuides.length){
        var res=group('Knowledge Guides',relevantGuides.length);
        relevantGuides.forEach(function(g){res.appendChild(makeLink({title:g.name,meta:'VMG Resources',href:g.href}));});
        body.appendChild(res);
      }
      if(matches.length>10||matchedCats.length>4){
        var more=el('a','vmg-mobile-search-more','View all matching materials →');
        more.href='/products/?q='+encodeURIComponent(query);
        body.appendChild(more);
      }
    }
    function load(){
      error=null;
      if(opened)render();
      catalogue().then(function(data){products=data;if(opened)render();})
        .catch(function(e){error=e;if(opened)render();});
    }
    button.addEventListener('click',open);
    closeButton.addEventListener('click',function(){close(false);});
    clearButton.addEventListener('click',function(){input.value='';render();input.focus();});
    input.addEventListener('input',render);
    dialog.addEventListener('keydown',function(event){
      if(event.key==='Escape'){
        event.preventDefault();event.stopPropagation();close(false);return;
      }
      if(event.key!=='Tab')return;
      var focusable=Array.from(dialog.querySelectorAll('button:not([hidden]):not([disabled]), a[href], input:not([disabled])'))
        .filter(function(node){return node.getClientRects().length>0;});
      if(!focusable.length)return;
      var first=focusable[0],last=focusable[focusable.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    });
    window.addEventListener('popstate',function(){if(opened)close(true);});
    window.addEventListener('resize',function(){if(opened&&window.innerWidth>=992)close(false);},{passive:true});
    document.addEventListener('click',function(event){
      if(!opened)return;
      if(event.target.closest('.nav-toggle'))close(false);
    },true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
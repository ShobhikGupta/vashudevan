/* VMG — accessible, continuously looping homepage gallery.
   Uses two identical groups and a measured wrap point for a seamless repeat. */
(function(){
 'use strict';
 const root=document.querySelector('[data-vmg-infinite-gallery]');
 if(!root)return;
 const viewport=root.querySelector('.vmg-gallery-viewport');
 const track=root.querySelector('.vmg-gallery-track');
 const tabs=Array.from(root.querySelectorAll('.vmg-gallery-tab'));
 const prev=root.querySelector('.vmg-gallery-nav--prev');
 const next=root.querySelector('.vmg-gallery-nav--next');
 if(!viewport||!track||!tabs.length)return;
 const groups={
  nonferrous:[
   {title:'Aluminium Extrusions',sub:'ALUMINIUM',img:'/assets/img/products/aluminum/6063_extrusions_toto.jpg',href:'/products/aluminium/'},
   {title:'Bare Bright Copper',sub:'COPPER',img:'/assets/img/products/copper/copper-bare-bright-wire.jpg',href:'/products/copper/'},
   {title:'Yellow Brass',sub:'BRASS',img:'/assets/img/products/BRASS/yellow_brass_honey.jpg',href:'/products/brass/'},
   {title:'Aluminium Wheels',sub:'ALUMINIUM',img:'/assets/img/products/aluminum/6061_truck_wheels_troma.jpg',href:'/products/aluminium/'},
   {title:'Copper Wire Scrap',sub:'COPPER',img:'/assets/img/products/copper/copper-berry-candy.jpg',href:'/products/copper/'},
   {title:'Brass Auto Radiators',sub:'BRASS',img:'/assets/img/products/BRASS/brass_auto_radiators_ocean.jpg',href:'/products/brass/'}
  ],
  ferrous:[
   {title:'HMS 1 & 2',sub:'FERROUS',img:'/assets/img/products/Ferrous/hms_1_2.jpg',href:'/products/ferrous/'},
   {title:'LMS Bales',sub:'FERROUS',img:'/assets/img/products/Ferrous/lms_bales.jpg',href:'/products/ferrous/'},
   {title:'Rail Scrap',sub:'FERROUS',img:'/assets/img/products/Ferrous/rail_scrap.jpg',href:'/products/ferrous/'},
   {title:'Cast Rotors & Drums',sub:'FERROUS',img:'/assets/img/products/Ferrous/cast_rotors_drums.jpg',href:'/products/ferrous/'},
   {title:'Re-Rolling Scrap',sub:'FERROUS',img:'/assets/img/products/Ferrous/re_rolling_scrap.jpg',href:'/products/ferrous/'},
   {title:'Steel Turnings',sub:'FERROUS',img:'/assets/img/products/Ferrous/steel_turnings.jpg',href:'/products/ferrous/'}
  ],
  shredder:[
   {title:'ZORBA',sub:'SHREDDER SCRAP',img:'/assets/img/products/shredder_scrap/ZORBA.jpg',href:'/products/shredder-scrap/'},
   {title:'ZURIK',sub:'SHREDDER SCRAP',img:'/assets/img/products/shredder_scrap/ZURIK.jpg',href:'/products/shredder-scrap/'},
   {title:'Alternators',sub:'AUTO SCRAP',img:'/assets/img/products/auto_scrap/Alternators.jpg',href:'/products/auto-scrap/'},
   {title:'AC Compressors',sub:'AUTO SCRAP',img:'/assets/img/products/auto_scrap/ac_compressors.jpg',href:'/products/auto-scrap/'},
   {title:'Shredded Aluminium',sub:'SHREDDER SCRAP',img:'/assets/img/products/shredder_scrap/shredded_aluminum.jpg',href:'/products/shredder-scrap/'},
   {title:'Electric Motors',sub:'COPPER BEARING',img:'/assets/img/products/copper_bearing/small_motors_elmo.jpg',href:'/products/copper-bearing/'}
  ]
 };
 let current='nonferrous',offset=0,loopWidth=1,last=0,frame=0,paused=false,hovered=false,focused=false,hidden=false;
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
 const makeGroup=(items,duplicate)=>{
  const el=document.createElement('div');el.className='vmg-gallery-group';
  if(duplicate){el.setAttribute('aria-hidden','true');el.inert=true;}
  for(const item of items){
   const a=document.createElement('a');a.className='vmg-gallery-card';a.href=item.href;if(duplicate)a.tabIndex=-1;
   const visual=document.createElement('span');visual.className='vmg-gallery-image';
   const img=document.createElement('img');img.src=item.img;img.alt=item.title+' recyclable metal';img.loading='lazy';img.decoding='async';
   visual.append(img);
   const caption=document.createElement('span');caption.className='vmg-gallery-caption';
   const title=document.createElement('strong');title.textContent=item.title;
   const sub=document.createElement('small');sub.textContent=item.sub;
   caption.append(title,sub);a.append(visual,caption);el.appendChild(a);
  }return el;
 };
 const measure=()=>{
  const width=viewport.clientWidth,gap=14;
  const visible=window.innerWidth<=640?1:window.innerWidth<=900?2:3;
  root.style.setProperty('--vmg-gallery-card-width',Math.max(180,(width-gap*(visible-1))/visible)+'px');
  const group=track.firstElementChild;
  if(group){
   loopWidth=group.getBoundingClientRect().width+gap;
   if(loopWidth>0)offset=((offset%loopWidth)+loopWidth)%loopWidth;
  }
  draw();
 };
 const draw=()=>{track.style.transform='translate3d('+(-offset)+'px,0,0)';};
 const setTab=(key,focus)=>{
  if(!groups[key])return;
  current=key;offset=0;last=0;track.replaceChildren(makeGroup(groups[key],false),makeGroup(groups[key],true));
  tabs.forEach(tab=>{const active=tab.dataset.vmgGalleryTab===key;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;if(active&&focus)tab.focus();});
  measure();
 };
 const step=(direction)=>{
  const group=track.firstElementChild;
  const card=group?.querySelector('.vmg-gallery-card');
  const distance=(card?.getBoundingClientRect().width||300)+14;
  offset=((offset+direction*distance)%loopWidth+loopWidth)%loopWidth;
  draw();last=0;
 };
 const tick=time=>{
  frame=requestAnimationFrame(tick);
  if(!last){last=time;return;}
  const dt=Math.min(time-last,50);last=time;
  if(paused||hovered||focused||hidden||reduce.matches||loopWidth<=0)return;
  offset=(offset+(dt*.035))%loopWidth;draw();
 };
 tabs.forEach((tab,i)=>{
  tab.addEventListener('click',()=>setTab(tab.dataset.vmgGalleryTab,false));
  tab.addEventListener('keydown',event=>{
   if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;
   event.preventDefault();
   const index=event.key==='Home'?0:event.key==='End'?tabs.length-1:(i+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
   setTab(tabs[index].dataset.vmgGalleryTab,true);
  });
 });
 prev?.addEventListener('click',()=>step(-1));
 next?.addEventListener('click',()=>step(1));
 root.addEventListener('mouseenter',()=>{hovered=true;});
 root.addEventListener('mouseleave',()=>{hovered=false;last=0;});
 root.addEventListener('focusin',()=>{focused=true;});
 root.addEventListener('focusout',event=>{if(!root.contains(event.relatedTarget)){focused=false;last=0;}});
 document.addEventListener('visibilitychange',()=>{hidden=document.hidden;last=0;});
 let touchX=null;
 viewport.addEventListener('touchstart',e=>{touchX=e.touches[0]?.clientX??null;},{passive:true});
 viewport.addEventListener('touchend',e=>{if(touchX===null)return;const d=(e.changedTouches[0]?.clientX??touchX)-touchX;if(Math.abs(d)>35)step(d<0?1:-1);touchX=null;},{passive:true});
 const ro=window.ResizeObserver?new ResizeObserver(measure):null;
 if(ro)ro.observe(viewport);else window.addEventListener('resize',measure,{passive:true});
 setTab(current,false);
 frame=requestAnimationFrame(tick);
 window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);ro?.disconnect();},{once:true});
})();
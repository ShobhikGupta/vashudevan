(function(){
  'use strict';

  var LOGOS={
    mrai:'/assets/img/footer-logos/mrai.png',
    bir:'/assets/img/footer-logos/bir.png',
    recycleinme:'/assets/img/footer-logos/recycleinme.png',
    duns:'/assets/img/footer-logos/duns.png',
    iec:'/assets/img/footer-logos/iec.png',
    gst:'/assets/img/footer-logos/gst.png',
    msme:'/assets/img/footer-logos/msme.png'
  };

  var socials=[
    ['WhatsApp','https://wa.me/919879208178','<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.04 2C6.56 2 2.1 6.42 2.1 11.86c0 1.74.46 3.43 1.34 4.92L2 22l5.39-1.41a9.98 9.98 0 0 0 4.65 1.18h.01c5.48 0 9.94-4.42 9.94-9.86C22 6.42 17.53 2 12.04 2Zm0 17.98h-.01a8.18 8.18 0 0 1-4.17-1.14l-.3-.18-3.2.84.86-3.1-.2-.32a8.05 8.05 0 0 1-1.26-4.22c0-4.46 3.71-8.08 8.28-8.08 4.57 0 8.29 3.62 8.29 8.08 0 4.46-3.72 8.12-8.29 8.12Z"/></svg>'],
    ['Facebook','https://www.facebook.com/profile.php?id=61577681908111','<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 22v-9h3l.45-3.5H13.5V7.25c0-1.01.28-1.7 1.73-1.7H17V2.42c-.31-.04-1.37-.13-2.61-.13-2.58 0-4.35 1.58-4.35 4.48V9.5H7.12V13h2.92v9h3.46Z"/></svg>'],
    ['LinkedIn','https://www.linkedin.com/company/109161337/','<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5.4 7.9H2.2V22h3.2V7.9ZM3.8 2A1.9 1.9 0 1 0 3.8 5.8 1.9 1.9 0 0 0 3.8 2ZM22 13.9c0-4.25-2.27-6.23-5.3-6.23-2.45 0-3.54 1.34-4.15 2.28V7.9H9.36V22h3.19v-6.98c0-1.84.35-3.62 2.63-3.62 2.25 0 2.28 2.1 2.28 3.74V22H22v-8.1Z"/></svg>'],
    ['Instagram','https://www.instagram.com/vashudevan_metglobal_llp?igsh=NWJrZjQ3MTNqdTU4&utm_source=qr','<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm0 2A3.8 3.8 0 0 0 4 7.8v8.4A3.8 3.8 0 0 0 7.8 20h8.4a3.8 3.8 0 0 0 3.8-3.8V7.8A3.8 3.8 0 0 0 16.2 4H7.8Zm8.7 1.5a1.35 1.35 0 1 1 0 2.7 1.35 1.35 0 0 1 0-2.7ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/></svg>']
  ];

  function trustCard(key,title,detail,href){
    var tag=href?'a':'div';
    var attrs=href?' href="'+href+'" target="_blank" rel="noopener noreferrer" aria-label="Verify '+title+' externally"':'';
    var external=href?'<span class="vmg-footer-external">Verify externally ↗</span>':'';
    return '<'+tag+' class="vmg-footer-trust-card" data-logo-key="'+key+'"'+attrs+'><div class="vmg-footer-trust-logo"><img src="'+LOGOS[key]+'" alt="'+title+' logo" loading="lazy"></div><div class="vmg-footer-trust-copy"><strong>'+title+'</strong>'+(detail?'<span>'+detail+'</span>':'')+external+'</div></'+tag+'>';
  }

  function socialMarkup(){
    return socials.map(function(s){return '<a href="'+s[1]+'" target="_blank" rel="noopener noreferrer" aria-label="'+s[0]+'">'+s[2]+'</a>';}).join('');
  }

  function createFooter(){
    var footer=document.createElement('footer');
    footer.className='site-footer vmg-global-footer';
    footer.innerHTML='\
      <div class="vmg-footer-trust-zone">\
        <div class="vmg-footer-wrap">\
          <h2 class="vmg-footer-section-title">Proud Member Of</h2>\
          <div class="vmg-footer-member-grid">\
            '+trustCard('mrai','MRAI','Member')+trustCard('bir','BIR','Member')+trustCard('recycleinme','RecycleInMe','Premium Member')+'\
          </div>\
          <h2 class="vmg-footer-section-title vmg-footer-verified-title">Verified &amp; Registered</h2>\
          <div class="vmg-footer-verify-grid">\
            '+trustCard('duns','D-U-N-S','861572919','https://www.dnb.com/business-directory/company-profiles.vashudevan_metglobal_llp.136a46a739ed77d5feca2ac7ba44975f.html')+trustCard('iec','IEC','IEC Registered')+trustCard('gst','GST','GSTIN 24AARFV7153Q1Z7')+trustCard('msme','MSME','MSME Registered')+'\
          </div>\
        </div>\
      </div>\
      <div class="vmg-footer-main">\
        <div class="vmg-footer-wrap vmg-footer-main-inner">\
          <ul class="vmg-footer-mini-links" aria-label="Footer links">\
            <li><a href="/resources.html#faq">FAQ</a></li>\
            <li><button type="button" data-vmg-legal-pending="Privacy Policy">Privacy Policy</button></li>\
            <li><button type="button" data-vmg-legal-pending="Terms &amp; Conditions">Terms &amp; Conditions</button></li>\
            <li><a href="/VMG_BROCHURE.pdf" target="_blank" rel="noopener">Company Profile</a></li>\
            <li><a href="/contact.html">Contact Us</a></li>\
          </ul>\
          <div class="vmg-footer-subscribe-row">\
            <div class="vmg-footer-subscribe-copy"><strong>VMG Trade Updates</strong><span>Occasional recyclable-metal market updates.</span></div>\
            <form class="vmg-footer-subscribe-form" data-vmg-subscribe-form novalidate><div class="vmg-footer-subscribe-controls"><input class="vmg-footer-subscribe-input" type="email" name="email" autocomplete="email" placeholder="Business email address" aria-label="Business email address" aria-describedby="vmg-footer-subscribe-status" aria-invalid="false" required><button class="vmg-footer-subscribe-button" type="submit">Subscribe</button></div><p class="vmg-footer-subscribe-status" id="vmg-footer-subscribe-status" role="status" aria-live="polite"></p></form>\
          </div>\
          <div class="vmg-footer-bottom">\
            <a class="vmg-footer-brand-lockup" href="/index.html"><strong>Vashudevan MetGlobal LLP</strong></a>\
            <span class="vmg-footer-copyright">© 2026 Vashudevan MetGlobal LLP. All rights reserved.</span>\
            <div class="vmg-footer-socials">'+socialMarkup()+'</div>\
          </div>\
        </div>\
      </div>';
    return footer;
  }

  function ensureToast(){
    var toast=document.querySelector('.vmg-footer-legal-toast');
    if(toast)return toast;
    toast=document.createElement('div');
    toast.className='vmg-footer-legal-toast';
    toast.setAttribute('role','status');
    toast.setAttribute('aria-live','polite');
    document.body.appendChild(toast);
    return toast;
  }

  function bindLegalPending(footer){
    var toast=ensureToast();
    var timer=null;
    footer.querySelectorAll('[data-vmg-legal-pending]').forEach(function(btn){
      btn.addEventListener('click',function(){
        toast.textContent=btn.getAttribute('data-vmg-legal-pending')+' page is being prepared and will be linked here.';
        toast.classList.add('is-visible');
        clearTimeout(timer);
        timer=setTimeout(function(){toast.classList.remove('is-visible');},2800);
      });
    });
  }

  function bindSubscribe(footer){
    var form=footer.querySelector('[data-vmg-subscribe-form]');
    if(!form)return;
    var input=form.querySelector('.vmg-footer-subscribe-input');
    var button=form.querySelector('.vmg-footer-subscribe-button');
    var status=form.querySelector('.vmg-footer-subscribe-status');

    function clearStatus(){
      status.textContent='';
      status.className='vmg-footer-subscribe-status';
      input.setAttribute('aria-invalid','false');
    }

    input.addEventListener('input',clearStatus);

    form.addEventListener('submit',function(event){
      event.preventDefault();
      clearStatus();
      var email=(input.value||'').trim();
      if(!email){
        status.textContent='Please enter your business email.';
        status.classList.add('is-error');
        input.setAttribute('aria-invalid','true');
        input.focus();
        return;
      }
      if(!input.checkValidity()){
        status.textContent='Please enter a valid business email.';
        status.classList.add('is-error');
        input.setAttribute('aria-invalid','true');
        input.focus();
        return;
      }

      var endpoint=window.AppConfig&&window.AppConfig.googleScriptUrl;
      if(!endpoint){
        status.textContent='Subscription is temporarily unavailable.';
        status.classList.add('is-error');
        return;
      }

      button.disabled=true;
      button.textContent='Sending…';
      status.textContent='Sending subscription request…';

      fetch(endpoint,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({source:'trade-updates-subscription',type:'Trade Updates Subscription',email:email,'MAIL ID':email,page:window.location.href,submittedAt:new Date().toISOString()})})
        .then(function(){
          status.textContent='Thank you. Your subscription request was sent.';
          status.classList.add('is-success');
          form.reset();
        })
        .catch(function(){
          status.textContent='Could not send the request. Please try again.';
          status.classList.add('is-error');
        })
        .finally(function(){
          button.disabled=false;
          button.textContent='Subscribe';
        });
    });
  }

  function init(){
    var existing=document.querySelector('footer.site-footer');
    var footer=createFooter();
    if(existing){existing.replaceWith(footer);}else{document.body.appendChild(footer);}
    document.querySelectorAll('footer.site-footer').forEach(function(node,index){if(index>0)node.remove();});
    bindLegalPending(footer);
    bindSubscribe(footer);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

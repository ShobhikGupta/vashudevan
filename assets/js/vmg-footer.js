(function(){
  'use strict';

  var socials = [
    ['WhatsApp','https://wa.me/919879208178','<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.04 2C6.56 2 2.1 6.42 2.1 11.86c0 1.74.46 3.43 1.34 4.92L2 22l5.39-1.41a9.98 9.98 0 0 0 4.65 1.18h.01c5.48 0 9.94-4.42 9.94-9.86C22 6.42 17.53 2 12.04 2Zm0 17.98h-.01a8.18 8.18 0 0 1-4.17-1.14l-.3-.18-3.2.84.86-3.1-.2-.32a8.05 8.05 0 0 1-1.26-4.22c0-4.46 3.71-8.08 8.28-8.08 4.57 0 8.29 3.62 8.29 8.08 0 4.46-3.72 8.12-8.29 8.12Z"/></svg>'],
    ['Facebook','https://www.facebook.com/profile.php?id=61577681908111','<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 22v-9h3l.45-3.5H13.5V7.25c0-1.01.28-1.7 1.73-1.7H17V2.42c-.31-.04-1.37-.13-2.61-.13-2.58 0-4.35 1.58-4.35 4.48V9.5H7.12V13h2.92v9h3.46Z"/></svg>'],
    ['LinkedIn','https://www.linkedin.com/company/109161337/','<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5.4 7.9H2.2V22h3.2V7.9ZM3.8 2A1.9 1.9 0 1 0 3.8 5.8 1.9 1.9 0 0 0 3.8 2ZM22 13.9c0-4.25-2.27-6.23-5.3-6.23-2.45 0-3.54 1.34-4.15 2.28V7.9H9.36V22h3.19v-6.98c0-1.84.35-3.62 2.63-3.62 2.25 0 2.28 2.1 2.28 3.74V22H22v-8.1Z"/></svg>'],
    ['Instagram','https://www.instagram.com/vashudevan_metglobal_llp?igsh=NWJrZjQ3MTNqdTU4&utm_source=qr','<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm0 2A3.8 3.8 0 0 0 4 7.8v8.4A3.8 3.8 0 0 0 7.8 20h8.4a3.8 3.8 0 0 0 3.8-3.8V7.8A3.8 3.8 0 0 0 16.2 4H7.8Zm8.7 1.5a1.35 1.35 0 1 1 0 2.7 1.35 1.35 0 0 1 0-2.7ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/></svg>']
  ];

  function trustCard(key, mark, title, subtitle){
    return '<div class="vmg-footer-trust-card vmg-footer-image-ready" data-logo-key="'+key+'"><div class="vmg-footer-trust-mark">'+mark+'</div><div class="vmg-footer-trust-copy"><strong>'+title+'</strong><span>'+subtitle+'</span></div></div>';
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
            '+trustCard('mrai','MRAI','Material Recycling Association of India','Indian recycling industry association')+'\
            '+trustCard('bir','BIR','Bureau of International Recycling','Global recycling federation')+'\
            '+trustCard('recycleinme','RIM','Premium Member — RecycleInMe','Global B2B scrap platform')+'\
          </div>\
          <h2 class="vmg-footer-section-title">Verified &amp; Registered</h2>\
          <div class="vmg-footer-verify-grid">\
            '+trustCard('duns','D-U-N-S','D-U-N-S Registered','Business identification record')+'\
            '+trustCard('iec','IEC','IEC Registered','Import Export Code')+'\
            '+trustCard('gst','GST','GST Registered','Goods &amp; Services Tax')+'\
            '+trustCard('msme','MSME','MSME Registered','Micro, Small &amp; Medium Enterprises')+'\
          </div>\
        </div>\
      </div>\
      <div class="vmg-footer-main">\
        <div class="vmg-footer-wrap">\
          <div class="vmg-footer-main-grid">\
            <div class="vmg-footer-brand">\
              <div class="vmg-footer-brand-lockup"><img src="/assets/img/vmg-header-logo.svg" alt="Vashudevan MetGlobal LLP logo"><strong>Vashudevan MetGlobal LLP</strong></div>\
              <p class="vmg-footer-tagline">Recycle. Resource. Responsibly.</p>\
              <p class="vmg-footer-brand-copy">Global recyclable-metal sourcing, supply and trade coordination with a focus on dependable relationships and responsible recycling.</p>\
            </div>\
            <div>\
              <h3 class="vmg-footer-col-title">Explore</h3>\
              <ul class="vmg-footer-list">\
                <li><a href="/index.html">Home</a></li>\
                <li><a href="/who-we-are.html">About Us</a></li>\
                <li><a href="/products.html">Products</a></li>\
                <li><a href="/market-prices">Market Prices</a></li>\
                <li><a href="/resources.html">Resources</a></li>\
                <li><a href="/contact.html">Contact Us</a></li>\
              </ul>\
            </div>\
            <div>\
              <h3 class="vmg-footer-col-title">Resources &amp; Help</h3>\
              <ul class="vmg-footer-list">\
                <li><a href="/resources.html#faq">FAQ</a></li>\
                <li><a href="/VMG_BROCHURE.pdf" target="_blank" rel="noopener">Company Profile</a></li>\
                <li><a href="/resources.html">Documentation Support</a></li>\
                <li><button type="button" data-vmg-legal-pending="Privacy Policy">Privacy Policy</button></li>\
                <li><button type="button" data-vmg-legal-pending="Terms &amp; Conditions">Terms &amp; Conditions</button></li>\
              </ul>\
            </div>\
            <div>\
              <h3 class="vmg-footer-col-title">Contact</h3>\
              <div class="vmg-footer-contact">Office No. 501, 5th Floor, Western Business Park, Vesu, Surat, Gujarat, India – 395007<br><br><a href="tel:+919879208178">+91 9879208178</a><br><a href="mailto:exim@vashudevan.com">exim@vashudevan.com</a></div>\
              <div class="vmg-footer-socials">'+socialMarkup()+'</div>\
            </div>\
          </div>\
          <div class="vmg-footer-bottom"><span>© 2026 Vashudevan MetGlobal LLP. All rights reserved.</span><span class="vmg-footer-note">Global recyclable-metal sourcing &amp; supply coordination.</span></div>\
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

  function init(){
    var existing=document.querySelector('footer.site-footer');
    var footer=createFooter();
    if(existing){existing.replaceWith(footer);}else{document.body.appendChild(footer);}

    var extra=document.querySelectorAll('footer.site-footer');
    extra.forEach(function(node,index){if(index>0)node.remove();});

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

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

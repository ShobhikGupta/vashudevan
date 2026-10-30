(function () {
  'use strict';
  if (window.VMGCountryPhone) return;

  var raw = 'af:93,al:355,dz:213,as:1684,ad:376,ao:244,ai:1264,ag:1268,ar:54,am:374,aw:297,au:61,at:43,az:994,bs:1242,bh:973,bd:880,bb:1246,by:375,be:32,bz:501,bj:229,bm:1441,bt:975,bo:591,bq:599,ba:387,bw:267,br:55,io:246,vg:1284,bn:673,bg:359,bf:226,bi:257,cv:238,kh:855,cm:237,ca:1,ky:1345,cf:236,td:235,cl:56,cn:86,cx:61,cc:61,co:57,km:269,ck:682,cr:506,hr:385,cu:53,cw:599,cy:357,cz:420,cd:243,dk:45,dj:253,dm:1767,do:1809,tl:670,ec:593,eg:20,sv:503,gq:240,er:291,ee:372,sz:268,et:251,fk:500,fo:298,fm:691,fj:679,fi:358,fr:33,gf:594,pf:689,ga:241,gm:220,ge:995,de:49,gh:233,gi:350,gr:30,gl:299,gd:1473,gp:590,gu:1671,gt:502,gg:44,gn:224,gw:245,gy:592,ht:509,hn:504,hk:852,hu:36,is:354,in:91,id:62,ir:98,iq:964,ie:353,im:44,il:972,it:39,ci:225,jm:1876,jp:81,je:44,jo:962,kz:7,ke:254,ki:686,kw:965,kg:996,la:856,lv:371,lb:961,ls:266,lr:231,ly:218,li:423,lt:370,lu:352,mo:853,mg:261,mw:265,my:60,mv:960,ml:223,mt:356,mh:692,mq:596,mr:222,mu:230,yt:262,mx:52,md:373,mc:377,mn:976,me:382,ms:1664,ma:212,mz:258,mm:95,na:264,nr:674,np:977,nl:31,nc:687,nz:64,ni:505,ne:227,ng:234,nu:683,nf:672,kp:850,mp:1670,no:47,om:968,pk:92,pw:680,ps:970,pa:507,pg:675,py:595,pe:51,ph:63,pn:64,pl:48,pt:351,pr:1787,qa:974,mk:389,cg:242,ro:40,ru:7,rw:250,re:262,bl:590,sh:290,kn:1869,lc:1758,mf:590,pm:508,vc:1784,ws:685,sm:378,st:239,sa:966,sn:221,rs:381,sc:248,sl:232,sg:65,sx:1721,sk:421,si:386,sb:677,so:252,za:27,gs:500,kr:82,ss:211,es:34,lk:94,sd:249,sr:597,sj:47,se:46,ch:41,sy:963,tw:886,tj:992,tz:255,th:66,tg:228,tk:690,to:676,tt:1868,tn:216,tr:90,tm:993,tc:1649,tv:688,vi:1340,ug:256,ua:380,ae:971,gb:44,us:1,uy:598,uz:998,vu:678,va:379,ve:58,vn:84,wf:681,eh:212,ye:967,zm:260,zw:263,ax:358';
  var explicitNames = {
    in:'India', fr:'France', mg:'Madagascar', is:'Iceland', gb:'United Kingdom', us:'United States',
    ae:'United Arab Emirates', mu:'Mauritius', bd:'Bangladesh', cn:'China', sg:'Singapore', au:'Australia',
    kr:'South Korea', kp:'North Korea', ps:'Palestine', va:'Vatican City', ci:"Côte d'Ivoire", cv:'Cabo Verde',
    cz:'Czech Republic', sz:'Eswatini', mk:'North Macedonia', tw:'Taiwan', tl:'Timor-Leste', me:'Montenegro', mm:'Myanmar'
  };
  var displayNames = null;
  try { displayNames = new Intl.DisplayNames(['en'], { type: 'region' }); } catch (_) {}

  function slugify(value) {
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  var countries = raw.split(',').map(function (item) {
    var parts = item.split(':');
    var iso2 = parts[0];
    var name = explicitNames[iso2] || (displayNames && displayNames.of(iso2.toUpperCase())) || iso2.toUpperCase();
    return { value: slugify(name), name: name, iso2: iso2, dialCode: parts[1] };
  }).sort(function (a, b) { return a.name.localeCompare(b.name); });

  var byValue = Object.create(null);
  var byIso2 = Object.create(null);
  countries.forEach(function (entry) {
    byValue[entry.value] = entry;
    byValue[slugify(entry.name)] = entry;
    byIso2[entry.iso2] = entry;
  });

  function getByValue(value) {
    var rawValue = String(value == null ? '' : value).trim().toLowerCase();
    return byIso2[rawValue] || byValue[slugify(rawValue)] || null;
  }
  function getDialCode(value) { var entry = getByValue(value); return entry ? entry.dialCode : ''; }
  function getIso2(value) { var entry = getByValue(value); return entry ? entry.iso2 : ''; }
  function nationalDigits(value) { return String(value == null ? '' : value).replace(/\D/g, ''); }
  function canonicalPhone(countryValue, nationalValue) {
    var entry = getByValue(countryValue), national = nationalDigits(nationalValue);
    return entry && national ? '+' + entry.dialCode + national : '';
  }
  function formatDisplayPhone(countryValue, nationalValue) {
    var entry = getByValue(countryValue), national = nationalDigits(nationalValue);
    return entry && national ? '+' + entry.dialCode + ' ' + national : '';
  }
  function optionMarkup(selectedValue) {
    var selected = getByValue(selectedValue || 'india');
    return '<option value="">Select country</option>' + countries.map(function (entry) {
      return '<option value="' + entry.value + '"' + (selected && entry.iso2 === selected.iso2 ? ' selected' : '') + '>' + entry.name + '</option>';
    }).join('');
  }

  window.VMGCountryPhone = Object.freeze({
    countries: countries.slice(),
    count: countries.length,
    getByValue: getByValue,
    getDialCode: getDialCode,
    getIso2: getIso2,
    nationalDigits: nationalDigits,
    canonicalPhone: canonicalPhone,
    formatDisplayPhone: formatDisplayPhone,
    optionMarkup: optionMarkup,
    defaultCountry: byIso2.in
  });

  document.dispatchEvent(new CustomEvent('vmg:country-phone-ready', { detail: { count: countries.length } }));
})();

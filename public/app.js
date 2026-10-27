(function(){
var dataEl=document.getElementById('data');
var C=JSON.parse(dataEl.textContent);
var app=document.getElementById('app'),bar=document.getElementById('bar');
var ui={plan:'prem',qty:1,vat:false,editing:false,canEdit:false,saving:false};
var KEYS=['std','rez','prem'];
var PAL=[{a:'#00E5FF',b:'#FF2D95'},{a:'#B6FF3B',b:'#7A5CFF'},{a:'#FF7A1A',b:'#2D7BFF'},{a:'#FF3B5C',b:'#FFD23B'}];
var palI=0,accI=0;
var HEAD='<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<title>Weby a rezervační systémy</title>\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">';
var TPL={feat:'Nová položka',steps:{t:'Nový krok',d:'Popis kroku.'},faq:{q:'Nová otázka',a:'Odpověď.'},people:{name:'Jméno',role:'',email:''}};
var CHECK='<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
var ICONS=['<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/></svg>','<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/></svg>','<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9a2.8 2.8 0 00-4-4L4 16z"/></svg>'];

function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function get(p){return p.split('.').reduce(function(o,k){return o==null?o:o[k]},C)}
function set(p,v){var ks=p.split('.');var l=ks.pop();ks.reduce(function(o,k){return o[k]},C)[l]=v}
function nf(n){return new Intl.NumberFormat('cs-CZ').format(n)}
function t(p){return '<span data-path="'+p+'">'+esc(get(p))+'</span>'}
function n(p){return '<span data-path="'+p+'" data-num="1">'+nf(get(p))+'</span>'}
function del(path,i){return '<button class="x ed-only" data-del="'+path+'|'+i+'" aria-label="Odebrat">×</button>'}
function addb(path,label){return '<button class="addb ed-only" data-add="'+path+'">+ '+label+'</button>'}
function vatOf(k){return Math.round(C[k].price*(1+C.vat/100))}
function badge(k){var b=C[k].badge;return (b||ui.editing)?'<span class="badge" data-path="'+k+'.badge">'+esc(b)+'</span>':''}

/* ---------- sections ---------- */
function header(){
  return '<header class="top"><div class="wrap"><a class="brand" href="#top"><i></i>'+t('brand')+'</a><nav><a href="#cenik">Ceník</a><a href="#postup">Postup</a><a href="#faq">Otázky</a>'+
  '<a class="btn acc sm" href="#kontakt">'+t('navcta')+'</a></nav></div></header>'+dots();
}
var SECS=[['top','Úvod'],['cenik','Ceník'],['postup','Postup'],['kontakt','Kontakt']];
function dots(){
  return '<nav class="dots" aria-label="Sekce stránky">'+SECS.map(function(s){return '<button data-go="'+s[0]+'" aria-label="'+s[1]+'"><span>'+s[1]+'</span><i></i></button>'}).join('')+'</nav>';
}
function hero(){
  return '<section class="hero" id="top"><div class="wrap"><div><h1 class="glitch" id="h1" data-text="'+esc(C.h1)+'">'+t('h1')+'</h1>'+
  '<p class="rot">Právě děláme pro: <b id="rot">plesy</b></p><p class="lead">'+t('sub')+'</p>'+
  '<div class="cta"><a class="btn acc" href="#spocitat">'+t('c1')+'</a><a class="btn" href="#cenik">'+t('c2')+'</a></div>'+
  '<ul class="hf">'+C.facts.map(function(f,i){return '<li>'+CHECK+'<span><b>'+t('facts.'+i+'.t')+'.</b> '+t('facts.'+i+'.d')+'</span></li>'}).join('')+'</ul>'+
  '<p class="hint3d">Klikněte na obrazovku ve 3D: prstenec se otočí a vyberete balíček.</p></div></div></section>';
}
function facts(){
  return '<section class="soft" style="padding:34px 0"><div class="wrap"><div class="facts">'+C.facts.map(function(f,i){
    return '<div class="fact"><span class="ic">'+(ICONS[i]||CHECK)+'</span><div><b>'+t('facts.'+i+'.t')+'</b><span class="d">'+t('facts.'+i+'.d')+'</span></div></div>';
  }).join('')+'</div></div></section>';
}
function plan(k){
  var P=C[k];
  return '<article class="plan'+(k==='prem'?' hl':'')+'" data-k="'+k+'"><img class="shot" data-shot="'+k+'" alt="Ukázka webu v balíčku '+esc(P.name)+'" width="640" height="400"><div class="ph"><h3>'+t(k+'.name')+'</h3>'+badge(k)+'</div><p class="tag">'+t(k+'.tag')+'</p>'+
  '<div class="price">'+n(k+'.price')+'<span> Kč</span></div><p class="vat mono">bez DPH · jednorázově · s DPH <span data-vat-of="'+k+'">'+nf(vatOf(k))+'</span> Kč</p>'+
  '<p class="pd">'+t(k+'.desc')+'</p><ul class="feat">'+P.feat.map(function(_,i){return '<li>'+CHECK+'<span>'+t(k+'.feat.'+i)+'</span>'+del(k+'.feat',i)+'</li>'}).join('')+addb(k+'.feat','Přidat položku')+'</ul>'+
  '<a class="btn'+(k==='prem'?' acc':'')+'" href="#spocitat" data-pick="'+k+'">Vybrat '+esc(P.name)+'</a></article>';
}
function plans(){
  return '<section class="sec" id="cenik"><div class="wrap"><div class="head"><h2>'+t('plansTitle')+'</h2><p>'+t('plansLead')+'</p></div><div class="plans">'+KEYS.map(plan).join('')+'</div>'+calcPanel()+'</div></section>';
}
function calcPanel(){
  return '<div class="card calc2" id="spocitat"><div><h3>'+t('calcTitle')+'</h3><div class="seg" role="radiogroup" aria-label="Balíček">'+KEYS.map(function(k){return '<button data-plan="'+k+'" role="radio">'+esc(C[k].name)+'</button>'}).join('')+'</div><p class="muted" id="c-tag" style="margin-top:12px"></p></div>'+
  '<div><div class="qty" style="margin-top:0;padding-top:0;border-top:0"><div><b>Počet webů</b><small>například více webů pro jednu školu</small></div><div class="st"><button data-qty="-1" aria-label="Méně">−</button><b id="q">1</b><button data-qty="1" aria-label="Více">+</button></div></div>'+
  '<div class="rows" style="margin-top:12px"><div><span id="c-line"></span><span id="c-sub"></span></div><div><span>DPH '+n('vat')+' %</span><span id="c-vat"></span></div><div><span id="c-alt-l"></span><span id="c-alt"></span></div></div></div>'+
  '<div class="c2c"><div><div class="muted" id="c-mode">Cena bez DPH</div><div class="big"><span id="c-total">0</span><small>Kč</small></div></div><div class="tog"><button data-vat="0">Bez DPH</button><button data-vat="1">S DPH</button></div><button class="btn acc" data-goto="1">Poslat poptávku</button><p class="note">Pevná cena. Bez příplatků. Bez provizí.</p></div></div>';
}
function updateCalc(){
  var P=C[ui.plan],sub=P.price*ui.qty,vat=Math.round(sub*C.vat/100),gross=sub+vat;
  function s(id,v){var e=document.getElementById(id);if(e)e.textContent=v}
  s('q',ui.qty);s('c-total',nf(ui.vat?gross:sub));s('c-mode',ui.vat?'Cena s DPH':'Cena bez DPH');
  s('c-line',P.name+' × '+ui.qty);s('c-sub',nf(sub)+' Kč');s('c-vat',nf(vat)+' Kč');
  s('c-alt-l',ui.vat?'Cena bez DPH':'Cena s DPH');s('c-alt',nf(ui.vat?sub:gross)+' Kč');s('c-tag',P.tag+'. '+P.desc);
  var b=app.querySelectorAll('[data-plan]');for(var i=0;i<b.length;i++){var on=b[i].getAttribute('data-plan')===ui.plan;b[i].classList.toggle('on',on);b[i].setAttribute('aria-checked',on)}
  var v=app.querySelectorAll('[data-vat]');for(var j=0;j<v.length;j++)v[j].classList.toggle('on',(v[j].getAttribute('data-vat')==='1')===ui.vat);
}
function refreshVat(){var e=document.querySelectorAll('[data-vat-of]');for(var i=0;i<e.length;i++)e[i].textContent=nf(vatOf(e[i].getAttribute('data-vat-of')))}
function gotoForm(){
  var P=C[ui.plan];
  document.getElementById('fsel').value=ui.plan;
  document.getElementById('fm').value='Konfigurace: '+P.name+' × '+ui.qty+', '+nf(P.price*ui.qty)+' Kč bez DPH.';
  goTo('kontakt');
}
function process(){
  return '<section class="sec" id="postup"><div class="wrap"><div class="head"><h2>'+t('stepsTitle')+'</h2></div><ol class="steps">'+C.steps.map(function(s,i){
    return '<li><span class="t">'+t('steps.'+i+'.t')+' '+del('steps',i)+'</span><span class="d">'+t('steps.'+i+'.d')+'</span></li>';
  }).join('')+'</ol>'+addb('steps','Přidat krok')+'</div></section>';
}
function gallery(){
  if(!C.gallery.length&&!ui.editing)return '';
  return '<section class="sec" id="prace"><div class="wrap"><div class="head"><h2>'+t('galTitle')+'</h2><p>'+t('galLead')+'</p></div><div class="gal">'+
  C.gallery.map(function(g,i){return '<figure class="gi"><img src="'+esc(g.src)+'" alt="'+esc(g.cap)+'" loading="lazy"><figcaption>'+t('gallery.'+i+'.cap')+del('gallery',i)+'</figcaption></figure>'}).join('')+'</div><button class="addb ed-only" data-upload="1">+ Přidat obrázek</button></div></section>';
}
function soc(){
  var ph=C.contact.phone.replace(/\D/g,''),ig=(C.contact.ig||'').replace(/^@/,'').trim();
  return '<div class="soc"><a class="btn sm" href="https://wa.me/420'+esc(ph)+'" target="_blank" rel="noopener">WhatsApp</a>'+(ig?'<a class="btn sm" href="https://instagram.com/'+esc(ig)+'" target="_blank" rel="noopener">Instagram</a>':'')+'<span class="ed-only" style="align-items:center;gap:6px">Instagram @'+t('contact.ig')+'</span></div>';
}
function finale(){
  var ph=C.contact.phone.replace(/\D/g,'');
  return '<section class="sec soft contact" id="kontakt"><div class="wrap"><div><div class="head"><h2>'+t('faqTitle')+'</h2></div><div class="fqs" id="faq">'+
  C.faq.map(function(f,i){return '<div class="fq"><div class="q" role="button" tabindex="0" aria-expanded="false"><span>'+t('faq.'+i+'.q')+'</span></div><div class="a"><p>'+t('faq.'+i+'.a')+' '+del('faq',i)+'</p></div></div>'}).join('')+addb('faq','Přidat otázku')+'</div></div>'+
  '<div><h2>'+t('contact.title')+'</h2><p class="lead">'+t('contact.lead')+'</p><p class="who2"><b>'+t('contact.name')+'</b> · <span class="muted">'+t('contact.role')+'</span></p><a class="big" href="tel:+420'+esc(ph)+'">'+t('contact.phone')+'</a><a class="big" href="mailto:'+esc(C.contact.email)+'">'+t('contact.email')+'</a>'+soc()+people()+
  '<form id="f" novalidate style="margin-top:18px"><label>Jméno<input id="fn" autocomplete="name" maxlength="120" required></label><label>E-mail<input id="fe" type="email" autocomplete="email" maxlength="200" required></label><label>Telefon (nepovinné)<input id="ft" type="tel" autocomplete="tel" maxlength="40"></label><label>Škola, akce nebo firma<input id="fs" placeholder="název" maxlength="200"></label>'+
  '<label class="hp" aria-hidden="true">Nevyplňujte<input id="fw" tabindex="-1" autocomplete="off"></label>'+
  '<label>Zájem o<select id="fsel"><option value="std">Standard (jen web)</option><option value="rez">Rezervace (web + online rezervace + skener)</option><option value="prem" selected>Premium (web + online rezervace + skener + platba + AI)</option></select></label>'+
  '<label>Zpráva<textarea id="fm" maxlength="5000"></textarea></label><button class="btn acc" type="submit" id="fb">Odeslat poptávku</button><p class="fhint" id="fh" role="status" aria-live="polite">Odpovíme na váš e-mail. Údaje použijeme jen k odpovědi.</p></form></div></div></section>';
}
function people(){
  C.people=C.people||[];
  if(!C.people.length&&!ui.editing)return '';
  return '<div class="ppl"><h3>'+t('peopleTitle')+'</h3><ul>'+C.people.map(function(c,i){return '<li><b>'+t('people.'+i+'.name')+'</b>'+((c.role||ui.editing)?'<span>'+t('people.'+i+'.role')+'</span>':'')+(ui.editing?'<span>'+t('people.'+i+'.email')+'</span>':(c.email?'<a class="pm" href="mailto:'+esc(c.email)+'">'+esc(c.email)+'</a>':''))+del('people',i)+'</li>'}).join('')+'</ul>'+addb('people','Přidat osobu')+'</div>';
}
function footer(){return '<footer class="f"><div class="wrap"><span>© 2026 '+esc(C.brand)+'. Všechna práva vyhrazena.</span></div></footer>'}

function render(){
  var y=window.scrollY;
  app.innerHTML=header()+hero()+plans()+process()+gallery()+finale()+footer();
  document.body.classList.toggle('editing',ui.editing);
  applyEditable();updateCalc();fillShots();bindPlans();
  var hs=app.querySelectorAll('.head h2');for(var hi=0;hi<hs.length;hi++){hs[hi].classList.add('glitch');hs[hi].setAttribute('data-text',hs[hi].textContent)}
  window.scrollTo({top:y,behavior:'instant'});setTimeout(function(){S3.measure();S3.scroll()},50);
}
function renderBar(){
  if(!ui.canEdit){bar.innerHTML='';return}
  bar.innerHTML=ui.editing?'<span>Klikněte na text a přepište ho</span><button data-act="cancel"'+(ui.saving?' disabled':'')+'>Zrušit</button><button class="acc" data-act="save"'+(ui.saving?' disabled':'')+'>'+(ui.saving?'Ukládám…':'Uložit změny')+'</button>':'<button data-act="edit">Upravit web</button>';
}
function applyEditable(){
  var els=app.querySelectorAll('[data-path]');
  for(var i=0;i<els.length;i++){
    var el=els[i];
    if(ui.editing){el.setAttribute('contenteditable','plaintext-only');if(el.contentEditable!=='plaintext-only')el.setAttribute('contenteditable','true')}
    else el.removeAttribute('contenteditable');
  }
}
function syncPath(p,except){
  var els=app.querySelectorAll('[data-path="'+p+'"]');
  for(var i=0;i<els.length;i++){if(els[i]===except)continue;els[i].textContent=els[i].hasAttribute('data-num')?nf(get(p)):get(p)}
}

/* ---------- colour system: fully automatic, blends continuously while scrolling ---------- */
var PALS=[['#00F0FF','#FF2BD6'],['#FFB000','#FF3D00'],['#7CFF4D','#00C2FF'],['#FF4DA6','#B66DFF']];
function mix(a,b,t){var A=parseInt(a.slice(1),16),B=parseInt(b.slice(1),16),r=Math.round((A>>16)+((B>>16)-(A>>16))*t),g=Math.round(((A>>8)&255)+(((B>>8)&255)-((A>>8)&255))*t),bl=Math.round((A&255)+((B&255)-(A&255))*t);return '#'+((1<<24)+(r<<16)+(g<<8)+bl).toString(16).slice(1)}
function cssColors(a,b){var r=document.documentElement;r.style.setProperty('--g1',a);r.style.setProperty('--g2',b);r.style.setProperty('--acc',a)}
function flash(){
  var r=document.documentElement;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  r.classList.remove('gl');void r.offsetWidth;r.classList.add('gl');
  setTimeout(function(){r.classList.remove('gl')},320);
}
function setPal(){}function markPal(){}function setGlow(){}function setAcc(){}

/* rotating word with scramble */
var WORDS=['plesy','školy','akce','firmy','jednotlivce'],wi=0,scr=0;
function scrambleTo(el,txt){
  var chars='!<>-_/[]{}=+*^?#',f=0,F=16;
  clearTimeout(scr);
  (function step(){
    var out='';
    for(var i=0;i<txt.length;i++)out+=(i<f*txt.length/F)?txt.charAt(i):chars.charAt(Math.floor(Math.random()*chars.length));
    el.textContent=out;
    if(++f<=F)scr=setTimeout(step,28);else el.textContent=txt;
  })();
}

/* ---------- mock-up images (used as 3D textures and as <img>) ---------- */
var MOCK_ACC={std:'#00E5FF',rez:'#FF7A1A',prem:'#FF3B5C'};
var FNT='"Helvetica Neue",Helvetica,Arial,sans-serif';
function rr(c,x,y,w,h,r,f){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();if(f){c.fillStyle=f;c.fill()}}
function tx(c,s,x,y,size,weight,col,al){c.font=weight+' '+size+'px '+FNT;c.fillStyle=col;c.textAlign=al||'left';c.textBaseline='alphabetic';c.fillText(s,x,y)}
function orb(c,x,y,r,col,a){var g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');c.globalAlpha=a;c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.globalAlpha=1}
function glassBox(c,x,y,w,h,r){var g=c.createLinearGradient(0,y,0,y+h);g.addColorStop(0,'rgba(255,255,255,.18)');g.addColorStop(1,'rgba(255,255,255,.05)');rr(c,x,y,w,h,r,g);c.strokeStyle='rgba(255,255,255,.28)';c.lineWidth=1.5;rr(c,x,y,w,h,r);c.stroke()}
function chrome(c,w,url){
  c.fillStyle='#10131C';c.fillRect(0,0,w,64);c.fillStyle='rgba(255,255,255,.06)';c.fillRect(0,63,w,1);
  ['#ff5f57','#febc2e','#28c840'].forEach(function(col,k){c.beginPath();c.arc(34+k*26,32,8,0,6.283);c.fillStyle=col;c.fill()});
  rr(c,w/2-300,16,600,32,16,'#0A0C12');tx(c,url,w/2,38,17,'500','#8B93A8','center');
}
function smooth(c,pts){c.moveTo(pts[0][0],pts[0][1]);for(var i=1;i<pts.length;i++){var mx=(pts[i-1][0]+pts[i][0])/2;c.bezierCurveTo(mx,pts[i-1][1],mx,pts[i][1],pts[i][0],pts[i][1])}}
var mockCache={};
function mockCanvas(kind){
  if(mockCache[kind])return mockCache[kind];
  var w=1280,h=800,cv=document.createElement('canvas');cv.width=w;cv.height=h;
  var c=cv.getContext('2d'),A=MOCK_ACC[kind],i,j,g;
  c.fillStyle='#070910';c.fillRect(0,0,w,h);
  if(kind==='std'){
    orb(c,1040,300,560,'rgba(0,229,255,.55)',.5);orb(c,1120,640,440,'rgba(255,45,214,.5)',.45);orb(c,160,720,420,'rgba(124,92,255,.4)',.5);
    chrome(c,w,'vase-akce.cz');
    rr(c,56,88,38,38,11,A);tx(c,'Vaše akce',110,116,27,'700','#F1F3FA');
    tx(c,'Program',690,114,20,'500','#9AA1B5');tx(c,'Vstupenky',800,114,20,'500','#9AA1B5');tx(c,'Kontakt',930,114,20,'500','#9AA1B5');
    rr(c,1060,92,164,46,23,A);tx(c,'Rezervovat',1142,122,19,'700','#05060A','center');
    glassBox(c,56,192,358,44,22);tx(c,'Sobota · 20:00 · Kulturní dům',78,221,17,'500','#D5DAE8');
    tx(c,'Večer, na který',56,340,74,'700','#F8F9FD');tx(c,'se bude',56,418,74,'700','#F8F9FD');
    g=c.createLinearGradient(56,0,420,0);g.addColorStop(0,A);g.addColorStop(1,'#FF2BD6');tx(c,'vzpomínat.',56,496,74,'700',g);
    tx(c,'Program, vstupenky a fotky na jednom místě.',56,556,24,'400','#9AA1B5');tx(c,'Funguje na mobilu i počítači.',56,590,24,'400','#9AA1B5');
    rr(c,56,630,236,64,32,A);tx(c,'Koupit vstupenku',174,670,21,'700','#05060A','center');glassBox(c,308,630,196,64,32);tx(c,'Program',406,670,21,'600','#F1F3FA','center');
    g=c.createLinearGradient(700,170,1230,560);g.addColorStop(0,'#0AD7F2');g.addColorStop(.5,'#7C5CFF');g.addColorStop(1,'#FF2BD6');rr(c,700,176,530,390,30,g);
    orb(c,900,300,260,'rgba(255,255,255,.55)',.55);orb(c,1120,500,240,'rgba(255,200,120,.6)',.5);orb(c,820,520,200,'rgba(0,229,255,.5)',.5);
    tx(c,'Night',740,330,120,'800','rgba(255,255,255,.95)');tx(c,'2027',744,384,34,'600','rgba(255,255,255,.8)');
    glassBox(c,736,412,458,124,24);
    [['118','dní'],['04','hodin'],['12','minut'],['33','sekund']].forEach(function(n,k){var x=750+k*112;tx(c,n[0],x+52,480,46,'700','#fff','center');tx(c,n[1],x+52,516,16,'500','rgba(255,255,255,.8)','center')});
    [['Program','#00E5FF'],['Sponzoři','#FF2BD6'],['Galerie','#FFB000']].forEach(function(n,k){var x=700+k*180;glassBox(c,x,600,166,70,18);c.beginPath();c.arc(x+34,635,12,0,6.283);c.fillStyle=n[1];c.fill();tx(c,n[0],x+58,642,19,'600','#F1F3FA')});
  }else if(kind==='rez'){
    orb(c,300,100,520,'rgba(255,122,26,.35)',.5);orb(c,1100,720,460,'rgba(255,43,214,.3)',.45);
    chrome(c,w,'vase-akce.cz/rezervace');
    rr(c,48,96,790,672,28,'#0E111A');tx(c,'Vyberte místa',84,152,32,'700','#F1F3FA');tx(c,'Sál · sobota 20:00',84,184,18,'500','#8B93A8');
    c.beginPath();c.moveTo(150,238);c.quadraticCurveTo(443,196,736,238);c.lineWidth=5;g=c.createLinearGradient(150,0,736,0);g.addColorStop(0,'rgba(255,122,26,0)');g.addColorStop(.5,A);g.addColorStop(1,'rgba(255,122,26,0)');c.strokeStyle=g;c.stroke();
    tx(c,'PÓDIUM',443,262,15,'600','#8B93A8','center');
    var sel={'1_2':1,'1_3':1},tk={'0_3':1,'0_4':1,'2_1':1,'2_6':1,'3_4':1,'4_5':1,'4_6':1,'5_2':1,'1_7':1,'3_8':1};
    for(i=0;i<6;i++){tx(c,String.fromCharCode(65+i),96,326+i*58,19,'700','#6B7388','center');
      for(j=0;j<10;j++){
        var k=i+'_'+j,x=126+j*62+(j>4?30:0),y=296+i*58;
        if(sel[k]){rr(c,x,y,50,44,12,A);tx(c,String(j+1),x+25,y+29,17,'700','#05060A','center');c.shadowColor=A;c.shadowBlur=18;rr(c,x,y,50,44,12);c.strokeStyle=A;c.lineWidth=2;c.stroke();c.shadowBlur=0}
        else if(tk[k]){rr(c,x,y,50,44,12,'#0A0C12');tx(c,'×',x+25,y+29,18,'500','#2B3244','center')}
        else{rr(c,x,y,50,44,12,'#171B27');c.strokeStyle='#262C3D';c.lineWidth=1.5;rr(c,x,y,50,44,12);c.stroke();tx(c,String(j+1),x+25,y+29,17,'600','#9AA3BA','center')}
      }}
    [['Volné','#171B27'],['Vybrané',A],['Obsazené','#0A0C12']].forEach(function(l,k){var x=170+k*190;rr(c,x,700,28,24,8,l[1]);tx(c,l[0],x+40,719,17,'500','#8B93A8')});
    rr(c,866,96,366,672,28,'#0E111A');tx(c,'Vaše rezervace',900,152,30,'700','#F1F3FA');
    rr(c,900,182,70,38,19,'rgba(255,122,26,.2)');tx(c,'A3',935,208,19,'700',A,'center');rr(c,982,182,70,38,19,'rgba(255,122,26,.2)');tx(c,'A4',1017,208,19,'700',A,'center');
    tx(c,'2 × vstupenka',900,290,21,'500','#C9CEDD');tx(c,'600 Kč',1198,290,21,'600','#F1F3FA','right');
    c.fillStyle='#232A3B';c.fillRect(900,318,298,2);tx(c,'Celkem',900,380,19,'500','#8B93A8');tx(c,'600 Kč',900,440,58,'700','#F8F9FD');
    rr(c,900,500,298,64,32,A);tx(c,'Pokračovat k platbě',1049,540,20,'700','#05060A','center');
    glassBox(c,900,590,298,56,28);tx(c,'Místa držíme  09:48',1049,625,18,'500','#C9CEDD','center');
    tx(c,'Bez provize. Pevná cena.',1049,700,16,'500','#6B7388','center');
  }else{
    orb(c,1100,200,520,'rgba(255,59,92,.35)',.5);orb(c,200,700,460,'rgba(124,92,255,.35)',.5);
    chrome(c,w,'vase-akce.cz/admin');
    rr(c,0,64,232,736,0,'#0B0E16');rr(c,28,92,34,34,10,A);tx(c,'Admin',76,118,22,'700','#F1F3FA');
    [['Přehled',1],['Rezervace',0],['Platby',0],['Hosté',0],['Nastavení',0]].forEach(function(m,k){var y=160+k*54;if(m[1])rr(c,16,y-6,200,44,12,'rgba(255,59,92,.18)');tx(c,m[0],44,y+22,19,m[1]?'700':'500',m[1]?'#FF7A90':'#8B93A8')});
    tx(c,'Přehled',264,134,40,'700','#F8F9FD');rr(c,1040,100,192,40,20,'#141826');tx(c,'Posledních 7 dní',1136,127,16,'500','#8B93A8','center');
    [['Rezervace','248','+12 %'],['Zaplaceno','186 400 Kč','+8 %'],['Čeká na platbu','12','−3']].forEach(function(k,n){var x=264+n*322;rr(c,x,162,302,124,20,'#0E111A');tx(c,k[0],x+24,196,17,'500','#8B93A8');tx(c,k[1],x+24,252,44,'700','#F8F9FD');rr(c,x+302-98,176,76,30,15,k[2].charAt(0)==='−'?'rgba(255,184,0,.15)':'rgba(46,230,140,.16)');tx(c,k[2],x+302-60,197,15,'700',k[2].charAt(0)==='−'?'#FFB800':'#2EE68C','center')});
    rr(c,264,306,640,290,22,'#0E111A');tx(c,'Příjmy',290,344,21,'700','#F1F3FA');
    for(i=0;i<5;i++){c.fillStyle='#1A2030';c.fillRect(290,380+i*40,588,1)}
    var pts=[[290,540],[370,500],[450,516],[530,450],[610,470],[690,400],[770,420],[878,356]];
    c.beginPath();smooth(c,pts);c.lineTo(878,570);c.lineTo(290,570);c.closePath();g=c.createLinearGradient(0,350,0,570);g.addColorStop(0,'rgba(255,59,92,.45)');g.addColorStop(1,'rgba(255,59,92,0)');c.fillStyle=g;c.fill();
    c.beginPath();smooth(c,pts);c.strokeStyle=A;c.lineWidth=4;c.stroke();
    c.beginPath();c.arc(878,356,8,0,6.283);c.fillStyle='#fff';c.fill();c.lineWidth=4;c.strokeStyle=A;c.stroke();
    rr(c,924,306,308,290,22,'#0E111A');tx(c,'Rezervace po dnech',948,344,21,'700','#F1F3FA');
    [60,92,74,120,98,150,128].forEach(function(v,k){var x=950+k*40;g=c.createLinearGradient(0,570-v,0,570);g.addColorStop(0,A);g.addColorStop(1,'rgba(255,59,92,.25)');rr(c,x,570-v*1.6,26,v*1.6,8,g)});
    rr(c,264,616,968,160,22,'#0E111A');tx(c,'Poslední platby',290,652,20,'700','#F1F3FA');
    [['Jana K.','A3, A4','600 Kč','Zaplaceno'],['Petr M.','B7','300 Kč','Zaplaceno'],['Eva S.','C1, C2, C3','600 Kč','Čeká']].forEach(function(r,k){var y=690+k*30;tx(c,r[0],290,y+4,17,'600','#E4E8F2');tx(c,r[1],520,y+4,17,'500','#8B93A8');tx(c,r[2],760,y+4,17,'600','#E4E8F2');var ok=r[3]==='Zaplaceno';rr(c,1070,y-14,134,28,14,ok?'rgba(46,230,140,.16)':'rgba(255,184,0,.15)');tx(c,r[3],1137,y+5,15,'700',ok?'#2EE68C':'#FFB800','center')});
  }
  mockCache[kind]=cv;return cv;
}
var shotCache={};
function shotURL(k){if(!shotCache[k])shotCache[k]=mockCanvas(k).toDataURL('image/jpeg',.82);return shotCache[k]}
function fillShots(){var im=app.querySelectorAll('img[data-shot]');for(var i=0;i<im.length;i++)im[i].src=shotURL(im[i].getAttribute('data-shot'))}
function chipCanvas(txt,col){
  var cv=document.createElement('canvas');cv.width=512;cv.height=192;var c=cv.getContext('2d');
  rr(c,6,6,500,180,40,'#10131c');c.strokeStyle=col;c.lineWidth=5;rr(c,6,6,500,180,40);c.stroke();
  c.fillStyle='#F1F3FA';c.font='700 66px Arial, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(txt,256,100);
  return cv;
}

/* ---------- 3D scene: carousel ring + particle globe + shader backdrop, driven by scroll ---------- */
var S3=(function(){
  var cv=document.getElementById('sw');
  var ok=false,R,scene,cam,RG,GL,screens=[],chips=[],rings=[],edges=[],bgU,globePts;
  var hotRay=-1,hotUI=-1,active=-1,tops=[],lastRay=0,ndc={x:0,y:0},mouse={x:0,y:0},rc,frontIdx=0;
  var RAD=4.4,spin=0,TAU=Math.PI*2,KEYS3=['std','rez','prem'],vel=0,lastY=0,baseFov=48,pend=null,tmr=0;
  var IDS=['top','cenik','postup','kontakt'];
  var KF=[{p:[-4.2,.3,12.5],l:[-4.2,0,0]},{p:[0,.5,8.4],l:[0,0,0]},{p:[0,1.8,7.8],l:[0,-.2,-2]},{p:[-2,.2,10.5],l:[-2,0,0]}];
  var cp,cl,tp,tl;
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function V(a){return new THREE.Vector3(a[0],a[1],a[2])}
  function mob(){return window.innerWidth<760}
  function interactive(el){return !!(el&&el.closest&&el.closest('a,button,input,select,textarea,label,[data-path],.plan,.card,form,header,.dots,.fqs,.steps li,.head,.bar,.toast'))}
  function eff(){return hotUI>=0?hotUI:hotRay}
  function init(){
    if(!window.THREE){document.body.classList.add('no3d');return}
    try{R=new THREE.WebGLRenderer({canvas:cv,alpha:true,antialias:!mob(),powerPreference:'high-performance'})}catch(e){document.body.classList.add('no3d');return}
    R.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));R.outputEncoding=THREE.sRGBEncoding;
    scene=new THREE.Scene();
    baseFov=mob()?62:48;cam=new THREE.PerspectiveCamera(baseFov,1,.1,90);
    cp=V(KF[0].p);cl=V(KF[0].l);tp=cp.clone();tl=cl.clone();
    bgU={uT:{value:0},uA:{value:new THREE.Color('#00F0FF')},uB:{value:new THREE.Color('#FF2BD6')},uR:{value:new THREE.Vector2(1,1)}};
    var bg=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.ShaderMaterial({uniforms:bgU,depthTest:false,depthWrite:false,
      vertexShader:'void main(){gl_Position=vec4(position.xy,.999,1.);}',
      fragmentShader:'uniform float uT;uniform vec3 uA;uniform vec3 uB;uniform vec2 uR;void main(){vec2 uv=gl_FragCoord.xy/uR;float a=sin(uv.x*3.+uT*.45)*.5+.5;float b=sin(uv.y*2.5-uT*.35+uv.x*2.)*.5+.5;float c=sin((uv.x+uv.y)*4.-uT*.5)*.5+.5;vec3 col=vec3(.02,.024,.045)+uA*.24*smoothstep(.3,1.,a*uv.y+.2)+uB*.22*smoothstep(.35,1.,b*(1.-uv.x)+.15)+mix(uA,uB,c)*.06;gl_FragColor=vec4(col,1.);}'}));
    bg.frustumCulled=false;bg.renderOrder=-10;scene.add(bg);
    RG=new THREE.Group();RG.position.set(0,0,-RAD);scene.add(RG);
    var cols=['#00E5FF','#FF8A1F','#FF3B5C'];
    KEYS3.forEach(function(k,i){
      var ang=i*TAU/KEYS3.length,g=new THREE.Group();
      var tex=new THREE.CanvasTexture(mockCanvas(k));tex.encoding=THREE.sRGBEncoding;tex.anisotropy=8;
      var m=new THREE.Mesh(new THREE.PlaneGeometry(3.2,2),new THREE.MeshBasicMaterial({map:tex,transparent:true,opacity:.97}));
      var back=new THREE.Mesh(new THREE.PlaneGeometry(3.3,2.1),new THREE.MeshBasicMaterial({color:0x0B0D14,transparent:true,opacity:.97}));back.position.z=-.02;
      var ed=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(3.3,2.1)),new THREE.LineBasicMaterial({color:new THREE.Color(cols[i]),transparent:true}));
      var hc=document.createElement('canvas');hc.width=hc.height=128;var hx=hc.getContext('2d'),hg=hx.createRadialGradient(64,64,6,64,64,64);hg.addColorStop(0,cols[i]);hg.addColorStop(1,'rgba(0,0,0,0)');hx.fillStyle=hg;hx.fillRect(0,0,128,128);
      var halo=new THREE.Mesh(new THREE.PlaneGeometry(5.6,3.9),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(hc),transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false}));halo.position.z=-.08;
      g.add(halo);g.add(back);g.add(m);g.add(ed);edges.push(ed);
      g.position.set(RAD*Math.sin(ang),0,RAD*Math.cos(ang));g.rotation.y=ang;RG.add(g);
      screens.push({g:g,mesh:m,back:back,ed:ed,halo:halo,ang:ang,sc:1});
    });
    var N=mob()?560:1300,pos=new Float32Array(N*3),ga=Math.PI*(3-Math.sqrt(5));
    for(var i=0;i<N;i++){var y=1-(i/(N-1))*2,r=Math.sqrt(1-y*y),th=ga*i;pos[i*3]=Math.cos(th)*r*2.3;pos[i*3+1]=y*2.3;pos[i*3+2]=Math.sin(th)*r*2.3}
    var gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.BufferAttribute(pos,3));
    globePts=new THREE.Points(gg,new THREE.PointsMaterial({color:0x00F0FF,size:.07,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false}));
    GL=new THREE.Group();GL.position.set(0,0,-RAD);GL.add(globePts);scene.add(GL);
    [RAD+1.3,RAD+2.6].forEach(function(r,i){
      var rg=new THREE.Mesh(new THREE.TorusGeometry(r,.014,6,150),new THREE.MeshBasicMaterial({color:i?0xFF2BD6:0x00F0FF,transparent:true,opacity:.6,blending:THREE.AdditiveBlending,depthWrite:false}));
      rg.position.z=-RAD;rg.rotation.x=1.25+i*.25;rg.rotation.y=i*.5;scene.add(rg);rings.push(rg);
    });
    var labels=[[nf(C.std.price)+' Kč',cols[0],[-6.4,2.4,-3]],[nf(C.rez.price)+' Kč',cols[1],[-1.8,-2.4,1.4]],[nf(C.prem.price)+' Kč',cols[2],[6.2,2.2,-2.5]],['Rezervace',cols[1],[2.6,2.8,-4]],['QR platba',cols[2],[-4.2,-2.6,-1]],['QR skener',cols[1],[-5.8,.4,-1.5]],['Hotovo',cols[0],[5.6,-2.5,.6]]];
    labels.forEach(function(L,i){
      var tex=new THREE.CanvasTexture(chipCanvas(L[0],L[1]));tex.encoding=THREE.sRGBEncoding;
      var m=new THREE.Mesh(new THREE.PlaneGeometry(1.5,.56),new THREE.MeshBasicMaterial({map:tex,transparent:true,opacity:.95}));
      m.position.set(L[2][0],L[2][1],L[2][2]);scene.add(m);chips.push({m:m,y:L[2][1],i:i});
    });
    rc=new THREE.Raycaster();
    window.addEventListener('resize',resize);
    window.addEventListener('scroll',scroll,{passive:true});
    window.addEventListener('pointermove',function(e){
      ndc.x=e.clientX/window.innerWidth*2-1;ndc.y=-(e.clientY/window.innerHeight*2-1);mouse.x=ndc.x;mouse.y=ndc.y;
      var now=performance.now();if(now-lastRay<70)return;lastRay=now;
      if(interactive(e.target)){hotRay=-1;document.documentElement.style.cursor='';return}
      rc.setFromCamera(ndc,cam);
      var ms=screens.map(function(s){return s.mesh}),hit=rc.intersectObjects(ms);
      hotRay=hit.length?ms.indexOf(hit[0].object):-1;
      document.documentElement.style.cursor=hotRay>=0?'pointer':'';
    },{passive:true});
    window.addEventListener('click',function(e){
      if(hotRay>=0&&!interactive(e.target)){
        var k=KEYS3[hotRay];
        if(hotRay===frontIdx)pick(k);else{ui.plan=k;updateCalc()}
      }
    });
    ok=true;lastY=window.scrollY;resize();measure();scroll();
    if(reduce)draw(0);else requestAnimationFrame(loop);
  }
  function resize(){
    if(!ok)return;
    var w=window.innerWidth,h=window.innerHeight;R.setSize(w,h,false);cam.aspect=w/h;baseFov=mob()?62:48;cam.fov=baseFov;cam.updateProjectionMatrix();
    var v=new THREE.Vector2();R.getDrawingBufferSize(v);bgU.uR.value.copy(v);
    measure();scroll();if(reduce)draw(0);
  }
  function measure(){tops=IDS.map(function(id){var e=document.getElementById(id);return e?e.getBoundingClientRect().top+window.scrollY:0})}
  function lerpA(a,b,t){return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]}
  function ease(t){return t*t*(3-2*t)}
  function scroll(){
    var yy=window.scrollY;vel=Math.min(70,vel+Math.abs(yy-lastY)*.6);lastY=yy;
    var y=yy+window.innerHeight*.35,i=0,k;
    for(k=0;k<tops.length;k++)if(y>=tops[k])i=k;
    var nx=Math.min(i+1,IDS.length-1),span=Math.max(1,(tops[nx]||0)-tops[i]),t=nx===i?0:Math.min(1,Math.max(0,(y-tops[i])/span)),e=ease(t);
    var P=lerpA(KF[i].p,KF[nx].p,e),L=lerpA(KF[i].l,KF[nx].l,e);
    if(mob()){P=[0,P[1],P[2]*1.3];L=[0,L[1]+1.5,L[2]]}
    if(tp){tp.set(P[0],P[1],P[2]);tl.set(L[0],L[1],L[2])}
    var pa=mix(PALS[i][0],PALS[nx][0],e),pb=mix(PALS[i][1],PALS[nx][1],e);
    colors(pa,pb);pend=[pa,pb];
    if(!tmr)tmr=setTimeout(function(){tmr=0;cssColors(pend[0],pend[1])},90);
    if(i!==active){active=i;onSection(i)}
    if(reduce&&ok)draw(0);
  }
  function onSection(i){
    var d=document.querySelectorAll('.dots button');for(var k=0;k<d.length;k++)d[k].classList.toggle('on',k===i);
    var a=document.querySelectorAll('.top nav a:not(.btn)');for(var j=0;j<a.length;j++)a[j].classList.toggle('on',a[j].getAttribute('href')==='#'+IDS[i]);
    flash();
  }
  function colors(a,b){
    if(!ok)return;
    globePts.material.color.set(a);rings[0].material.color.set(a);rings[1].material.color.set(b);
    bgU.uA.value.set(a);bgU.uB.value.set(b);
  }
  function wrap(d){return ((d+Math.PI)%TAU+TAU)%TAU-Math.PI}
  function draw(now){
    if(reduce){cp.copy(tp);cl.copy(tl)}else{cp.lerp(tp,.07);cl.lerp(tl,.07)}
    vel*=.93;
    cam.position.set(cp.x+(reduce?0:mouse.x*.5),cp.y+(reduce?0:mouse.y*.3),cp.z);cam.lookAt(cl);
    var fv=baseFov+Math.min(12,vel*.16);if(Math.abs(fv-cam.fov)>.05){cam.fov=fv;cam.updateProjectionMatrix()}
    bgU.uT.value=reduce?0:now*.001;
    var h=eff(),sel=KEYS3.indexOf(ui.plan),target;
    if(active===0&&h<0){spin+=reduce?0:.0016+vel*.0009;target=spin}else target=-(h>=0?h:sel)*TAU/KEYS3.length;
    var dlt=wrap(target-RG.rotation.y);RG.rotation.y+=reduce?dlt:dlt*.06;
    var best=-2;
    screens.forEach(function(s,i){
      var wa=RG.rotation.y+s.ang,face=Math.cos(wa);if(face>best){best=face;frontIdx=i}
      var tsc=1+(i===sel?.04:0)+(i===h?.08:0);s.sc+=(tsc-s.sc)*.12;s.g.scale.set(s.sc,s.sc,s.sc);
      var op=.28+.72*Math.max(0,(face+.35)/1.35);
      s.mesh.material.opacity=op;s.back.material.opacity=op;s.ed.material.opacity=op;s.halo.material.opacity=(.18+.5*Math.max(0,face))*(reduce?1:.8+.2*Math.sin(now*.003+i*2));
      s.g.position.y=reduce?0:Math.sin(now*.0007+i*2)*.1;
    });
    GL.rotation.y+=reduce?0:.0025+mouse.x*.01+vel*.0014;GL.rotation.x=reduce?0:mouse.y*.35;
    chips.forEach(function(c){c.m.position.y=c.y+(reduce?0:Math.sin(now*.0005+c.i*1.7)*.22);c.m.lookAt(cam.position)});
    if(!reduce){rings[0].rotation.z+=.0016+vel*.0008;rings[1].rotation.z-=.001+vel*.0006}
    R.render(scene,cam);
  }
  function loop(now){requestAnimationFrame(loop);if(document.hidden)return;draw(now)}
  function pick(k){ui.plan=k;updateCalc();goTo('spocitat',true)}
  return {init:init,measure:measure,scroll:scroll,colors:colors,hot:function(i){hotUI=i}};
})();

/* ---------- plan glow: the card in the middle of the carousel lights up ---------- */
function planGlow(){
  var box=document.querySelector('.plans');if(!box)return;
  var cs=box.querySelectorAll('.plan'),mobile=window.innerWidth<=900,i;
  if(!mobile){for(i=0;i<cs.length;i++)cs[i].style.removeProperty('--gl');return}
  var br=box.getBoundingClientRect(),mid=br.left+br.width/2;
  for(i=0;i<cs.length;i++){var r=cs[i].getBoundingClientRect(),d=Math.abs(r.left+r.width/2-mid)/(r.width*.9);cs[i].style.setProperty('--gl',(.15+.85*Math.max(0,1-d)).toFixed(2))}
}
function bindPlans(){var box=document.querySelector('.plans');if(!box)return;box.addEventListener('scroll',planGlow,{passive:true});planGlow()}
window.addEventListener('resize',planGlow);
/* ---------- own smooth scroller (reliable on phones, cancellable) ---------- */
var REDUCE=window.matchMedia('(prefers-reduced-motion: reduce)').matches,scrollAnim=0;
function scrollToY(y){
  cancelAnimationFrame(scrollAnim);
  var y0=window.scrollY,d=y-y0;if(Math.abs(d)<2)return;
  if(REDUCE){window.scrollTo(0,y);return}
  var t0=performance.now(),dur=Math.min(1100,Math.max(450,Math.abs(d)*.35));
  (function step(now){var p=Math.min(1,(now-t0)/dur),e=p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;window.scrollTo(0,y0+d*e);if(p<1)scrollAnim=requestAnimationFrame(step)})(t0);
}
function goTo(id,center){
  var el=document.getElementById(id);if(!el)return;
  var r=el.getBoundingClientRect(),y=r.top+window.scrollY;
  if(center)y=y-Math.max(70,(window.innerHeight-r.height)/2);else y=id==='top'?0:y-64;
  scrollToY(Math.max(0,y));
}
window.addEventListener('wheel',function(){cancelAnimationFrame(scrollAnim)},{passive:true});
window.addEventListener('touchstart',function(){cancelAnimationFrame(scrollAnim)},{passive:true});
/* ---------- events ---------- */
app.addEventListener('pointermove',function(e){var b=e.target.closest&&e.target.closest('.btn');if(b){var r=b.getBoundingClientRect();b.style.setProperty('--mx',(e.clientX-r.left)+'px');b.style.setProperty('--my',(e.clientY-r.top)+'px')}},{passive:true});
app.addEventListener('mouseover',function(e){var pl=e.target.closest&&e.target.closest('.plan');S3.hot(pl?KEYS.indexOf(pl.getAttribute('data-k')):-1)});
app.addEventListener('focusin',function(e){var pl=e.target.closest&&e.target.closest('.plan');S3.hot(pl?KEYS.indexOf(pl.getAttribute('data-k')):-1)});
app.addEventListener('click',function(e){
  var tg=e.target,d;
  if((d=tg.closest('[data-go]'))){goTo(d.getAttribute('data-go'));return}
  var an=tg.closest('a[href^="#"]');if(an&&!(ui.editing&&tg.closest('[data-path]'))&&an.getAttribute('href').length>1&&!an.hasAttribute('data-pick')){e.preventDefault();goTo(an.getAttribute('href').slice(1),an.getAttribute('href')==='#spocitat');return}
  if(ui.editing&&tg.closest('a')&&tg.closest('[data-path]'))e.preventDefault();
  if(tg.closest('[data-upload]')){uploadImg();return}
  if((d=tg.closest('[data-pal]'))){setPal(parseInt(d.getAttribute('data-pal'),10),true);return}
  if((d=tg.closest('[data-del]'))){var pr=d.getAttribute('data-del').split('|');get(pr[0]).splice(parseInt(pr[1],10),1);render();return}
  if((d=tg.closest('[data-add]'))){var path=d.getAttribute('data-add'),key=path.split('.').pop();get(path).push(JSON.parse(JSON.stringify(TPL[key])));render();return}
  if((d=tg.closest('[data-pick]'))){e.preventDefault();ui.plan=d.getAttribute('data-pick');updateCalc();goTo('spocitat',true);return}
  if((d=tg.closest('[data-plan]'))){ui.plan=d.getAttribute('data-plan');updateCalc();return}
  if((d=tg.closest('[data-qty]'))){ui.qty=Math.min(50,Math.max(1,ui.qty+parseInt(d.getAttribute('data-qty'),10)));updateCalc();return}
  if((d=tg.closest('[data-vat]'))){ui.vat=d.getAttribute('data-vat')==='1';updateCalc();return}
  if(tg.closest('[data-goto]')){gotoForm();return}
  if(ui.editing&&tg.closest('.fq'))return;
  if((d=tg.closest('.fq .q'))){var o=d.parentNode.classList.toggle('open');d.setAttribute('aria-expanded',o)}
});
app.addEventListener('keydown',function(e){
  var tg=e.target;
  if(ui.editing&&tg.hasAttribute&&tg.hasAttribute('data-path')&&e.key==='Enter'){e.preventDefault();tg.blur();return}
  if((e.key==='Enter'||e.key===' ')&&tg.matches&&tg.matches('.fq .q')){e.preventDefault();tg.click()}
});
app.addEventListener('input',function(e){
  var el=e.target.closest&&e.target.closest('[data-path]');if(!el||!ui.editing)return;
  var p=el.getAttribute('data-path'),v=el.textContent.replace(/[\r\n]+/g,' ');
  if(el.hasAttribute('data-num')){var num=parseInt(v.replace(/\D/g,''),10);set(p,isNaN(num)?0:num)}else set(p,v);
  syncPath(p,el);
  var gl=el.closest('.glitch');if(gl)gl.setAttribute('data-text',gl.textContent);
  if(/^(std|rez|prem|vat)/.test(p)){updateCalc();refreshVat()}
});
app.addEventListener('focusout',function(e){
  var el=e.target.closest&&e.target.closest('[data-path]');
  if(el&&ui.editing&&el.hasAttribute('data-num'))el.textContent=nf(get(el.getAttribute('data-path')));
});
app.addEventListener('paste',function(e){
  if(!ui.editing||!e.target.closest('[data-path]'))return;
  e.preventDefault();
  document.execCommand('insertText',false,((e.clipboardData||window.clipboardData).getData('text/plain')||'').replace(/[\r\n]+/g,' '));
});
/* poptávka: odešle se na /api/poptavka (Resend); když server poptávky
   nepřijímá nebo není dostupný, otevře se e-mail s předvyplněnou zprávou */
var formStart=Date.now();
function poptavkaMailem(d){
  var body='Jméno: '+d.jmeno+'\nE-mail: '+d.email+(d.telefon?'\nTelefon: '+d.telefon:'')+'\nŠkola/akce/firma: '+d.organizace+'\nZájem o: '+d.balicekNazev+'\nPočet webů: '+d.pocet+'\n\n'+d.zprava;
  window.location.href='mailto:'+C.contact.email+'?subject='+encodeURIComponent('Poptávka webu – '+d.jmeno)+'&body='+encodeURIComponent(body);
}
app.addEventListener('submit',async function(e){
  e.preventDefault();
  var f=e.target,hint=document.getElementById('fh'),btn=document.getElementById('fb');
  var nm=document.getElementById('fn'),em=document.getElementById('fe');
  if(!nm.value.trim()){nm.focus();hint.textContent='Vyplňte prosím jméno.';return}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value.trim())){em.focus();hint.textContent='Vyplňte prosím platný e-mail, ať máme kam odpovědět.';return}
  var sel=document.getElementById('fsel');
  var d={jmeno:nm.value.trim(),email:em.value.trim(),telefon:document.getElementById('ft').value.trim(),organizace:document.getElementById('fs').value.trim(),
    balicek:sel.value,balicekNazev:sel.options[sel.selectedIndex].text,pocet:ui.qty,zprava:document.getElementById('fm').value.trim(),
    web:document.getElementById('fw').value,vyplneno:Date.now()-formStart};
  btn.disabled=true;hint.textContent='Odesílám…';
  try{
    var r=await fetch('/api/poptavka',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)});
    var o=await r.json().catch(function(){return {}});
    if(r.ok){f.reset();hint.textContent='Děkujeme, poptávka dorazila. Ozveme se na '+d.email+'.';toast('Poptávka odeslána.');return}
    if(r.status===400||r.status===429){hint.textContent=o.chyba||'Poptávku se nepodařilo odeslat.';return}
    hint.textContent='Server teď poptávky nepřijímá, otevírám váš e-mail.';poptavkaMailem(d);
  }catch(err){hint.textContent='Spojení se nepovedlo, otevírám váš e-mail.';poptavkaMailem(d)}
  finally{btn.disabled=false}
});

/* ---------- edit bar, upload, save ---------- */
function toast(msg){var d=document.createElement('div');d.className='toast';d.textContent=msg;document.body.appendChild(d);setTimeout(function(){d.remove()},4200)}
function uploadImg(){
  var inp=document.createElement('input');inp.type='file';inp.accept='image/*';
  inp.onchange=async function(){
    var f=inp.files&&inp.files[0];if(!f)return;
    try{
      var as=window.claude?await window.claude.use('assets'):null;
      if(!as){toast('Nahrávání obrázků tu není dostupné. Pošlete obrázky v chatu.');return}
      var r=await as.upload(f);C.gallery.push({src:r.url,cap:'Popis'});render();
    }catch(err){toast('Nahrání se nepovedlo.')}
  };
  inp.click();
}
function buildHTML(){
  var json=JSON.stringify(C).replace(/</g,'\\u003c');
  return '<!doctype html>\n<html lang="cs">\n<head>\n'+HEAD+'\n<style id="css">'+document.getElementById('css').textContent+'</style>\n</head>\n<body>\n<canvas id="sw" aria-hidden="true"></canvas>\n<div id="app"></div>\n<div id="bar" class="bar"></div>\n<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"><\/script>\n\n<script id="data" type="application/json">'+json+'<\/script>\n\n<script id="code">'+document.getElementById('code').textContent+'<\/script>\n</body>\n</html>';
}
bar.addEventListener('click',function(e){
  var b=e.target.closest('[data-act]');if(!b)return;
  var a=b.getAttribute('data-act');
  if(a==='edit'){ui.editing=true;renderBar();render()}
  if(a==='cancel'){C=JSON.parse(dataEl.textContent);ui.editing=false;renderBar();render()}
  if(a==='save')save();
});
async function save(){
  var art=window.claude?await window.claude.use('artifact'):null;
  if(!art){toast('Ukládání tady není dostupné.');return}
  ui.saving=true;renderBar();
  try{await art.publish(buildHTML())}
  catch(err){
    ui.saving=false;renderBar();
    if(err&&err.code==='conflict')return;
    if(err&&(err.code==='not_writer'||err.code==='not_granted')){toast('Tento web může upravovat jen jeho autor.');ui.canEdit=false;ui.editing=false;renderBar();render();return}
    toast('Uložení se nepovedlo. Zkuste to znovu.');
  }
}

render();cssColors(PALS[0][0],PALS[0][1]);S3.init();
window.addEventListener('load',function(){S3.measure();S3.scroll()});
setInterval(function(){
  if(document.hidden||ui.editing)return;
  var el=document.getElementById('rot');if(!el)return;
  wi=(wi+1)%WORDS.length;scrambleTo(el,WORDS[wi]);
},3000);
(async function(){
  try{
    if(!window.claude)return;
    var u=await window.claude.use('user');
    if(u&&await u.canEdit()){ui.canEdit=true;renderBar()}
  }catch(e){}
})();
})();

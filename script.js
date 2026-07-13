// ---------- UTILITY: VALIDATE URLs ----------
// Only allow http(s) destinations for any generated link.
function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// ---------- BLUEPRINT HELPERS ----------
function grid(){let g='';for(let x=0;x<=440;x+=20)g+=`<line class="grid" x1="${x}" y1="0" x2="${x}" y2="300"/>`;for(let y=0;y<=300;y+=20)g+=`<line class="grid" x1="0" y1="${y}" x2="440" y2="${y}"/>`;return g;}
function bp(inner){return `<svg class="bp" viewBox="0 0 440 300" role="img" aria-label="Build schematic">${grid()}<rect class="frame" x="2" y="2" width="436" height="296"/>${inner}</svg>`;}
// label with a leader line to a feature point. anchor: 'start' | 'end' | 'middle'
function L(t,anchor,tx,ty,fx,fy,amber){
  return `<line class="bpl" x1="${tx}" y1="${ty+3}" x2="${fx}" y2="${fy}"/><circle class="bpd" cx="${fx}" cy="${fy}" r="1.7"/>`+
         `<text class="bplbl${amber?' a':''}" x="${tx}" y="${ty}" text-anchor="${anchor}">${t}</text>`;
}
// standard open container: pass silhouette + waterline geometry + labels + extras
function trap(o){
  let s = o.body;
  if(o.water) s += o.water;
  s += `<line class="bpwl" x1="${o.wlL}" y1="${o.wl}" x2="${o.wlR}" y2="${o.wl}"/>`;
  s += `<path class="bpg" d="M${o.dunkX-36},${o.base-12} q5,-13 10,0 M${o.dunkX-12},${o.base-9} q5,-14 10,0 M${o.dunkX+12},${o.base-13} q5,-12 10,0"/>`;
  s += `<g class="bpdunk"><circle cx="${o.dunkX}" cy="${o.wl}" r="13"/><circle cx="${o.dunkX}" cy="${o.wl}" r="4.5"/></g>`;
  if(o.extra) s += o.extra;
  s += (o.labels||[]).join('');
  return bp(s);
}

// ---------- ARSENAL ----------
const PLATFORMS = [
  { desig:"M-5", name:"The Bucket", vibe:"Standard issue. Everyone's got one.",
    icon:`<svg class="pf-thumb" viewBox="0 0 48 48" aria-hidden="true"><path class="o" d="M12 14 L16 38 L32 38 L36 14 Z"/><line class="w" x1="15" y1="24" x2="33" y2="24"/><circle class="d" cx="24" cy="24" r="3.5"/></svg>`,
    good:["Free / everywhere","Easy 15-min build"], warn:["Tippy in wind","Small surface"],
    schem: trap({
      body:`<path class="body" d="M165,80 L177,250 L263,250 L275,80"/>`,
      water:`<path class="water" d="M180,150 L183,247 L257,247 L260,150 Z"/>`,
      wl:150, wlL:180, wlR:260, dunkX:220, base:250,
      extra:`<path class="ann" d="M275,124 h14 v6"/><rect class="anchor" x="180" y="252" width="80" height="9"/>`,
      labels:[
        L('OPEN TOP — SHE LAYS HERE','middle',220,40,220,80,false),
        L('SCREENED OVERFLOW','start',300,118,289,124,false),
        L('BTI DUNK','start',300,150,235,150,true),
        L('ANCHOR / PAVER','middle',220,278,220,261,false)
      ]
    }),
    steps:["Use a dark bucket (paint it black if it's pale — dark draws her in).","Fill about ¾ with water + a few handfuls of grass clippings. Let it get funky.","Leave the surface open — she has to land on the water to lay. Only if kids or pets roam nearby, cap it with coarse ½\" hardware cloth (she still flies through); never fine window screen, which keeps her out and kills the trap.","Drill a small overflow hole ~2\" below the rim and screen that hole inside so storms drain without flushing larvae.","Emplace it: bolt to a paver or strap to a T-post so the wind can't tip it."],
    kill:"1 Bti dunk" },

  { desig:"TUB", name:"Old Tub or Sink", vibe:"The lazy genius — it drains itself.",
    icon:`<svg class="pf-thumb" viewBox="0 0 48 48" aria-hidden="true"><path class="o" d="M11 16 Q11 38 18 38 L30 38 Q37 38 37 16"/><line class="w" x1="13" y1="25" x2="35" y2="25"/><circle class="d" cx="24" cy="25" r="3.5"/></svg>`,
    good:["Built-in drain plug","Too heavy to blow over","Indestructible"], warn:["Heavy to position once"],
    schem: trap({
      body:`<path class="body" d="M135,108 Q135,250 178,250 L262,250 Q305,250 305,108"/>`,
      water:`<path class="water" d="M144,150 Q146,243 182,243 L258,243 Q294,243 296,150 Z"/>`,
      wl:150, wlL:144, wlR:296, dunkX:220, base:250,
      extra:`<path class="ann" d="M214,250 v14 h6"/><circle class="ann" cx="220" cy="268" r="4.5"/>`,
      labels:[
        L('OPEN TOP — SHE LAYS HERE','middle',220,72,220,108,false),
        L('BTI DUNK','start',312,150,235,150,true),
        L('DRAIN PLUG','start',236,278,224,268,false)
      ]
    }),
    steps:["Set it roughly level somewhere shaded.","Fill with water + grass clippings; let it ferment a few days.","Leave the surface open for her to lay; if you must cover it for safety, use coarse ½\" hardware cloth — not fine window screen.","Service it the easy way: pull the drain plug, rinse, refill, re-dunk.","That existing drain is your whole maintenance plan — use it."],
    kill:"1 Bti dunk" },

  { desig:"DRM", name:"Halved Food Drum", vibe:"Two wide traps from one free barrel.",
    icon:`<svg class="pf-thumb" viewBox="0 0 48 48" aria-hidden="true"><path class="o" d="M8 18 L10 38 L38 38 L40 18"/><line class="w" x1="11" y1="27" x2="37" y2="27"/><circle class="d" cx="24" cy="27" r="3.5"/></svg>`,
    good:["Huge surface = more catch","Free from car washes / co-ops"], warn:["Light when empty — ballast it"],
    schem: trap({
      body:`<path class="body" d="M120,92 L128,248 L312,248 L320,92"/>`,
      water:`<path class="water" d="M128,150 L132,245 L308,245 L312,150 Z"/>`,
      wl:150, wlL:128, wlR:312, dunkX:220, base:248,
      extra:`<path class="ann" d="M320,124 h12 v6"/><rect class="anchor" x="150" y="250" width="20" height="13"/><rect class="anchor" x="180" y="250" width="20" height="13"/>`,
      labels:[
        L('½\" GUARD (SHE PASSES)','middle',220,52,220,92,false),
        L('SCREENED OVERFLOW','start',300,116,332,124,false),
        L('BTI DUNK','start',340,150,235,150,true),
        L('BALLAST (BRICKS)','middle',175,278,175,263,false)
      ]
    }),
    steps:["Get a food-grade plastic drum (free at car washes, breweries, co-ops). Cut it in half across the middle.","Darken the inside if it's pale; line cracks with scrap billboard vinyl.","Fill with water + grass clippings.","Leave the wide surface open — it's your best catch. For a child- and pet-safe cover use coarse ½\" hardware cloth she can fly through, never fine screen. Weigh it down with bricks or bolt it to a paver.","Add a screened overflow ~2\" below the rim for storms."],
    kill:"1 dunk per half" },

  { desig:"STK", name:"Stock Tank", vibe:"Built for the field. Cracked ones are free.",
    icon:`<svg class="pf-thumb" viewBox="0 0 48 48" aria-hidden="true"><path class="o" d="M7 20 Q7 38 13 38 L35 38 Q41 38 41 20"/><line class="w" x1="9" y1="28" x2="39" y2="28"/><circle class="d" cx="24" cy="28" r="3.5"/></svg>`,
    good:["Made for outdoors","Often has a drain plug","Low and stable"], warn:["Big — scale up the dunks"],
    schem: trap({
      body:`<path class="body" d="M110,116 Q110,248 138,248 L302,248 Q330,248 330,116"/>`,
      water:`<path class="water" d="M119,150 Q120,241 142,241 L298,241 Q318,241 319,150 Z"/>`,
      wl:150, wlL:119, wlR:319, dunkX:220, base:248,
      extra:`<path class="ann" d="M330,182 h12"/><circle class="ann" cx="344" cy="182" r="4.5"/>`,
      labels:[
        L('PATCH CRACKS','start',112,98,124,128,false),
        L('BTI DUNK','start',236,150,235,150,true),
        L('DRAIN PLUG','start',355,182,348,182,false)
      ]
    }),
    steps:["Beg a cracked or rusted-out tank off any rancher — they'll be glad it's gone.","Patch cracks with scrap billboard vinyl or pond-liner offcuts.","Fill with water + grass clippings; site it in shade.","Use the drain plug for easy servicing.","Scale your dunks to the size — one per ~100 sq ft of surface."],
    kill:"1 dunk per ~25 gallons (check the label)" },

  { desig:"TIR", name:"The Tire", vibe:"Her favorite nursery, turned against her.",
    icon:`<svg class="pf-thumb" viewBox="0 0 48 48" aria-hidden="true"><circle class="o" cx="24" cy="24" r="15"/><circle class="o" cx="24" cy="24" r="6"/><circle class="d" cx="24" cy="24" r="2.6"/></svg>`,
    good:["Free everywhere","Wind-proof","She already loves it"], warn:["Water hides in the bead — re-dose, don't drain"],
    schem: bp(
      `<path class="body" d="M95,205 Q95,150 140,150 Q180,150 180,188 Q190,205 220,205 Q250,205 260,188 Q260,150 300,150 Q345,150 345,205 Q345,240 300,240 L140,240 Q95,240 95,205 Z"/>`+
      `<path class="water" d="M186,200 Q188,213 220,213 Q252,213 254,200 Q254,208 220,208 Q188,208 186,200 Z"/>`+
      `<ellipse class="bpwl" cx="220" cy="201" rx="34" ry="4.5" fill="none"/>`+
      `<g class="bpdunk"><circle cx="220" cy="201" r="10"/><circle cx="220" cy="201" r="3.6"/></g>`+
      `<path class="bpg" d="M204,209 q4,-8 8,0 M232,209 q4,-8 8,0"/>`+
      L('WATER POOLS IN WELL','start',96,120,150,178,false)+
      L('BTI DUNK','start',300,150,232,199,true)+
      L('RE-DOSE — CANNOT FULLY DRAIN','middle',220,272,220,225,false)
    ),
    steps:["Tire shops pay to get rid of these — take a few off their hands.","Lay it flat or half-bury it in a ditch or low corner.","Fill the well with water + grass clippings.","Because you can't fully empty a tire, you maintain it by re-dosing — not draining.","Best emplaced in the spots that already hold water after rain."],
    kill:"1 Bti dunk, re-dosed monthly" },

  { desig:"FRZ", name:"Dead Chest Freezer", vibe:"An insulated tank you got for free.",
    icon:`<svg class="pf-thumb" viewBox="0 0 48 48" aria-hidden="true"><rect class="o" x="9" y="14" width="30" height="24"/><line class="o" x1="9" y1="19" x2="39" y2="19"/><line class="w" x1="13" y1="28" x2="35" y2="28"/><circle class="d" cx="24" cy="28" r="3.2"/></svg>`,
    good:["Insulated = steady ferment, slow evaporation","Watertight","Immovable"], warn:["Big footprint"],
    schem: trap({
      body:`<path class="body" d="M115,98 L115,250 L325,250 L325,98 M129,98 L129,236 L311,236 L311,98"/>`,
      water:`<path class="water" d="M129,150 L129,236 L311,236 L311,150 Z"/>`,
      wl:150, wlL:129, wlR:311, dunkX:220, base:236,
      extra:`<path class="ann" d="M325,206 h12"/><circle class="ann" cx="339" cy="206" r="4.5"/>`,
      labels:[
        L('½\" GUARD (SHE PASSES)','middle',220,62,220,98,false),
        L('INSULATED WALLS','start',118,82,122,120,false),
        L('BTI DUNK','start',236,150,235,150,true),
        L('LOW DRAIN','start',350,206,343,206,false)
      ]
    }),
    steps:["Grab a dead chest freezer or mini-fridge off a curb / Marketplace 'free' pile.","Prop the lid open or pull it off entirely.","Fill with water + grass clippings.","Leave it open so she can reach the water; if pets or kids are near, cap with coarse ½\" hardware cloth she flies through — not fine window screen.","Drill a low drain hole or keep a siphon hose handy for servicing."],
    kill:"Dunks by volume (check the label)" },

  { desig:"IMP", name:"Improvise", vibe:"It's the rules, not the container.",
    icon:`<svg class="pf-thumb" viewBox="0 0 48 48" aria-hidden="true"><path class="o dash-icon" d="M13 15 L16 38 L32 38 L35 15"/><text x="24" y="29" text-anchor="middle" font-family="'IBM Plex Mono',monospace" font-size="16" fill="var(--amber)">?</text></svg>`,
    good:["Use anything you've already got"], warn:["Must hold ≥2 gal & not blow over"],
    schem: trap({
      body:`<path class="body dash-schem" d="M165,90 L177,250 L263,250 L275,90"/>`,
      water:`<path class="water" d="M180,150 L183,247 L257,247 L260,150 Z"/>`,
      wl:150, wlL:180, wlR:260, dunkX:220, base:250,
      extra:`<path class="ann" d="M275,124 h14 v6"/><text x="220" y="122" font-family="'IBM Plex Mono',monospace" font-size="22" fill="#3f4a2e" text-anchor="middle">?</text>`,
      labels:[
        L('OPEN TOP — SHE LAYS HERE','middle',220,50,220,90,false),
        L('SCREENED OVERFLOW','start',300,118,289,124,false),
        L('BTI DUNK','start',300,150,235,150,true),
        L('ANY DARK VESSEL ≥ 2 GAL','middle',220,278,220,250,false)
      ]
    }),
    steps:["Any dark vessel that holds a couple gallons works: mortar tub, old cooler, water trough, tote.","Funky water + grass to lure her in.","A Bti dunk to kill the larvae — non-negotiable.","Keep the surface open so she can land and lay (coarse ½\" hardware-cloth cover only if safety needs it — never fine screen), plus a screened overflow so storms can't flush the larvae.","Anchor it against the wind, and keep it maintained."],
    kill:"Always a Bti dunk" }
];

const arsenal = document.getElementById('arsenal');

// el(tag, className?, text?) — an element with an optional class and text.
// Text always goes in via textContent, so it can never be parsed as markup.
function el(tag, className, text){
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text != null) n.textContent = text;
  return n;
}
// svgNode(markup) — turn a trusted, program-generated SVG string into live SVG
// nodes without an innerHTML sink. DOMParser never executes script or event
// handlers on parse, so this stays safe even if a schematic/icon ever came
// from dynamic data. The root <svg> needs an explicit xmlns because XML parsing
// (unlike the HTML parser) does not infer the SVG namespace, and without it the
// nodes would not render as graphics.
function svgNode(markup){
  if (!/\sxmlns=/.test(markup)) markup = markup.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
  if (doc.querySelector('parsererror')) return document.createComment('svg parse error');
  return document.importNode(doc.documentElement, true);
}

if (arsenal) PLATFORMS.forEach((p)=>{
  const card = el('div','platform');

  const btn = el('button','platform-btn');
  btn.setAttribute('aria-expanded','false');
  btn.appendChild(el('span','desig',p.desig));
  btn.appendChild(svgNode(p.icon));

  const name = el('span','pf-name');
  name.appendChild(el('span','pn',p.name));
  name.appendChild(el('span','pv',p.vibe));
  btn.appendChild(name);

  const cue = el('span','pf-cue');
  cue.appendChild(el('span','cue-label is-closed','TAP TO BUILD'));
  cue.appendChild(el('span','cue-label is-open','HIDE'));
  const chev = el('span','chev','▸'); chev.setAttribute('aria-hidden','true');
  cue.appendChild(chev);
  btn.appendChild(cue);
  card.appendChild(btn);

  const body = el('div','platform-body');
  const inner = el('div','pb-inner');
  inner.appendChild(svgNode(p.schem));
  inner.appendChild(el('p','bp-cap','FIELD SCHEMATIC — labeled for clarity.'));

  const tags = el('div','tags');
  p.good.forEach(g=>tags.appendChild(el('span','tag good',`+ ${g}`)));
  p.warn.forEach(w=>tags.appendChild(el('span','tag warn',`! ${w}`)));
  inner.appendChild(tags);

  const ol = el('ol','steps');
  p.steps.forEach(s=>ol.appendChild(el('li',null,s)));
  inner.appendChild(ol);

  const kill = el('div','kill-line');
  kill.appendChild(el('span','kx','KILL'));
  kill.appendChild(el('span','t',`${p.kill} — this is the part that does the work. Skip it and you've built a nursery.`));
  inner.appendChild(kill);

  body.appendChild(inner);
  card.appendChild(body);
  arsenal.appendChild(card);

  btn.addEventListener('click',()=>{
    const open=card.classList.toggle('open');
    btn.setAttribute('aria-expanded',open?'true':'false');
    body.style.maxHeight = open ? body.scrollHeight+'px' : '0';
  });
});

// ---------- RETAILERS ----------
const RETAILERS = [
  {n:"Amazon", d:"Dunks & Bits", u:"https://www.amazon.com/s?k=mosquito+dunks+and+bits"},
  {n:"Walmart", d:"Dunks & Bits", u:"https://www.walmart.com/search?q=mosquito%20dunks%20bits"},
  {n:"Target", d:"Dunks & Bits", u:"https://www.target.com/s?searchTerm=mosquito+dunks+bits"},
  {n:"Menards", d:"Dunks & Bits", u:"https://www.menards.com/main/search.html?search=mosquito+dunks+bits"},
  {n:"Tractor Supply", d:"Dunks & Bits", u:"https://www.tractorsupply.com/tsc/search/mosquito%20dunks"},
  {n:"Runnings", d:"check in store", u:"https://www.runnings.com/"}
];
const buy = document.getElementById('buy');
if (buy) RETAILERS.forEach(r=>{
  if (!isValidUrl(r.u)) return; // Skip anything that isn't a plain http(s) link
  const a=document.createElement('a');
  a.href=r.u; a.target="_blank"; a.rel="noopener noreferrer";
  a.appendChild(el('span','bn',`${r.n} ↗`));
  a.appendChild(el('span','bd',r.d));
  buy.appendChild(a);
});

// ---------- SHARE ----------
function toast(msg){const t=document.getElementById('toast');t.textContent=String(msg).substring(0,200);t.classList.add('show');clearTimeout(window._tt);window._tt=setTimeout(()=>t.classList.remove('show'),2600);}
function copyLink(){const url=location.href;if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(url).then(()=>toast('Link copied — send it to a neighbor')).catch(()=>toast('Copy the page link to share'));}else{toast('Copy the page link to share');}}
function shareSite(){const url=location.href;if(navigator.share){navigator.share({title:'Operation: Doland Skeeter War',text:'Protect your land from West Nile mosquitoes — here\'s how.',url:url}).catch(()=>{});}else{copyLink();}}
// Wire buttons here (no inline onclick handlers) so the page works under a strict
// script-src Content-Security-Policy that forbids inline script.
const shareBtn=document.getElementById('shareBtn'); if(shareBtn) shareBtn.addEventListener('click',shareSite);
const copyBtn=document.getElementById('copyBtn'); if(copyBtn) copyBtn.addEventListener('click',copyLink);

// ---------- SCROLL-SPY ----------
// Section links live in several places now (top bar, desktop section rail,
// context rail). Highlight every link that points at the active section.
const links=Array.from(document.querySelectorAll('.section-link'));
const spy=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){const href='#'+e.target.id;links.forEach(l=>l.classList.toggle('active',l.getAttribute('href')===href));}})},{rootMargin:'-45% 0px -50% 0px'});
document.querySelectorAll('.order').forEach(s=>spy.observe(s));

// ---------- REVEAL ----------
const revs=document.querySelectorAll('.reveal');
requestAnimationFrame(()=>revs.forEach((el,i)=>setTimeout(()=>el.classList.add('in'),80*i)));

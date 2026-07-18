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
// LEGACY flat-elevation container, kept only until every platform below is
// migrated to isoCyl/isoBox — remove once PLATFORMS has no more callers.
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

// A scrap board or long brick, angled diagonally from the container floor
// up past the rim, so any bird or critter that falls in can actually climb
// out over the edge — (tx,ty) and (bx,by) (both computed by the caller) are
// its two literal ends. Drawn as a plain outlined plank (one grain line down
// the middle, no rungs/steps) so it doesn't overstate what it actually is,
// and left unfilled to match the rest of the illustration's line-art style
// instead of reading as a solid sticker pasted on top.
function ramp(tx,ty,bx,by,w){
  const dx=bx-tx, dy=by-ty, len=Math.hypot(dx,dy);
  const nx=-dy/len*(w/2), ny=dx/len*(w/2); // unit normal, scaled to half-width
  const p1=[tx+nx,ty+ny], p2=[bx+nx,by+ny], p3=[bx-nx,by-ny], p4=[tx-nx,ty-ny];
  return `<g class="bpramp"><polygon class="board" points="${p1},${p2},${p3},${p4}"/>`+
         `<line class="grain" x1="${tx}" y1="${ty}" x2="${bx}" y2="${by}"/></g>`;
}
// A floating Mosquito Dunk — same tan/beige "donut" styling (an offset
// under-layer for rim thickness, a lighter top face, a pale center hole) as
// the Dunk-vs-Bits comparison illustration elsewhere on the page, so it
// reads as the actual product instead of an abstract ring.
function dunkMark(x,y,R){
  return `<g class="bpdunkmark"><ellipse class="under" cx="${x}" cy="${y+1.5}" rx="13" ry="${13*R}"/>`+
         `<ellipse class="top" cx="${x}" cy="${y}" rx="13" ry="${13*R}"/>`+
         `<ellipse class="hole" cx="${x}" cy="${y}" rx="4.5" ry="${4.5*R}"/></g>`;
}
// A mosquito standing on the water, laying an egg raft — drawn top-down (the
// natural view straight onto a water surface) then flattened with the same
// scale() the water ellipse itself uses, so it sits on the surface at the
// right isometric angle instead of floating on top of it looking flat-on.
function eggScene(x,y){
  // Kept deliberately tiny and simple — a small body dot with a few short
  // legs, not a detailed anatomical drawing (that read as oversized and
  // messy at this scale no matter how it was proportioned). Just enough to
  // register as "a bug standing on the water" next to its egg raft.
  return `<g class="bpegg" transform="translate(${x},${y}) scale(1,.4)">
    <ellipse class="raft" cx="6.5" cy="0" rx="3" ry="1.6"/>
    <ellipse class="body" cx="0" cy="0" rx="1.8" ry=".9"/>
    <path class="legs" d="M-1,-.5 l-4,-3 M0,-.9 l-2,-4 M1,-.5 l1,-4 M-1,.5 l-3,4 M0,.9 l-1,4 M1,.5 l3,3"/>
  </g>`;
}
// Isometric open-top vessel: a tapered "cylinder" built from a top rim
// ellipse, a smaller base ellipse, two tangent side lines, and a front-only
// base arc (the far side of the base is hidden behind the vessel's own
// walls). Covers the Bucket/Drum/Tank/Tub/Improvise platforms — each just
// passes different radii. ry is always rx*.35, the fixed "looking down at
// ~20 degrees" ratio used across every illustration so they all read as the
// same consistent viewing angle.
function isoCyl(o){
  const R=.35;
  const tRY=o.topRX*R, bRY=o.botRX*R;
  const cx=o.cx, tY=o.topY, bY=o.botY;
  const lT=[cx-o.topRX,tY], rT=[cx+o.topRX,tY], lB=[cx-o.botRX,bY], rB=[cx+o.botRX,bY];
  const bodyCls = o.dashed ? 'body dash-schem' : 'body';
  let s = `<path class="${bodyCls}" d="M${lT} A${o.topRX},${tRY} 0 1 1 ${rT} L${rB} A${o.botRX},${bRY} 0 0 1 ${lB} Z"/>`;
  s += `<ellipse class="${bodyCls}" cx="${cx}" cy="${tY}" rx="${o.topRX}" ry="${tRY}"/>`;
  if(o.waterY!=null){
    const t=(o.waterY-tY)/(bY-tY), wRX=o.topRX+t*(o.botRX-o.topRX), wRY=wRX*R;
    s += `<ellipse class="water" cx="${cx}" cy="${o.waterY}" rx="${wRX}" ry="${wRY}"/>`;
    s += `<ellipse class="bpwl" cx="${cx}" cy="${o.waterY}" rx="${wRX}" ry="${wRY}" fill="none"/>`;
    const dX=cx-wRX*.4, dY=o.waterY+wRY*.5; // lower-left, clear of the ramp's diagonal
    s += dunkMark(dX,dY,R);
    if(o.eggAt!==false){
      // Back of the surface, clear of the dunk and the ramp — clamped to
      // whatever room actually exists above the rim's own bottom edge, since
      // a fixed offset put it under the rim line on wide/shallow vessels
      // (the drum) even though it cleared easily on tall ones (the bucket).
      const rimBottom = tY+tRY;
      const eggY = o.waterY - Math.min(wRY*.55, (o.waterY-rimBottom)*.5);
      s += eggScene(cx-wRX*.1, eggY);
    }
    if(o.rampFrom!==false){
      // Rests on the floor on one side and crosses to the opposite rim,
      // extending past it — wedged corner-to-corner like a board actually
      // dropped in would settle, not just leaned against one wall (which
      // could slide straight down). Also long enough that anything
      // climbing it clears the rim instead of stopping at the water.
      const rBx=cx-o.botRX*.75, rBy=bY+bRY*.5;
      const rimX=cx+o.topRX*.8, rimY=tY+tRY*.3;
      const ux=rimX-rBx, uy=rimY-rBy, ulen=Math.hypot(ux,uy);
      const rTx=rimX+(ux/ulen)*42, rTy=rimY+(uy/ulen)*42;
      s += ramp(rTx,rTy,rBx,rBy,20);
    }
  }
  if(o.extra) s += o.extra;
  s += (o.labels||[]).join('');
  return bp(s);
}
// Isometric open-top "stadium" (rounded rectangle) vessel — an actual
// elongated bathtub/basin silhouette, for the one platform that's
// specifically a tub and not just a bigger bucket. topHalfL/topRD are the
// rim's half-length and end-cap radius; bot* are the (slightly smaller)
// base equivalents. Same R=.35 flattening as isoCyl, applied to the
// end-cap radius so the two shapes read as the same viewing angle.
function isoTub(o){
  const R=.35;
  const cx=o.cx, tY=o.topY, bY=o.botY;
  const tS=o.topHalfL-o.topRD, tRY=o.topRD*R;
  const bS=o.botHalfL-o.botRD, bRY=o.botRD*R;
  const stadium=(cy,s,rD,ry)=>`M${cx-s},${cy-ry} L${cx+s},${cy-ry} A${rD},${ry} 0 0 1 ${cx+s},${cy+ry} L${cx-s},${cy+ry} A${rD},${ry} 0 0 1 ${cx-s},${cy-ry} Z`;
  let s = `<path class="body" d="${stadium(tY,tS,o.topRD,tRY)}"/>`;
  s += `<path class="body" d="M${cx-o.topHalfL},${tY} L${cx-o.botHalfL},${bY} M${cx+o.topHalfL},${tY} L${cx+o.botHalfL},${bY} M${cx-bS},${bY+bRY} L${cx+bS},${bY+bRY}"/>`;
  if(o.waterY!=null){
    const t=(o.waterY-tY)/(bY-tY);
    const wHalfL=o.topHalfL+t*(o.botHalfL-o.topHalfL), wRD=o.topRD+t*(o.botRD-o.topRD), wRY=wRD*R, wS=wHalfL-wRD;
    s += `<path class="water" d="${stadium(o.waterY,wS,wRD,wRY)}"/>`;
    s += `<path class="bpwl" d="${stadium(o.waterY,wS,wRD,wRY)}" fill="none"/>`;
    const dX=cx-wHalfL*.35, dY=o.waterY+wRY*.5;
    s += dunkMark(dX,dY,R);
    if(o.eggAt!==false){
      const rimBottom = tY+tRY;
      const eggY = o.waterY - Math.min(wRY*.55, (o.waterY-rimBottom)*.5);
      s += eggScene(cx-wHalfL*.05, eggY);
    }
    if(o.rampFrom!==false){
      const rBx=cx-o.botHalfL*.7, rBy=bY+bRY*.4;
      const rimX=cx+o.topHalfL*.75, rimY=tY+tRY*.3;
      const ux=rimX-rBx, uy=rimY-rBy, ulen=Math.hypot(ux,uy);
      const rTx=rimX+(ux/ulen)*42, rTy=rimY+(uy/ulen)*42;
      s += ramp(rTx,rTy,rBx,rBy,20);
    }
  }
  if(o.extra) s += o.extra;
  s += (o.labels||[]).join('');
  return bp(s);
}
// Isometric tire, lying flat — an outer tread ring (drawn as a proper
// annulus via evenodd fill, not just an outline) around a shallow inner
// well where water actually collects. No ramp: unlike the tall
// straight-walled vessels, a tire's well is only a couple inches deep, not
// a drowning hazard that needs a climb-out.
function isoTire(o){
  const R=.35;
  const cx=o.cx, cyTop=o.cyTop;
  const Ro=o.outerRX, Ri=o.innerRX, H=o.height;
  const oRY=Ro*R, iRY=Ri*R;
  const cyBot=cyTop+H;
  // A tire lying flat is a CHUNKY rubber donut, not a flat ring. The thing
  // that makes it read as 3D is the visible height H — the outer sidewall
  // standing up off the ground (the band between the top rim ellipse and
  // the bottom/ground ellipse) — plus tread grooves running across that
  // outer rubber, which is the surface actually facing us here. Earlier
  // flat concentric-ellipse versions had zero height, so they read as a
  // hole/manhole. Lit top face (paler) over a shadowed sidewall (darker)
  // gives the rounded-rubber cue without a fussy gradient.
  const fullE=(rx,ry,ey)=>`M${cx-rx},${ey} A${rx},${ry} 0 1 0 ${cx+rx},${ey} A${rx},${ry} 0 1 0 ${cx-rx},${ey} Z`;
  // Vertical front band between two same-radius ellipses (an outer/inner wall).
  const wall=(rx,ry,yT,yB)=>`M${cx-rx},${yT} A${rx},${ry} 0 0 0 ${cx+rx},${yT} L${cx+rx},${yB} A${rx},${ry} 0 0 1 ${cx-rx},${yB} Z`;

  const wY=cyTop+H*.42, wRx=Ri*.9, wRy=wRx*R; // water pooled down inside the hole

  let s='';
  // 1. Outer sidewall (the tire's visible thickness, front half) — the
  //    rolling tread surface, seen edge-on here.
  s += `<path class="tire-side" d="${wall(Ro,oRY,cyTop,cyBot)}"/>`;
  // 2. Tread pattern across that surface: a circumferential groove splits
  //    it into two rows, and the transverse grooves in the two rows are
  //    offset half a step — the brick-like block stagger that reads as
  //    real tire tread instead of plain vertical scoring.
  const cyMid=cyTop+H/2;
  let g=`<path class="tread-circ" fill="none" d="M${cx-Ro},${cyMid} A${Ro},${oRY} 0 0 0 ${cx+Ro},${cyMid}"/>`;
  const n=13;
  const col=(a)=>{ const x=cx+Ro*Math.cos(a); return {x, yT:cyTop+oRY*Math.sin(a)}; };
  for(let i=0;i<=n;i++){                 // top row
    const {x,yT}=col(Math.PI*(0.045+0.91*(i/n)));
    g+=`<line x1="${x.toFixed(1)}" y1="${yT.toFixed(1)}" x2="${x.toFixed(1)}" y2="${(yT+H/2).toFixed(1)}"/>`;
  }
  for(let i=0;i<n;i++){                   // bottom row, staggered half a step
    const {x,yT}=col(Math.PI*(0.045+0.91*((i+0.5)/n)));
    g+=`<line x1="${x.toFixed(1)}" y1="${(yT+H/2).toFixed(1)}" x2="${x.toFixed(1)}" y2="${(yT+H).toFixed(1)}"/>`;
  }
  s += `<g class="tread-grooves">${g}</g>`;
  // 3. Lit top face — the rubber donut ring (evenodd hole at the wheel opening).
  s += `<path class="tire-top" fill-rule="evenodd" d="${fullE(Ro,oRY,cyTop)} ${fullE(Ri,iRY,cyTop)}"/>`;
  // 4. Inner wall of the hole (far side), giving the well visible depth.
  s += `<path class="tire-side" d="${wall(Ri,iRY,cyTop,wY)}"/>`;
  // 5. Water pooled in the hole.
  s += `<ellipse class="water" cx="${cx}" cy="${wY}" rx="${wRx}" ry="${wRy}"/>`;
  s += `<ellipse class="bpwl" cx="${cx}" cy="${wY}" rx="${wRx}" ry="${wRy}" fill="none"/>`;
  // 6. Crisp edges: outer top rim, outer ground edge (front), inner top rim.
  s += `<ellipse class="tire-edge" cx="${cx}" cy="${cyTop}" rx="${Ro}" ry="${oRY}"/>`;
  s += `<path class="tire-edge" fill="none" d="M${cx-Ro},${cyBot} A${Ro},${oRY} 0 0 0 ${cx+Ro},${cyBot}"/>`;
  s += `<ellipse class="tire-edge" cx="${cx}" cy="${cyTop}" rx="${Ri}" ry="${iRY}"/>`;
  // 7. Dunk + egg on the water.
  const dX=cx-wRx*.3, dY=wY+wRy*.3;
  s += dunkMark(dX,dY,R);
  s += eggScene(cx+wRx*.25, wY-wRy*.45);
  // 8. Ground the tire is sunk into (drawn last so the earth occludes the
  //    buried lower-front of the tire). The surface is flat beside the tire
  //    and dips forward across its front — the same perspective the water
  //    surface uses — so the tire reads as set INTO the ground, not on top
  //    of a flat line that would fight the isometric view.
  if(o.bury){
    const Yg=cyBot-o.bury*H, Lx=24, Rx=416, Bt=294;
    const surfY=(x)=> (x<=cx-Ro||x>=cx+Ro) ? Yg : Yg+oRY*Math.sqrt(Math.max(0,1-((x-cx)/Ro)**2));
    const line=`M${Lx},${Yg} L${cx-Ro},${Yg} A${Ro},${oRY} 0 0 0 ${cx+Ro},${Yg} L${Rx},${Yg}`;
    s += `<path class="ground-fill" d="${line} L${Rx},${Bt} L${Lx},${Bt} Z"/>`;
    s += `<path class="ground-line" fill="none" d="${line}"/>`;
    let ticks='';
    for(let x=Lx+8;x<Rx;x+=19){
      const y=surfY(x);
      ticks+=`<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x-5).toFixed(1)}" y2="${(y+7).toFixed(1)}"/>`;
    }
    s += `<g class="ground-hatch">${ticks}</g>`;
  }
  if(o.extra) s += o.extra;
  s += (o.labels||[]).join('');
  return bp(s);
}
// Isometric open-top rectangular box — a chest freezer, with double walls
// (outer shell + a smaller inner rim, the gap between them standing in for
// the insulation) instead of the tapered/rounded shapes used elsewhere.
// halfW/halfD are the outer rim's half-width and half-depth (halfD already
// unflattened; R is applied here same as every other shape); wall is the
// insulation thickness, and there's no taper top-to-bottom — a chest
// freezer's interior walls run straight, unlike a tapered bucket.
function isoBox(o){
  const R=.35;
  const cx=o.cx, tY=o.topY, bY=o.botY;
  const hw=o.halfW, hd=o.halfD*R;
  const w=o.wall, wd=w*R;
  const iw=hw-w, ihd=hd-wd;
  const H=bY-tY;
  const tl=[cx-hw,tY], tr=[cx+hw,tY], fl=[cx-hw,tY+hd*2], fr=[cx+hw,tY+hd*2];
  const bl=[cx-hw,tY+H], br=[cx+hw,tY+H];
  const fbl=[cx-hw,tY+hd*2+H], fbr=[cx+hw,tY+hd*2+H];
  const topFace=`M${cx},${tY-hd} L${cx+hw},${tY} L${cx},${tY+hd} L${cx-hw},${tY} Z`;
  const innerTop=`M${cx},${tY-ihd} L${cx+iw},${tY} L${cx},${tY+ihd} L${cx-iw},${tY} Z`;
  const frontFace=`M${cx-hw},${tY} L${cx},${tY+hd} L${cx},${tY+hd+H} L${cx-hw},${tY+H} Z`;
  const sideFace=`M${cx+hw},${tY} L${cx},${tY+hd} L${cx},${tY+hd+H} L${cx+hw},${tY+H} Z`;
  const innerFront=`M${cx-iw},${tY} L${cx},${tY+ihd} L${cx},${tY+ihd+H} L${cx-iw},${tY+H} Z`;
  const innerSide=`M${cx+iw},${tY} L${cx},${tY+ihd} L${cx},${tY+ihd+H} L${cx+iw},${tY+H} Z`;
  let s = '';
  s += `<path class="box-side" d="${sideFace}"/>`;
  s += `<path class="box-front" d="${frontFace}"/>`;
  s += `<path class="box-inner-side" d="${innerSide}"/>`;
  s += `<path class="box-inner-front" d="${innerFront}"/>`;
  s += `<path class="box-top" d="${topFace}"/>`;
  s += `<path class="box-inner-top" d="${innerTop}"/>`;
  if(o.waterY!=null){
    const wOff=o.waterY-tY;
    const waterDiamond=`M${cx},${tY+wOff-ihd} L${cx+iw},${tY+wOff} L${cx},${tY+wOff+ihd} L${cx-iw},${tY+wOff} Z`;
    s += `<path class="water" d="${waterDiamond}"/>`;
    s += `<path class="bpwl" fill="none" d="${waterDiamond}"/>`;
    const dX=cx-iw*.35, dY=o.waterY+ihd*.3;
    s += dunkMark(dX,dY,R);
    if(o.eggAt!==false) s += eggScene(cx+iw*.15, o.waterY-ihd*.4);
    if(o.rampFrom!==false){
      const rBx=cx-iw*.7, rBy=tY+ihd+H*.85;
      const rimX=cx+iw*.6, rimY=tY-ihd*.5;
      const ux=rimX-rBx, uy=rimY-rBy, ulen=Math.hypot(ux,uy);
      const rTx=rimX+(ux/ulen)*38, rTy=rimY+(uy/ulen)*38;
      s += ramp(rTx,rTy,rBx,rBy,18);
    }
  }
  if(o.extra) s += o.extra;
  s += (o.labels||[]).join('');
  return bp(s);
}

// ---------- ARSENAL ----------
const PLATFORMS = [
  { desig:"M-5", name:"The Bucket", vibe:"Standard issue. Everyone's got one.",
    icon:`<svg class="pf-thumb" viewBox="0 0 48 48" aria-hidden="true"><path class="o" d="M12 14 L16 38 L32 38 L36 14 Z"/><line class="w" x1="15" y1="24" x2="33" y2="24"/><circle class="d" cx="24" cy="24" r="3.5"/></svg>`,
    good:["Free / everywhere","Easy 15-min build","Bird-safe ramp"], warn:["Tippy in wind","Small surface"],
    schem: isoCyl({
      cx:210, topY:88, topRX:82, botY:232, botRX:56, waterY:150,
      extra:`<rect class="anchor" x="176" y="234" width="68" height="9"/><circle class="ann" cx="286" cy="124" r="5"/>`,
      labels:[
        L('SHE LAYS HERE','end',95,90,205,138,false),
        L('BTI DUNK','end',95,150,182,163,true),
        L('BIRD RAMP — CLIMB-OUT','end',95,210,192,210,false),
        L('OVERFLOW — 1½" HOLE','start',330,124,291,124,false),
        L('ANCHOR / PAVER','middle',210,280,210,244,false)
      ]
    }),
    steps:["Use a dark bucket (paint it black if it's pale — dark draws her in).","Fill about ¾ with water + a few handfuls of grass clippings. Let it get funky.","Leave the surface open — she has to land on the water to lay. Only if kids or pets roam nearby, cap it with coarse ½\" hardware cloth (she still flies through); never fine window screen, which keeps her out and kills the trap.","Lean a rough stick or a scrap-wood strip from the rim down into the water — a ramp so any bird or critter that falls in can climb back out.","Drill a ~1½\" overflow hole a couple inches below the rim so storms drain instead of topping it over. Screening it is optional.","Emplace it: bolt to a paver or strap to a T-post so the wind can't tip it."],
    kill:"1 Bti dunk" },

  { desig:"TUB", name:"Old Tub or Sink", vibe:"The lazy genius — it drains itself.",
    icon:`<svg class="pf-thumb" viewBox="0 0 48 48" aria-hidden="true"><path class="o" d="M11 16 Q11 38 18 38 L30 38 Q37 38 37 16"/><line class="w" x1="13" y1="25" x2="35" y2="25"/><circle class="d" cx="24" cy="25" r="3.5"/></svg>`,
    good:["Built-in drain plug","Too heavy to blow over","Indestructible","Bird-safe ramp"], warn:["Heavy to position once"],
    schem: isoTub({
      cx:210, topY:100, topHalfL:125, topRD:42, botY:205, botHalfL:108, botRD:35, waterY:145,
      extra:`<circle class="ann" cx="210" cy="217" r="5"/>`,
      labels:[
        L('SHE LAYS HERE','end',95,90,204,138,false),
        L('BTI DUNK','end',95,150,169,152,true),
        L('RAMP — CLIMB-OUT','end',95,210,160,194,false),
        L('DRAIN PLUG — STOP IT UP','middle',210,280,210,217,false)
      ]
    }),
    steps:["Set it roughly level somewhere shaded.","Stop up the drain first — the actual plug if it still has one, or a rubber stopper / silicone caulk if it doesn't. A slow leak drains the trap before it can do any work.","Fill with water + grass clippings; let it ferment a few days.","Leave the surface open for her to lay; if you must cover it for safety, use coarse ½\" hardware cloth — not fine window screen.","Lean a rough stick or a scrap-wood strip in from the rim — a ramp so any bird or critter that falls in can climb back out.","Service it the easy way: pull the drain plug, rinse, refill, re-dunk, then stop it back up.","That existing drain is your whole maintenance plan — use it."],
    kill:"1 Bti dunk" },

  { desig:"DRM", name:"Halved Food Drum", vibe:"Two wide traps from one free barrel.",
    icon:`<svg class="pf-thumb" viewBox="0 0 48 48" aria-hidden="true"><path class="o" d="M8 18 L10 38 L38 38 L40 18"/><line class="w" x1="11" y1="27" x2="37" y2="27"/><circle class="d" cx="24" cy="27" r="3.5"/></svg>`,
    good:["Huge surface = more catch","Free from car washes / co-ops","Bird-safe ramp"], warn:["Light when empty — ballast it"],
    schem: isoCyl({
      cx:210, topY:92, topRX:106, botY:225, botRX:99, waterY:150,
      extra:`<rect class="anchor" x="165" y="228" width="22" height="12"/><rect class="anchor" x="200" y="228" width="22" height="12"/><circle class="ann" cx="314" cy="125" r="5"/>`,
      labels:[
        L('SHE LAYS HERE','end',95,90,200,130,false),
        L('BTI DUNK','end',95,150,169,168,true),
        L('RAMP — CLIMB-OUT','end',95,210,173,210,false),
        L('OVERFLOW — 1½" HOLE','start',322,125,319,125,false),
        L('BALLAST (BRICKS)','middle',210,280,200,232,false)
      ]
    }),
    steps:["Get a food-grade plastic drum (free at car washes, breweries, co-ops). Cut it in half across the middle.","Darken the inside if it's pale; line cracks with scrap billboard vinyl.","Fill with water + grass clippings.","Leave the wide surface open — it's your best catch. For a child- and pet-safe cover use coarse ½\" hardware cloth she can fly through, never fine screen. Weigh it down with bricks or bolt it to a paver.","Lean a rough stick or a scrap-wood strip from the rim into the water — a ramp so any bird or critter that falls in can climb back out.","Drill a ~1½\" overflow hole a couple inches below the rim for storms. Screening it is optional."],
    kill:"1 dunk per half" },

  { desig:"STK", name:"Stock Tank", vibe:"Built for the field. Cracked ones are free.",
    icon:`<svg class="pf-thumb" viewBox="0 0 48 48" aria-hidden="true"><path class="o" d="M7 20 Q7 38 13 38 L35 38 Q41 38 41 20"/><line class="w" x1="9" y1="28" x2="39" y2="28"/><circle class="d" cx="24" cy="28" r="3.5"/></svg>`,
    good:["Made for outdoors","Often has a drain plug","Low and stable","Bird-safe ramp"], warn:["Big — scale up the dunks"],
    schem: isoCyl({
      cx:210, topY:112, topRX:108, botY:224, botRX:96, waterY:158,
      extra:`<circle class="ann" cx="312" cy="151" r="5"/>`,
      labels:[
        L('SHE LAYS HERE','end',95,90,200,154,false),
        L('BTI DUNK','end',95,150,169,176,true),
        L('RAMP — CLIMB-OUT','end',95,210,169,218,false),
        L('DRAIN PLUG','start',330,151,312,151,false)
      ]
    }),
    steps:["Beg a cracked or rusted-out tank off any rancher — they'll be glad it's gone.","Look it over first: check for cracks or rusted-through spots, and patch anything you find with scrap billboard vinyl or pond-liner offcuts.","Fill with water + grass clippings; site it in shade.","Lean a rough stick or a scrap-wood strip in from the rim — a ramp so any bird or critter that falls in can climb back out.","Use the drain plug for easy servicing.","Scale your dunks to the size — one per ~100 sq ft of surface."],
    kill:"1 dunk per ~25 gallons (check the label)" },

  { desig:"TIR", name:"The Tire", vibe:"Her favorite nursery, turned against her.",
    icon:`<svg class="pf-thumb" viewBox="0 0 48 48" aria-hidden="true"><circle class="o" cx="24" cy="24" r="15"/><circle class="o" cx="24" cy="24" r="6"/><circle class="d" cx="24" cy="24" r="2.6"/></svg>`,
    good:["Free everywhere","Wind-proof","She already loves it"], warn:["Water hides in the bead — re-dose, don't drain"],
    schem: isoTire({
      cx:220, cyTop:138, outerRX:120, innerRX:64, height:46, bury:0.3,
      labels:[
        L('WATER POOLS IN WELL','end',150,95,232,153,false),
        L('BTI DUNK','end',95,150,202,164,true),
        L('SET IN GROUND','start',325,210,281,203,false)
      ]
    }),
    steps:["Tire shops pay to get rid of these — take a few off their hands.","Lay it flat or half-bury it in a ditch or low corner.","Fill the well with water + grass clippings.","Because you can't fully empty a tire, you maintain it by re-dosing — not draining.","Best emplaced in the spots that already hold water after rain."],
    kill:"1 Bti dunk, re-dosed monthly" },

  { desig:"FRZ", name:"Dead Chest Freezer", vibe:"An insulated tank you got for free.",
    icon:`<svg class="pf-thumb" viewBox="0 0 48 48" aria-hidden="true"><rect class="o" x="9" y="14" width="30" height="24"/><line class="o" x1="9" y1="19" x2="39" y2="19"/><line class="w" x1="13" y1="28" x2="35" y2="28"/><circle class="d" cx="24" cy="28" r="3.2"/></svg>`,
    good:["Insulated = steady ferment, slow evaporation","Watertight","Immovable"], warn:["Big footprint"],
    schem: isoBox({
      cx:210, topY:120, botY:250, halfW:110, halfD:80, wall:12, waterY:175,
      extra:`<circle class="ann" cx="320" cy="220" r="5"/>`,
      labels:[
        L('INSULATED WALLS','end',95,60,120,90,false),
        L('SHE LAYS HERE','end',95,120,195,163,false),
        L('BTI DUNK','end',95,170,175,185,true),
        L('RAMP — CLIMB-OUT','end',95,220,172,220,false),
        L('LOW DRAIN','start',330,220,325,220,false)
      ]
    }),
    steps:["Grab a dead chest freezer or mini-fridge off a curb / Marketplace 'free' pile.","Prop the lid open or pull it off entirely.","Fill with water + grass clippings.","Leave it open so she can reach the water; if pets or kids are near, cap with coarse ½\" hardware cloth she flies through — not fine window screen.","Lean a rough stick or a scrap-wood strip from the rim down into the water — a ramp so any bird or critter that falls in can climb back out.","Drill a low drain hole or keep a siphon hose handy for servicing."],
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

// ---------- JUMP-TO NAV ----------
// Native <details> stays open after a link inside it is tapped; close it so
// the dropdown doesn't linger over the page once the user has navigated.
const jumpnav=document.getElementById('jumpnav');
if (jumpnav) jumpnav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{ jumpnav.open=false; }));

// ---------- SCROLL-SPY ----------
// Section links live in several places now (top bar, desktop section rail,
// context rail). Highlight every link that points at the active section.
const links=Array.from(document.querySelectorAll('.section-link'));
const spy=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){const href='#'+e.target.id;links.forEach(l=>l.classList.toggle('active',l.getAttribute('href')===href));}})},{rootMargin:'-45% 0px -50% 0px'});
document.querySelectorAll('.order').forEach(s=>spy.observe(s));

// ---------- REVEAL ----------
const revs=document.querySelectorAll('.reveal');
requestAnimationFrame(()=>revs.forEach((el,i)=>setTimeout(()=>el.classList.add('in'),80*i)));

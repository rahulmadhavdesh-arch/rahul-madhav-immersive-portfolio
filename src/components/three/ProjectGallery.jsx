import React, { useEffect, useRef } from 'react';
import * as T from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const PALETTE = ['#ff6b57', '#4be1ff', '#8f7bff', '#ffd84a', '#c9ff4a', '#ff6b57'];
// Card-sized previews do not benefit perceptibly from transmission, clearcoat,
// sheen, or procedural roughness maps. Those MeshPhysicalMaterial features were
// creating several expensive shader variants in a second WebGL context. Keep
// the same palette and material roles with one lightweight standard shader.
function makeGalleryMaterials() {
  return {
    ceramic: new T.MeshStandardMaterial({ color: '#d7dbe4', metalness: .58, roughness: .3 }),
    rubber: new T.MeshStandardMaterial({ color: '#11131a', metalness: .03, roughness: .82 }),
    dark: new T.MeshStandardMaterial({ color: '#252936', metalness: .52, roughness: .38 }),
    status: new T.MeshStandardMaterial({ color: '#4be1ff', emissive: '#4be1ff', emissiveIntensity: 1.4, roughness: .42 }),
    lens: new T.MeshStandardMaterial({ color: '#26354d', metalness: .3, roughness: .14 }),
    glass: new T.MeshStandardMaterial({ color: '#bff0ff', metalness: .08, roughness: .18, transparent: true, opacity: .58, depthWrite: false }),
  };
}
function add(parent, geometry, material, x=0,y=0,z=0) {
  const mesh = new T.Mesh(geometry, material); mesh.position.set(x,y,z); parent.add(mesh); return mesh;
}
const box = (p,m,size,pos=[0,0,0],r=.08) => add(p,new RoundedBoxGeometry(...size,3,r),m,...pos);
const cyl = (p,m,r,h,pos=[0,0,0],bottom=r) => add(p,new T.CylinderGeometry(r,bottom,h,40),m,...pos);
function tube(p,m,points,r=.025) { return add(p,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v))),48,r,10,false),m); }

function rodBetween(parent, material, a, b, radius=.045, segments=28) {
  const start=new T.Vector3(...a),end=new T.Vector3(...b),delta=end.clone().sub(start);
  const mesh=add(parent,new T.CylinderGeometry(radius,radius,delta.length(),segments),material);
  mesh.position.copy(start).add(end).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());
  return mesh;
}

function jointHousing(parent, materials, position, scale=1) {
  const g=new T.Group();g.position.set(...position);parent.add(g);
  add(g,new T.SphereGeometry(.16*scale,32,20),materials.black);
  const collarA=add(g,new T.CylinderGeometry(.19*scale,.19*scale,.075*scale,32),materials.steel);
  collarA.rotation.x=Math.PI/2;
  const collarB=add(g,new T.CylinderGeometry(.12*scale,.12*scale,.22*scale,32),materials.black);
  collarB.rotation.z=Math.PI/2;
  const knob=add(g,new T.CylinderGeometry(.095*scale,.095*scale,.07*scale,8),materials.black,.2*scale,.08*scale,0);
  knob.rotation.z=Math.PI/2;
  return g;
}

/** Passive ENT support arm: G-clamp, long boom, elbow drop, endoscope claw. */
function buildEntArm() {
  const root=new T.Group();
  const steel=new T.MeshStandardMaterial({color:'#c6cfd8',metalness:.88,roughness:.22});
  const darkSteel=new T.MeshStandardMaterial({color:'#59636d',metalness:.74,roughness:.33});
  const black=new T.MeshStandardMaterial({color:'#15181d',metalness:.2,roughness:.58});
  const scopeGold=new T.MeshStandardMaterial({color:'#b9a253',metalness:.62,roughness:.3});
  const cable=new T.MeshStandardMaterial({color:'#8b949d',metalness:.05,roughness:.74});
  const materials={steel,darkSteel,black};

  // The pinch collar repeated at every adjustable joint on the real arm.
  const collar=(x,y,z,s=1)=>{
    const c=add(root,new T.CylinderGeometry(.125*s,.125*s,.3*s,26),darkSteel,x,y,z);
    c.rotation.z=Math.PI/2;
    add(root,new T.CylinderGeometry(.048*s,.066*s,.12*s,14),black,x,y+.18*s,z);
    return c;
  };

  // G-clamp: bites the table edge or the microscope column.
  box(root,steel,[.11,.9,.34],[2.14,0,0],.025);
  box(root,steel,[.46,.11,.34],[1.9,.39,0],.025);
  box(root,steel,[.46,.11,.34],[1.9,-.39,0],.025);
  add(root,new T.CylinderGeometry(.042,.042,.5,16),darkSteel,1.74,-.16,0);
  add(root,new T.CylinderGeometry(.135,.135,.06,24),steel,1.74,-.44,0);
  const rim=add(root,new T.TorusGeometry(.135,.022,8,28),darkSteel,1.74,-.44,0);
  rim.rotation.x=Math.PI/2;

  // The long boom. This is the reach the earlier version was missing.
  collar(1.55,.06,0);
  rodBetween(root,steel,[1.62,.06,0],[-.32,.34,0],.062,30);
  collar(-.32,.34,0);

  // Elbow: the boom turns over and drops toward the patient.
  tube(root,steel,[[-.36,.34,0],[-.92,.36,0],[-1.12,.06,0],[-1.16,-.42,0]],.062);
  collar(-1.16,-.52,0,.92);

  // Distal ball joint, the one that was custom made for friction.
  add(root,new T.SphereGeometry(.17,28,18),black,-1.18,-.78,0);
  add(root,new T.CylinderGeometry(.09,.09,.2,20),darkSteel,-1.18,-.62,0);
  const tKnob=add(root,new T.CylinderGeometry(.05,.062,.22,14),black,-.97,-.78,0);
  tKnob.rotation.z=Math.PI/2;

  // The claw that grips the scope barrel.
  const scope=new T.Group();scope.position.set(-1.3,-1.0,0);scope.rotation.z=.38;root.add(scope);
  for(const y of [.05,-.14]) {
    const jaw=add(scope,new T.TorusGeometry(.16,.036,9,26,Math.PI*1.45),black,0,y,0);
    jaw.rotation.set(Math.PI/2,0,-Math.PI*.28);
  }
  box(scope,black,[.13,.3,.17],[.2,-.05,0],.035);

  // Endoscope camera head: gold barrel, knurled collar, rigid scope below.
  add(scope,new T.CylinderGeometry(.155,.185,.52,30),scopeGold,0,.52,0);
  add(scope,new T.SphereGeometry(.155,24,14),scopeGold,0,.78,0);
  add(scope,new T.CylinderGeometry(.115,.115,.16,24),steel,0,.2,0);
  const knurl=add(scope,new T.TorusGeometry(.118,.014,6,24),darkSteel,0,.2,0);
  knurl.rotation.x=Math.PI/2;
  rodBetween(scope,steel,[0,-.2,0],[0,-1.12,0],.032,18);
  add(scope,new T.CylinderGeometry(.028,.016,.1,16),steel,0,-1.17,0);

  // Imaging cable off the back of the head, kept quiet.
  tube(root,cable,[[-1.61,-.28,0],[-1.95,-.1,-.1],[-2.1,-.7,-.16],[-1.75,-1.4,-.1],[-1.1,-1.62,0]],.036);

  root.rotation.set(.1,-.34,-.04);
  return {root,materials:[steel,darkSteel,black,scopeGold,cable]};
}

/** Illustrative models, not reproductions of Rahul's CAD or clinical devices. */
function makeModel(index,m) {
  const root = new T.Group(), moving=[];
  const copper = new T.MeshPhysicalMaterial({color:'#c88554',metalness:.86,roughness:.25,clearcoat:.4});
  const titanium = new T.MeshStandardMaterial({color:'#b8c7d5',metalness:.84,roughness:.23});
  const extras=[copper,titanium];
  if(index===0) {
    // cuff manometer: handheld body, OLED face, control buttons, cuff line
    box(root,m.ceramic,[1.35,2.05,.48],[0,0,0],.2);box(root,m.dark,[1.15,1.87,.09],[0,0,.25],.15);
    box(root,m.lens,[.95,.77,.055],[0,.39,.31],.07);
    const c=document.createElement('canvas');c.width=512;c.height=384;const g=c.getContext('2d');g.fillStyle='#08121c';g.fillRect(0,0,512,384);g.fillStyle='#74e0ff';g.font='26px sans-serif';g.fillText('CUFF PRESSURE',35,68);g.font='100px sans-serif';g.fillText('20.0',35,208);g.font='22px sans-serif';g.fillText('kPa  /  DEMO',35,267);g.strokeStyle='#74e0ff';g.beginPath();for(let x=35;x<480;x++) {const y=325+Math.sin(x*.08)*5+Math.sin(x*.024)*8;x===35?g.moveTo(x,y):g.lineTo(x,y);}g.stroke();
    const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;add(root,new T.PlaneGeometry(.83,.64),new T.MeshBasicMaterial({map:tex}),0,.4,.345);
    for(const x of [-.31,0,.31]){const b=cyl(root,x===0?m.status:m.ceramic,.075,.025,[x,-.38,.325]);b.rotation.x=Math.PI/2;}
    box(root,m.ceramic,[.72,.025,.03],[0,-.75,.325],.012);
    cyl(root,titanium,.09,.24,[.28,1.1,0]);tube(root,m.rubber,[[.28,1.18,0],[.32,1.9,0],[1.2,1.8,0],[1.42,.1,-.1],[1,-1.3,0]],.045);
    root.rotation.set(-.18,-.4,-.16);
  } else if(index===1) {
    const arm=buildEntArm();root.add(arm.root);extras.push(...arm.materials);
  } else if(index===2) {
    // hydration wearable, pill footprint straight off the CAD. a stadium is a
    // centre box capped by a cylinder at each end, so every tier is built that way.
    const chrome=new T.MeshStandardMaterial({color:'#cfd6de',metalness:.92,roughness:.16});
    const lidGrey=new T.MeshStandardMaterial({color:'#6e737a',metalness:.5,roughness:.42});
    extras.push(chrome,lidGrey);
    const stadium=(mat,halfLen,radius,height,y)=>{
      box(root,mat,[halfLen*2,height,radius*2],[0,y,0],.012);
      for(const x of [-halfLen,halfLen]) add(root,new T.CylinderGeometry(radius,radius,height,44),mat,x,y,0);
    };
    stadium(m.dark,.72,.58,.30,-.04);
    stadium(chrome,.73,.595,.09,.13);
    stadium(m.dark,.72,.58,.08,.21);
    stadium(lidGrey,.66,.52,.05,.26);
    box(root,m.dark,[1.5,.07,.3],[.06,-.10,.72],.03);
    box(root,m.dark,[.22,.13,.26],[.78,-.06,.72],.03);
    const fluid=new T.MeshPhysicalMaterial({color:'#7fe3ff',metalness:.05,roughness:.18,transparent:true,opacity:.8});
    extras.push(fluid);
    box(root,fluid,[1.0,.05,.1],[0,-.2,0],.02);
    for(const z of [-.22,.22]) box(root,fluid,[.34,.05,.08],[.3,-.2,z],.02);
    const pcb=new T.Group();root.add(pcb);moving.push({o:pcb,y:0,d:.78});
    const green=new T.MeshStandardMaterial({color:'#1d6b45',metalness:.25,roughness:.55});
    extras.push(green);
    // seated inside the base cavity, which runs y -.19 to .11, so the board is
    // enclosed at rest and only clears the lid once hover lifts the group
    add(pcb,new T.CylinderGeometry(.45,.45,.05,40),green,-.2,-.04,0);
    for(let n=0;n<3;n++) add(pcb,new T.CylinderGeometry(.045,.045,.07,16),copper,-.2+.22*Math.cos(n*2.1),.02,.22*Math.sin(n*2.1));
    box(pcb,m.dark,[.22,.06,.16],[-.26,.02,0],.02);
    root.rotation.set(.4,-.55,.04);
  } else if(index===3) {
    // chassis built to the CAD: braced front hoop, flat mid rails widening back,
    // and the trapezoid roll cage standing over the rear axle
    const bar=(a,b,r=.036)=>rodBetween(root,m.status,a,b,r,14);
    const F1=[-.38,0,-1.62],F2=[.38,0,-1.62],F3=[-.58,0,-1.22],F4=[.58,0,-1.22],F5=[-.58,0,-.80],F6=[.58,0,-.80];
    const M1=[-.60,0,-.10],M2=[.60,0,-.10];
    const R1=[-.72,0,.30],R2=[.72,0,.30],R3=[-.72,0,1.55],R4=[.72,0,1.55];
    const T1=[-.40,.95,.62],T2=[.40,.95,.62],T3=[-.40,.95,1.32],T4=[.40,.95,1.32];
    bar(F1,F2);bar(F1,F3);bar(F2,F4);bar(F3,F5);bar(F4,F6);bar(F3,F4);bar(F5,F6);
    bar(F3,F6,.027);bar(F4,F5,.027);
    bar(F5,M1);bar(F6,M2);bar(M1,R1);bar(M2,R2);bar(M1,M2,.03);
    bar(R1,R2);bar(R3,R4);bar(R1,R3);bar(R2,R4);
    for(const z of [.62,.95,1.28]) bar([-.72,0,z],[.72,0,z],.027);
    bar(R1,T1);bar(R2,T2);bar(R3,T3);bar(R4,T4);
    bar(T1,T2);bar(T3,T4);bar(T1,T3);bar(T2,T4);
    bar(R1,T3,.025);bar(R3,T1,.025);bar(R2,T4,.025);bar(R4,T2,.025);
    bar([-.58,.46,.44],[-.58,.46,1.44],.025);bar([.58,.46,.44],[.58,.46,1.44],.025);
    bar([-.40,.95,.97],[.40,.95,.97],.025);
    // front spindle plates, the flat tabs hanging off each front corner
    for(const x of [-.66,.66]) for(const z of [-1.46,-.95]) {
      box(root,titanium,[.2,.05,.24],[x,.02,z],.01);
      cyl(root,m.dark,.032,.15,[x,.06,z]);
    }
    // wheels: small up front, fat pair on the driven axle
    for(const [x,z,rad] of [[-.92,-1.2,.29],[.92,-1.2,.29],[-.95,1.0,.36],[.95,1.0,.36]]) {
      const tire=cyl(root,m.rubber,rad,rad>.3?.3:.22,[x,rad-.3,z]);tire.rotation.z=Math.PI/2;
      const hub=cyl(root,titanium,rad*.5,rad>.3?.32:.24,[x,rad-.3,z]);hub.rotation.z=Math.PI/2;
    }
    // seat pan, steering column and the engine sitting in the rear bay
    const seat=box(root,m.dark,[.62,.1,.66],[0,.14,.1],.07);
    const back=box(root,m.dark,[.6,.62,.11],[0,.44,.44],.07);back.rotation.x=.22;
    rodBetween(root,titanium,[0,.1,-.72],[0,.6,-1.02],.026,12);
    const wheelRim=add(root,new T.TorusGeometry(.22,.022,8,44),m.rubber,0,.62,-1.05);wheelRim.rotation.x=-.62;
    box(root,m.ceramic,[.46,.42,.5],[.2,.3,1.0],.05);
    cyl(root,titanium,.1,.26,[-.3,.34,1.02]);
    root.rotation.set(.38,-.62,.02);
  } else if(index===4) {
    const balloon=add(root,new T.SphereGeometry(.9,56,40),m.ceramic,0,.75,0);balloon.scale.set(1.5,.85,1);
    for(let n=0;n<10;n++){const rib=add(root,new T.TorusGeometry(.902,.004,4,64),titanium,0,.75,0);rib.rotation.y=n*Math.PI/10;rib.scale.set(1.5,.85,1);}
    const cell=new T.MeshPhysicalMaterial({color:'#1c2a54',metalness:.55,roughness:.2,clearcoat:1});
    extras.push(cell);
    for(const side of [-1,1]) {const panel=new T.Group();panel.position.set(side*1.3,-.3,0);panel.rotation.z=side*.12;root.add(panel);box(panel,titanium,[1.45,.04,.95]);for(let x=0;x<6;x++)for(let z=0;z<4;z++)box(panel,cell,[.217,.02,.215],[(x-2.5)*.23,.035,(z-1.5)*.23],.004);tube(root,titanium,[[side*.4,.3,0],[side*.45,-.5,0],[side*1.4,-.5,0]],.015);}
    box(root,m.dark,[.4,.36,.35],[0,-.55,0]);box(root,m.status,[.32,.02,.03],[0,-.5,.19],.005);root.rotation.set(.22,-.3,-.07);
  } else if(index===5) {
    // jetbot: anodised green chassis, two driven wheels on a rear caster, the
    // jetson stack with its finned heatsink and fan, camera bracket, wifi pair
    const anod=new T.MeshStandardMaterial({color:'#4cc41f',metalness:.45,roughness:.36});
    const pcbDark=new T.MeshStandardMaterial({color:'#14161b',metalness:.3,roughness:.6});
    extras.push(anod,pcbDark);
    box(root,anod,[1.5,.62,1.0],[0,0,0],.05);
    for(const x of [-.92,.92]) {
      const tire=cyl(root,m.rubber,.52,.26,[x,-.06,-.02]);tire.rotation.z=Math.PI/2;
      const hub=cyl(root,m.ceramic,.27,.28,[x,-.06,-.02]);hub.rotation.z=Math.PI/2;
    }
    add(root,new T.SphereGeometry(.16,20,14),m.ceramic,0,-.38,-.52);
    box(root,pcbDark,[1.12,.05,.78],[0,.36,0],.02);
    box(root,pcbDark,[1.06,.05,.72],[0,.52,0],.02);
    box(root,pcbDark,[.66,.16,.6],[-.06,.64,0],.02);
    for(let n=0;n<9;n++) box(root,titanium,[.035,.17,.52],[-.34+n*.072,.8,0],.006);
    box(root,m.dark,[.42,.12,.42],[-.06,.94,0],.04);
    cyl(root,m.dark,.16,.045,[-.06,1.01,0]);
    box(root,anod,[.16,.44,.3],[.66,.5,.16],.03);
    box(root,pcbDark,[.1,.26,.3],[.74,.74,.2],.02);
    const lens=cyl(root,m.lens,.08,.07,[.8,.76,.2]);lens.rotation.z=Math.PI/2;
    for(const z of [-.26,.26]) {
      const ant=cyl(root,m.dark,.035,1.5,[-.42,1.42,z]);ant.rotation.x=z>0?.12:-.12;
      add(root,new T.SphereGeometry(.04,12,8),m.dark,-.42,2.17,z);
    }
    // the apriltag on its mast, which is what the overhead camera actually reads
    cyl(root,anod,.045,.95,[.12,1.18,-.05]);
    const tc=document.createElement('canvas');tc.width=tc.height=256;
    const tg=tc.getContext('2d');tg.fillStyle='#fff';tg.fillRect(0,0,256,256);
    tg.fillStyle='#000';tg.fillRect(32,32,192,192);
    tg.fillStyle='#fff';
    const cells=[[1,1],[3,1],[1,2],[2,3],[4,2],[3,4],[1,4],[4,4]];
    for(const [cx,cy] of cells) tg.fillRect(32+cx*32,32+cy*32,32,32);
    const tt=new T.CanvasTexture(tc);tt.colorSpace=T.SRGBColorSpace;extras.push(tt);
    const plate=add(root,new T.PlaneGeometry(.78,.78),new T.MeshBasicMaterial({map:tt,side:T.DoubleSide}),.12,1.72,-.05);
    plate.rotation.set(-.32,0,0);
    root.rotation.set(.2,-.55,0);
  } else {
    // the ME counter: one shaft, six digits, each a different era of material.
    // wood at the far end through metal and plastic to the electronic digits.
    const woodM=new T.MeshStandardMaterial({color:'#8a5a32',metalness:.05,roughness:.72});
    const brassM=new T.MeshStandardMaterial({color:'#b9a253',metalness:.72,roughness:.3});
    const acrylic=new T.MeshPhysicalMaterial({color:'#bfe6ff',metalness:0,roughness:.08,transmission:.82,thickness:.4,transparent:true,opacity:.6});
    const panelM=new T.MeshStandardMaterial({color:'#2f3f8f',metalness:.2,roughness:.6});
    const ledM=new T.MeshBasicMaterial({color:'#ff3b30'});
    extras.push(woodM,brassM,acrylic,panelM,ledM);

    // backing panel and the shaft the whole row turns on
    box(root,panelM,[3.5,.9,.12],[0,0,-.42],.02);
    box(root,m.ceramic,[3.5,.12,.5],[0,-.52,-.2],.02);
    const shaft=cyl(root,titanium,.045,3.3,[0,0,0]);shaft.rotation.z=Math.PI/2;

    // a toothed drum: cylinder with numerals cut round it, teeth as small blocks
    const drum=(mat,x,rad,wide)=>{
      const d=cyl(root,mat,rad,wide,[x,0,0]);d.rotation.z=Math.PI/2;
      for(let n=0;n<16;n++){
        const a=n/16*Math.PI*2;
        box(root,mat,[wide*.82,.07,.12],[x,Math.sin(a)*(rad+.03),Math.cos(a)*(rad+.03)],.01);
      }
      return d;
    };
    drum(woodM,1.32,.42,.5);
    drum(woodM,.78,.40,.44);
    drum(brassM,.3,.38,.4);
    drum(acrylic,-.14,.34,.36);

    // seven segment digit, then the microcontroller end of the story
    box(root,m.dark,[.34,.5,.26],[-.62,0,0],.03);
    for(const [dx,dy,w,h] of [[0,.16,.16,.035],[0,0,.16,.035],[0,-.16,.16,.035],[-.08,.08,.035,.13],[.08,.08,.035,.13],[-.08,-.08,.035,.13],[.08,-.08,.035,.13]])
      box(root,ledM,[w,h,.02],[-.62+dx,dy,.15],.004);
    box(root,m.dark,[.42,.56,.3],[-1.12,0,0],.03);
    box(root,m.status,[.3,.4,.02],[-1.12,.02,.17],.01);
    for(let n=0;n<7;n++) box(root,brassM,[.02,.05,.02],[-1.3,-.2+n*.055,.16],.004);
    box(root,m.ceramic,[.34,.5,.28],[-1.58,0,0],.03);
    box(root,m.lens,[.24,.38,.02],[-1.58,0,.16],.01);

    // crank and its chain, the only thing a visitor actually touches
    const sprocket=cyl(root,titanium,.3,.07,[1.78,0,0]);sprocket.rotation.z=Math.PI/2;
    for(let n=0;n<18;n++){const a=n/18*Math.PI*2;box(root,titanium,[.06,.05,.05],[1.78,Math.sin(a)*.33,Math.cos(a)*.33],.008);}
    rodBetween(root,m.dark,[1.82,0,0],[1.82,-.46,0],.035,10);
    rodBetween(root,m.ceramic,[1.82,-.46,0],[1.82,-.46,.36],.05,12);
    for(const z of [-.36,.36]) rodBetween(root,m.dark,[1.72,.3,z*.08],[1.72,-.62,z*.08],.018,8);

    root.rotation.set(.16,-.52,.03);
  }
  // Fit each object by its real bounds, preserving an authored three-quarter pose.
  root.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(root), center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3());
  const wrapper=new T.Group();root.position.sub(center);wrapper.add(root);
  return {wrapper,root,moving,size,base:root.rotation.clone(),extras};
}

/** One shared GPU context for all six card views. Scissors only visible art regions. */
export default function ProjectGallery() {
  const mount=useRef(null);
  useEffect(()=>{
    const host=mount.current;let renderer;
    try{renderer=new T.WebGLRenderer({antialias:false,alpha:true,powerPreference:'default'});}catch{return;}
    renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.autoClear=false;host.appendChild(renderer.domElement);
    const nodes=[...document.querySelectorAll('[data-project-model]')];
    const views=nodes.map((el,i)=>({el,index:i,visible:false,model:null,hover:0,x:0,y:0}));
    // The original gallery made a 512px noise texture for every card. That
    // work is identical for all models, but it was happening seven times on
    // the main thread as the page scrolled. Share it; only the two properties
    // that are deliberately different per model need lightweight clones.
    const sharedMaterials=makeGalleryMaterials();
    const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{const v=views.find(v=>v.el===e.target);if(!v)return;v.visible=e.isIntersecting;if(e.isIntersecting&&!v.model)init(v);});},{rootMargin:'500px'});nodes.forEach(n=>observer.observe(n));
    function init(v){
      if(v.model)return;
      const tint=PALETTE[v.index%PALETTE.length];
      const m={...sharedMaterials,status:sharedMaterials.status.clone(),glass:sharedMaterials.glass.clone()};m.status.color.set(tint);m.status.emissive.set(tint);m.status.emissiveIntensity=1.4;
      v.materials=m;v.scene=new T.Scene();v.scene.add(new T.HemisphereLight('#b4ccff','#120d24',.7));
      const key=new T.DirectionalLight('#fff4e8',2);key.position.set(-3,5,5);v.scene.add(key);const rim=new T.DirectionalLight(tint,3.8);rim.position.set(3,1,-3);v.scene.add(rim);
      v.model=makeModel(v.index,m);v.scene.add(v.model.wrapper);v.camera=new T.PerspectiveCamera(33,1,.1,40);
    }
    let width=1,height=1,raf=0,last=0,time=0;const pointer={x:-999,y:-999},reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
    const resize=()=>{width=window.innerWidth;height=window.innerHeight;renderer.setSize(width,height);};resize();window.addEventListener('resize',resize);
    // The gallery mounts shortly after the hero opens. A visitor can already be
    // scrolling by then, so an idle callback alone is not a sufficient guard:
    // short gaps between wheel events still count as idle. Require a real quiet
    // period before any geometry or shader warm-up begins.
    let lastScroll=performance.now();
    const noteScroll=()=>{lastScroll=performance.now();};
    window.addEventListener('scroll',noteScroll,{passive:true});

    // Build one model at a time in idle slices. Shader compilation used to call
    // renderer.compile() synchronously here; on integrated graphics that can
    // monopolise the main thread for seconds while the visitor is scrolling.
    // compileAsync uses parallel shader compilation where the browser supports
    // it and never turns model warm-up into a page-scroll stall.
    let warmHandle=0,warmIndex=0,warmDone=false;
    const idle=window.requestIdleCallback||(cb=>window.setTimeout(()=>cb({didTimeout:false,timeRemaining:()=>16}),220));
    const cancelIdle=window.cancelIdleCallback||clearTimeout;
    const warm=async(deadline)=>{
      if(warmDone)return;
      if(document.hidden||performance.now()-lastScroll<800||(!deadline.didTimeout&&deadline.timeRemaining()<10)){warmHandle=idle(warm);return;}
      while(warmIndex<views.length&&views[warmIndex].model)warmIndex++;
      if(warmIndex>=views.length){warmDone=true;return;}
      const v=views[warmIndex++];
      init(v);
      v.camera.aspect=1;v.camera.position.set(0,0,Math.max(v.model.size.y,v.model.size.x)*1.9+v.model.size.z*.45);v.camera.updateProjectionMatrix();
      try{if(renderer.compileAsync)await renderer.compileAsync(v.scene,v.camera);}catch{}
      warmHandle=idle(warm);
    };
    warmHandle=idle(warm);
    const move=e=>{pointer.x=e.clientX;pointer.y=e.clientY;};window.addEventListener('pointermove',move,{passive:true});
    let drewLastFrame=false;
    const render=now=>{
      raf=requestAnimationFrame(render);if(now-last<32||document.hidden)return;const dt=Math.min((now-last)/1000,.05);last=now;if(!reduced.matches)time+=dt;
      const hasVisibleModel=views.some(v=>v.visible&&v.model);
      // Do not clear a full-screen WebGL buffer thirty times per second while
      // every project card is off-screen. Clear once after leaving the section,
      // then let this renderer sleep until a model view is visible again.
      if(!hasVisibleModel){
        if(drewLastFrame){renderer.setScissorTest(false);renderer.setClearColor(0x000000,0);renderer.clear();drewLastFrame=false;}
        return;
      }
      drewLastFrame=true;
      renderer.setScissorTest(false);renderer.setClearColor(0x000000,0);renderer.clear();renderer.setScissorTest(true);
      for(const v of views){
        if(!v.visible||!v.model)continue;const r=v.el.getBoundingClientRect();if(r.bottom<0||r.top>height||r.width<2||r.height<2)continue;
        const inside=pointer.x>r.left&&pointer.x<r.right&&pointer.y>r.top&&pointer.y<r.bottom;
        const k=1-Math.exp(-dt*5);v.hover=T.MathUtils.lerp(v.hover,inside&&!reduced.matches?1:0,k);v.x=T.MathUtils.lerp(v.x,inside?(pointer.x-r.left)/r.width-.5:0,k);v.y=T.MathUtils.lerp(v.y,inside?(pointer.y-r.top)/r.height-.5:0,k);
        const {root,moving,size,base}=v.model;
        if(!reduced.matches){root.rotation.y=base.y+v.x*.55+Math.sin(time*.18+v.index)*.06;root.rotation.x=base.x+v.y*.22;v.model.wrapper.position.y=Math.sin(time*.6+v.index)*.025;}
        moving.forEach(({o,y,d})=>o.position.y=y+d*v.hover);
        const aspect=r.width/r.height;v.camera.aspect=aspect;v.camera.position.set(0,0,Math.max(size.y,size.x/aspect)*1.9+size.z*.45);v.camera.lookAt(0,0,0);v.camera.updateProjectionMatrix();
        const left=Math.max(0,r.left),bottom=Math.max(0,height-r.bottom),right=Math.min(width,r.right),top=Math.min(height,height-r.top);
        renderer.setViewport(r.left,height-r.bottom,r.width,r.height);renderer.setScissor(left,bottom,Math.max(0,right-left),Math.max(0,top-bottom));renderer.render(v.scene,v.camera);
      }
    };raf=requestAnimationFrame(render);
    return()=>{cancelAnimationFrame(raf);warmDone=true;cancelIdle(warmHandle);observer.disconnect();window.removeEventListener('resize',resize);window.removeEventListener('scroll',noteScroll);window.removeEventListener('pointermove',move);const geometries=new Set(),mats=new Set(),textures=new Set();Object.values(sharedMaterials).forEach(m=>mats.add(m));views.forEach(v=>{v.scene?.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)mats.add(o.material);});Object.values(v.materials||{}).forEach(m=>mats.add(m));v.model?.extras.forEach(m=>mats.add(m));});mats.forEach(m=>{Object.values(m).forEach(x=>{if(x?.isTexture)textures.add(x);});m.dispose();});geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());renderer.dispose();renderer.domElement.remove();};
  },[]);
  return <div ref={mount} className="project-gallery-canvas" aria-hidden="true" />;
}

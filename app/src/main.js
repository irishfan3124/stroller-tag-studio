import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {SVGLoader} from 'three/addons/loaders/SVGLoader.js';
import Module from 'manifold-3d';
import {generate,parseFont,defaults} from './geometry.js';
import {stl,threeMF} from './export.js';
const $=id=>document.getElementById(id);
let model,reference,manifold,custom=null,timer,ready=false;
const fonts={},scene=new THREE.Scene(),group=new THREE.Group();scene.add(group);
const viewport=$('viewport'),camera=new THREE.PerspectiveCamera(34,1,.1,5000);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;viewport.prepend(renderer.domElement);renderer.domElement.setAttribute('aria-label','Interactive 3D preview of your family stroller tag');renderer.domElement.setAttribute('role','img');
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
scene.add(new THREE.HemisphereLight(0xffffff,0x687786,1.6));const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(-80,120,300);scene.add(light);const fill=new THREE.DirectionalLight(0xffffff,.6);fill.position.set(150,-50,100);scene.add(fill);
const orbit=new OrbitControls(camera,renderer.domElement);orbit.enableDamping=true;orbit.enablePan=false;orbit.minDistance=130;orbit.maxDistance=1200;orbit.maxPolarAngle=Math.PI;camera.up.set(0,1,0);
function frame(top=false){const w=Number($('width').value)||defaults.width,h=Number($('height').value)||defaults.height;const d=Math.max(w/(2*Math.tan(THREE.MathUtils.degToRad(17))*camera.aspect),h/(2*Math.tan(THREE.MathUtils.degToRad(17))))*1.3;orbit.target.set(0,0,0);camera.position.set(0,top?0:-d*.38,top?d:d*.94);camera.lookAt(0,0,0);orbit.update();}
function resize(){const r=viewport.getBoundingClientRect();renderer.setSize(r.width,r.height);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();frame($('view-top').classList.contains('active'));}new ResizeObserver(resize).observe(viewport);
renderer.setAnimationLoop(()=>{orbit.update();renderer.render(scene,camera);});
function state(){return {name:$('name').value.trim(),font:$('font').value,width:+$('width').value,height:+$('height').value,base:+$('base').value,relief:+$('relief').value,pattern:$('pattern').value,cutSize:+$('cut-size').value,count:+$('count').value,slots:$('slots').checked,baseColor:$('base-color').value,accentColor:$('accent-color').value,letterColor:$('letter-color').value};}
function showStatus(s,error=false){$('status').textContent=s;$('status').style.color=error?'#b42f4c':'#647780';}
function setEnabled(value){$('download').disabled=$('stl').disabled=!value;}
function schedule(){setEnabled(false);clearTimeout(timer);timer=setTimeout(update,170);}
function update(){
 if(!ready)return;
 const s=state();$('name-count').textContent=`${$('name').value.length} / 18`;$('custom-wrap').hidden=s.pattern!=='custom';
 const configurable=!['original','none'].includes(s.pattern);$('cut-size').disabled=$('count').disabled=!configurable;$('pattern-hint').textContent=s.pattern==='original'?'Three original sparkles on each ear.':s.pattern==='none'?'A solid silhouette, with optional strap slots.':'Cutouts are mirrored across both ears.';
 $('font-hint').textContent=s.font==='original'?'Original lettering from your model. New names use Caveat.':'Lettering automatically fits the available space.';
 if(!$('controls').checkValidity()){showStatus('Enter values within the allowed ranges to update your tag.',true);return;}
 if(!s.name){showStatus('Add your family name to continue.',true);return;}
 if(!/^[\p{L}\p{M}\p{N} '\-]+$/u.test(s.name)){showStatus('Use letters, numbers, spaces, apostrophes, or hyphens for your name.',true);return;}
 try{
  const next=generate(manifold,reference,s,fonts[s.font==='original'?'Caveat':s.font],custom);
  while(group.children.length){const child=group.children[0];group.remove(child);child.geometry.dispose();child.material.dispose();}
  model?.dispose();model=next;
  for(const part of model.parts){const m=part.mesh,g=new THREE.BufferGeometry();const positions=new Float32Array(m.vertProperties.length/m.numProp*3);for(let i=0;i<positions.length/3;i++)positions.set(m.vertProperties.subarray(i*m.numProp,i*m.numProp+3),i*3);g.setAttribute('position',new THREE.BufferAttribute(positions,3));g.setIndex(new THREE.BufferAttribute(m.triVerts,1));g.computeVertexNormals();const mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:part.color,roughness:.65,metalness:0,flatShading:true}));group.add(mesh);}
  $('preview-title').textContent=`The ${s.name.toLowerCase().replace(/(^|[ '\-])\p{L}/gu,c=>c.toUpperCase())} family`;
  $('read-width').innerHTML=`${s.width.toFixed(2)} <small>mm</small>`;$('read-height').innerHTML=`${s.height.toFixed(2)} <small>mm</small>`;$('read-depth').innerHTML=`${(s.base+2*s.relief).toFixed(2)} <small>mm</small>`;
  $('size-badge').textContent=Math.abs(s.width-reference.width)<.01&&Math.abs(s.height-reference.height)<.01?'Original model size':'Custom size';
  showStatus(s.name.length>10?'Your tag is ready. Long names create smaller lettering; check the sliced preview.':s.width>256?'Your tag is ready. Rotate it on the build plate or reduce its size to fit your printer.':'Your tag is ready to download. Check the sliced preview before printing.');setEnabled(true);
 }catch(e){showStatus(e.message||'The design could not be generated. Try adjusting the inputs.',true);setEnabled(false);}
}
$('controls').addEventListener('submit',e=>e.preventDefault());$('controls').addEventListener('input',e=>{if(e.target.id==='width'&&$('lock').checked)$('height').value=(+$('width').value*defaults.height/defaults.width).toFixed(2);if(e.target.id==='height'&&$('lock').checked)$('width').value=(+$('height').value*defaults.width/defaults.height).toFixed(2);schedule();});
$('controls').addEventListener('change',schedule);
function originalSize(){$('width').value=defaults.width.toFixed(2);$('height').value=defaults.height.toFixed(2);$('base').value=defaults.base.toFixed(2);$('relief').value=defaults.relief.toFixed(2);schedule();frame();}
$('original-size').onclick=originalSize;
$('reset').onclick=()=>{$('controls').reset();custom=null;originalSize();view(false);};
function view(top){$('view-top').classList.toggle('active',top);$('view-3d').classList.toggle('active',!top);$('view-top').setAttribute('aria-pressed',String(top));$('view-3d').setAttribute('aria-pressed',String(!top));frame(top);}
$('view-top').onclick=()=>view(true);$('view-3d').onclick=()=>view(false);
$('custom-svg').onchange=async e=>{
 setEnabled(false);custom=null;const file=e.target.files[0];if(!file)return;
 try{if(file.size>100000)throw new Error('Use an SVG smaller than 100 KB.');const text=await file.text();const doc=new DOMParser().parseFromString(text,'image/svg+xml');if(doc.querySelector('parsererror'))throw new Error('This SVG could not be read.');if(doc.querySelector('script,foreignObject,image,use,style,text')||[...doc.querySelectorAll('*')].some(n=>[...n.attributes].some(a=>!a.name.startsWith('xmlns')&&(/^on/i.test(a.name)||/url\(|https?:|data:/i.test(a.value)))))throw new Error('Use a plain SVG with filled paths or shapes, without text, images, scripts, or linked content.');
 const data=new SVGLoader().parse(text),rings=[];for(const path of data.paths){if(path.userData?.style?.fill==='none')continue;for(const shape of SVGLoader.createShapes(path)){rings.push(shape.getPoints(12).map(p=>[p.x,-p.y]));for(const hole of shape.holes)rings.push(hole.getPoints(12).map(p=>[p.x,-p.y]));}}
 const points=rings.flat();if(!points.length||points.length>10000)throw new Error('Use a simpler SVG containing filled shapes (under 10,000 points).');const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),scale=Math.max(maxX-minX,maxY-minY)/2;if(!Number.isFinite(scale)||scale<=0)throw new Error('The SVG has no usable area.');custom=rings.map(r=>r.map(([x,y])=>[(x-(minX+maxX)/2)/scale,(y-(minY+maxY)/2)/scale]));update();
 }catch(e){showStatus(e.message,true);setEnabled(false);}
};
async function download(format){if(!model)return;setEnabled(false);showStatus('Preparing your print file…');await new Promise(r=>setTimeout(r,30));try{const s=state();const data=format==='3mf'?threeMF(model.parts,s.name):stl(model.merged());const blob=new Blob([data],{type:format==='3mf'?'model/3mf':'model/stl'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${s.name.replace(/[^\p{L}\p{N}-]/gu,'-')}-family-tag.${format}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);showStatus(`${format.toUpperCase()} downloaded. Open it in your slicer and choose your print settings.`);}catch(e){showStatus(e.message,true);}finally{setEnabled(true);}}
$('download').onclick=()=>download('3mf');$('stl').onclick=()=>download('stl');
try{
 const results=await Promise.all([fetch('./reference.json').then(r=>r.json()),Module({locateFile:p=>new URL('./'+p,document.baseURI).href}),...['Caveat','Fredoka','BreeSerif'].map(async name=>{const r=await fetch(`./fonts/${name}.ttf`);if(!r.ok)throw new Error('A font could not load. Reload the page to try again.');fonts[name]=parseFont(await r.arrayBuffer());})]);
 reference=results[0];manifold=results[1];manifold.setup();ready=true;$('loading').hidden=true;update();resize();
}catch(e){$('loading').textContent='Could not load the designer. Please reload to try again.';showStatus(e.message,true);}

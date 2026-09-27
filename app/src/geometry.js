import opentype from 'opentype.js';
import { ShapePath } from 'three';

export const defaults={name:'Smith',font:'Caveat',width:315.76364232,height:131.48026624,base:5.49980013,relief:2.749900065,pattern:'original',cutSize:100,count:3,slots:true,baseColor:'#ded0a3',accentColor:'#f35476',letterColor:'#fff0ce'};
export function parseFont(buffer){return opentype.parse(buffer);}
export function inside(p,ring){let c=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if(((a[1]>p[1])!==(b[1]>p[1]))&&(p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0]))c=!c;}return c;}
function faces(polys){return polys.filter(p=>!polys.some(q=>q!==p&&q.holes.some(h=>inside(p.center,h))));}
function fontRings(font,text){
 const path=font.getPath(text,0,0,100), shape=new ShapePath();
 for(const c of path.commands){if(c.type==='M')shape.moveTo(c.x,-c.y);if(c.type==='L')shape.lineTo(c.x,-c.y);if(c.type==='Q')shape.quadraticCurveTo(c.x1,-c.y1,c.x,-c.y);if(c.type==='C')shape.bezierCurveTo(c.x1,-c.y1,c.x2,-c.y2,c.x,-c.y);if(c.type==='Z')shape.currentPath.closePath();}
 return shape.subPaths.map(p=>p.getPoints(12).map(v=>[v.x,v.y]));
}
export function generate(M,ref,s,font,custom){
 const held=[],keep=o=>(held.push(o),o),C=M.CrossSection;
 const cross=r=>keep(new C(r,'EvenOdd')), transformed=(cs)=>keep(cs.scale([s.width/ref.width,s.height/ref.height]));
 const parts=[];let smallest=Infinity;
 function add(cs,z,height,color,name){const scaled=transformed(cs);const solid=keep(scaled.extrude(height));const moved=keep(solid.translate([0,0,z]));parts.push({solid:moved,color,name});}
 function refCS(p){return cross([p.outer,...p.holes]);}
 try{
 const original=ref.layers.base.find(p=>p.area>1000);
 let base=cross([original.outer]);
 const slots=original.holes.filter(h=>Math.max(...h.map(p=>p[1]))>50);
 const stars=original.holes.filter(h=>Math.max(...h.map(p=>p[1]))<=50);
 let cuts=[];
 if(s.slots)cuts.push(...slots);
 if(s.pattern==='original')cuts.push(...stars);
 else if(s.pattern!=='none'){
  for(const side of [-1,1]){
   const positions=s.count===1?[[side*119,20,1]]:s.count===2?[[side*112,29,.8],[side*125,10,1]]:[[side*115,30,.8],[side*132,23,.62],[side*121,10,1]];
   for(const [x,y,mul] of positions){
    const r=10*s.cutSize/100*mul;smallest=Math.min(smallest,r*2*s.width/ref.width);
    let rings=[];
    if(s.pattern==='custom'){if(!custom)throw new Error('Choose a silhouette SVG to use custom cutouts.');rings=custom.map(ring=>ring.map(([a,b])=>[a*r+x,b*r+y]));}
    else{
     const ring=[];const n=s.pattern==='circle'?48:s.pattern==='heart'?64:s.pattern==='star'?10:s.pattern==='sparkle'?64:4;
     for(let i=0;i<n;i++){
      let a=2*Math.PI*i/n,px,py;
      if(s.pattern==='heart'){px=Math.pow(Math.sin(a),3);py=(13*Math.cos(a)-5*Math.cos(2*a)-2*Math.cos(3*a)-Math.cos(4*a))/16;}
      else if(s.pattern==='sparkle'){px=Math.pow(Math.cos(a),3);py=Math.pow(Math.sin(a),3);}
      else{a+=Math.PI/2;const radius=s.pattern==='star'?(i%2?.44:1):1;px=Math.cos(a)*radius;py=Math.sin(a)*radius;}
      ring.push([x+px*r,y+py*r]);
     }rings=[ring];
    }cuts.push(...rings);
   }
  }
 }
 if(cuts.length)base=keep(base.subtract(cross(cuts)));
 const basePieces=base.decompose();const connected=basePieces.length===1;basePieces.forEach(p=>p.delete());
 if(!connected)throw new Error('This cutout leaves loose islands in the tag. Use a solid silhouette or reduce the cutout size.');
 add(base,0,s.base,s.baseColor,'Base and strap slots');
 const originalName=s.font==='original'&&s.name.toUpperCase()==='CRALL';
 const tilePolys=faces(ref.layers.tiles).filter(p=>p.area>500);
 if(originalName){
  tilePolys.sort((a,b)=>a.center[0]-b.center[0]).forEach((p,i)=>add(refCS(p),s.base,s.relief,i%2?s.letterColor:s.accentColor,'Letter tile '+(i+1)));
  for(const p of faces(ref.layers.letters))add(refCS(p),s.base+s.relief,s.relief,s.baseColor,'Original letter');
 }else{
  const chars=[...s.name.toUpperCase()];
  if(chars.some(c=>c!==' '&&font.charToGlyphIndex(c)===0))throw new Error('This font does not contain every character in your name. Try another font.');
  const gap=2.4,fullWidth=147,tileW=Math.min(30,(fullWidth-gap*(chars.length-1))/chars.length),tileH=35,total=chars.length*(tileW+gap)-gap;
  chars.forEach((ch,i)=>{
   const x=-total/2+i*(tileW+gap)+tileW/2,y=-25;
   if(ch===' ')return;
   const tile=keep(C.square([tileW,tileH],true));add(keep(tile.translate([x,y])),s.base,s.relief,i%2?s.letterColor:s.accentColor,'Letter tile '+(i+1));
   let rings=fontRings(font,ch);const points=rings.flat();if(!points.length)return;
   const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
   const scale=Math.min((tileW-3)/(maxX-minX),(tileH-5)/(maxY-minY));smallest=Math.min(smallest,(maxX-minX)*scale*s.width/ref.width);
   rings=rings.map(r=>r.map(([a,b])=>[(a-(minX+maxX)/2)*scale+x,(b-(minY+maxY)/2)*scale+y]));
   add(cross(rings),s.base+s.relief,s.relief,s.baseColor,'Letter '+ch);
  });
 }
 for(const p of faces(ref.layers.tiles).filter(p=>p.area<500))add(refCS(p),s.base,s.relief,s.accentColor,'The / Family');
 const meshes=parts.map(p=>({mesh:p.solid.getMesh(),color:p.color,name:p.name}));
 let merged=null;
 return {parts:meshes,smallest,merged(){if(!merged)merged=keep(M.Manifold.union(parts.map(p=>p.solid)));if(merged.status()!=='NoError')throw new Error('Could not create a closed print mesh. Adjust the design and try again.');return merged.getMesh();},status(){const mesh=this.merged();return {triangles:mesh.triVerts.length/3,bounds:merged.boundingBox(),volume:merged.volume(),components:merged.decompose().map(x=>{const v=x.volume();x.delete();return v;})};},dispose(){for(const o of held.reverse())o.delete();}};
 }catch(e){for(const o of held.reverse())o.delete();throw e;}
}

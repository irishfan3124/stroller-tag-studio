import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import Module from 'manifold-3d';
import {generate,parseFont,defaults} from '../src/geometry.js';
import {stl,threeMF} from '../src/export.js';
import {unzipSync,strFromU8} from 'fflate';
const M=await Module();M.setup();
const ref=JSON.parse(readFileSync('dist/reference.json','utf8'));
const fonts={};for(const n of ['Caveat','Fredoka','BreeSerif']){const b=readFileSync('dist/fonts/'+n+'.ttf');fonts[n]=parseFont(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));}
mkdirSync('test-output',{recursive:true});
const cases=[{}, {name:'CRALL',font:'original'}, {name:'ANDERSON',font:'Fredoka',pattern:'star',width:220,height:ref.height*220/ref.width,base:2,relief:.8},{name:"O'NEILL",font:'BreeSerif',pattern:'heart'},{name:'Élodie',font:'Caveat',pattern:'circle'},{name:'ABCDEFGHIJKLMNOPQR',font:'Fredoka',width:100,height:50,base:1.2,relief:.4,pattern:'none'},...['sparkle','diamond','custom'].map(pattern=>({pattern,cutSize:135,count:3})),{slots:false,pattern:'none'}];
for(let i=0;i<cases.length;i++){
 const s={...defaults,...cases[i]};const model=generate(M,ref,s,fonts[s.font==='original'?'Caveat':s.font],[[[-1,0],[0,1],[1,0],[0,-1]]]);
 const stats=model.status();assert(stats.volume>0);assert.equal(stats.components.length,1,'The tag must be one connected solid');assert(Math.abs(stats.bounds.max[0]-stats.bounds.min[0]-s.width)<.01);assert(Math.abs(stats.bounds.max[1]-stats.bounds.min[1]-s.height)<.01);assert(Math.abs(stats.bounds.max[2]-s.base-2*s.relief)<.01);assert(Math.abs(stats.bounds.min[2])<.001);
 const mesh=model.merged();const edges=new Map();for(let j=0;j<mesh.triVerts.length;j+=3)for(const [a,b] of [[0,1],[1,2],[2,0]]){const v=mesh.triVerts[j+a],w=mesh.triVerts[j+b],key=[Math.min(v,w),Math.max(v,w)].join(',');edges.set(key,(edges.get(key)||0)+1);}assert([...edges.values()].every(n=>n===2),'Every solid edge must belong to two faces');
 const binary=stl(mesh);assert.equal(binary.byteLength,84+50*stats.triangles);
 const archive=threeMF(model.parts,s.name),files=unzipSync(archive);assert(files['3D/3dmodel.model']);assert(strFromU8(files['3D/3dmodel.model']).includes('unit="millimeter"'));
 if(i===0){writeFileSync('test-output/Smith-family-tag.stl',binary);writeFileSync('test-output/Smith-family-tag.3mf',archive);}
 console.log(`PASS ${i+1}: ${s.name}, ${s.pattern}: ${stats.triangles} triangles, one watertight solid`);model.dispose();
}

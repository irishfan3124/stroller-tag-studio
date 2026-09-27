import {zipSync,strToU8} from 'fflate';
const xmlEscape=s=>s.replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
export function stl(mesh){
 const n=mesh.triVerts.length/3,buffer=new ArrayBuffer(84+50*n),v=new DataView(buffer);v.setUint32(80,n,true);
 for(let i=0;i<n;i++){
  const ps=[0,1,2].map(j=>{const a=mesh.triVerts[i*3+j]*mesh.numProp;return Array.from(mesh.vertProperties.slice(a,a+3));});
  const a=ps[1].map((x,j)=>x-ps[0][j]),b=ps[2].map((x,j)=>x-ps[0][j]);let normal=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],l=Math.hypot(...normal);normal=normal.map(x=>x/(l||1));
  [...normal,...ps.flat()].forEach((x,j)=>v.setFloat32(84+50*i+4*j,x,true));
 }return new Uint8Array(buffer);
}
export function threeMF(parts,name){
 const colors=[...new Set(parts.map(p=>p.color))];let objects='';
 parts.forEach((p,i)=>{const m=p.mesh,vertices=[],triangles=[];
  for(let j=0;j<m.vertProperties.length;j+=m.numProp)vertices.push(`<vertex x="${m.vertProperties[j]}" y="${m.vertProperties[j+1]}" z="${m.vertProperties[j+2]}"/>`);
  for(let j=0;j<m.triVerts.length;j+=3)triangles.push(`<triangle v1="${m.triVerts[j]}" v2="${m.triVerts[j+1]}" v3="${m.triVerts[j+2]}"/>`);
  objects+=`<object id="${i+2}" type="model" name="${xmlEscape(p.name)}" pid="1" pindex="${colors.indexOf(p.color)}"><mesh><vertices>${vertices.join('')}</vertices><triangles>${triangles.join('')}</triangles></mesh></object>`;
 });
 const assembly=parts.length+2;
 const model=`<?xml version="1.0" encoding="UTF-8"?><model unit="millimeter" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><metadata name="Title">${xmlEscape(name)} family stroller tag</metadata><resources><basematerials id="1">${colors.map((c,i)=>`<base name="Color ${i+1}" displaycolor="${c.toUpperCase()}FF"/>`).join('')}</basematerials>${objects}<object id="${assembly}" type="model" name="${xmlEscape(name)} family tag"><components>${parts.map((_,i)=>`<component objectid="${i+2}"/>`).join('')}</components></object></resources><build><item objectid="${assembly}"/></build></model>`;
 return zipSync({'[Content_Types].xml':strToU8('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>'),'_rels/.rels':strToU8('<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>'),'3D/3dmodel.model':strToU8(model)},{level:6});
}

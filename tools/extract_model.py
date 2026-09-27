import zipfile, xml.etree.ElementTree as E, json, sys
from pathlib import Path
import numpy as np
from shapely.geometry import LineString
from shapely.ops import polygonize, unary_union

if len(sys.argv) != 2: raise SystemExit('Usage: python tools/extract_model.py path/to/reference.3mf')
source=Path(sys.argv[1])
out=Path(__file__).resolve().parents[1]/'app'/'dist'
out.mkdir(exist_ok=True)
z=zipfile.ZipFile(source)
r=E.fromstring(z.read('3D/Objects/object_1.model'))
ns={'m':'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'}
scale=2.1652756753946427
v=np.array([[float(e.get(a)) for a in ['x','y','z']] for e in r.findall('.//m:vertex',ns)])*scale
t=np.array([[int(e.get(a)) for a in ['v1','v2','v3']] for e in r.findall('.//m:triangle',ns)])
def section(height):
 lines=[]
 for f in v[t]:
  pts=[]
  for i,j in [(0,1),(1,2),(2,0)]:
   a,b=f[i],f[j]
   if (a[2]<height)!=(b[2]<height):
    p=a+(b-a)*(height-a[2])/(b[2]-a[2]);pts.append(tuple(np.round(p[:2],5)))
  if len(pts)==2 and pts[0]!=pts[1]:lines.append(LineString(pts))
 # Polygonization includes holes as separate faces. Select faces using nesting parity.
 polygons=list(polygonize(unary_union(lines)))
 return polygons
layers={}
for name,h in [('base',-4),('tiles',1),('letters',4)]:
 ps=section(h)
 layers[name]=[{'outer':list(p.exterior.coords)[:-1],'holes':[list(i.coords)[:-1] for i in p.interiors],'area':p.area,'center':list(p.centroid.coords)[0]} for p in ps]
 print(name,[(round(p.area,2),tuple(round(x,2) for x in p.centroid.coords[0]),len(p.interiors)) for p in ps])
data={'source':source.name,'width':float(np.ptp(v[:,0])),'height':float(np.ptp(v[:,1])),'baseThickness':5.49980013,'reliefThickness':2.749900065,'totalThickness':float(np.ptp(v[:,2])),'layers':layers}
(out/'reference.json').write_text(json.dumps(data,separators=(',',':')))
paths=[]
for p in layers['base']:
 if p['area']>1000:
  for ring in [p['outer']]+p['holes']:
   paths.append('M'+' L'.join(f'{x:.3f},{-y:.3f}' for x,y in ring)+'Z')
(out/'reference.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-165 -75 330 150"><path fill="#dccca2" fill-rule="evenodd" d="'+' '.join(paths)+'"/></svg>')

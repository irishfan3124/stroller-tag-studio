import { build } from 'esbuild';
import { copyFileSync, cpSync, mkdirSync, writeFileSync } from 'node:fs';
await build({entryPoints:['src/main.js'],bundle:true,format:'esm',outfile:'dist/app.js',minify:true,platform:'browser',external:['node:*']});
copyFileSync('node_modules/manifold-3d/manifold.wasm','dist/manifold.wasm');
mkdirSync('../docs',{recursive:true});
cpSync('dist','../docs',{recursive:true});
writeFileSync('../docs/.nojekyll','');

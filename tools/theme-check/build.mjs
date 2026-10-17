// Builds Shopify's own theme checker (github.com/Shopify/theme-tools: @shopify/theme-check-node, the engine behind
// `shopify theme check`) without npm: the npm registry is blocked here, GitHub is not. Clones theme-tools and its few
// runtime dependencies into $SCRATCH/vendor, transpiles their TypeScript to CommonJS with the global typescript and wires
// a node_modules tree (small shims for lodash/minimatch/glob/fetch helpers). Theme-liquid-docs (objects, filters, tags,
// JSON schemas) is served from the local clone instead of raw.githubusercontent.com. Output: $SCRATCH/vendor/tc-build.
// Usage: node tools/theme-check/build.mjs   (tools/theme-check.sh calls it when the build is missing)
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const ts = require(path.join(execSync('npm root -g').toString().trim(), 'typescript'));

const SCRATCH = process.env.SCRATCH || '/tmp/claude-0/-home-user-Larsaikema/d03b1b71-234c-55f6-a22b-89a9ff74abc4/scratchpad';
const VENDOR = `${SCRATCH}/vendor`;
const TT = `${VENDOR}/theme-tools/packages`;
const D = `${VENDOR}/tc-deps`;
const OUT = `${VENDOR}/tc-build`;
const NM = `${OUT}/node_modules`;

// sources (all MIT / Apache-2.0); shallow clones of the default branch, commit ids are written to $OUT/SOURCES.txt
const REPOS = [
  ['Shopify/theme-tools', `${VENDOR}/theme-tools`],
  ['Shopify/theme-liquid-docs', `${D}/theme-liquid-docs`],
  ['microsoft/vscode-uri', `${D}/vscode-uri`],
  ['microsoft/node-jsonc-parser', `${D}/node-jsonc-parser`],
  ['microsoft/vscode-json-languageservice', `${D}/vscode-json-languageservice`],
  ['microsoft/vscode-languageserver-node', `${D}/vscode-languageserver-node`],
  ['microsoft/vscode-l10n', `${D}/vscode-l10n`],
  ['acornjs/acorn', `${D}/acorn`],
  ['postcss/postcss', `${D}/postcss`],
  ['postcss/postcss-safe-parser', `${D}/postcss-safe-parser`],
  ['postcss/postcss-selector-parser', `${D}/postcss-selector-parser`],
  ['eemeli/yaml', `${D}/yaml`],
];
fs.mkdirSync(D, { recursive: true });
const sources = [];
for (const [repo, dir] of REPOS) {
  if (!fs.existsSync(dir)) {
    console.log(`cloning ${repo}`);
    execSync(`git clone --depth 1 -q https://github.com/${repo}.git ${JSON.stringify(dir)}`, { stdio: 'inherit' });
  }
  sources.push(`${repo} ${execSync(`git -C ${JSON.stringify(dir)} rev-parse HEAD`).toString().trim()}`);
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(NM, { recursive: true });

const opts = {
  module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.ES2022,
  esModuleInterop: true,
  allowJs: true,
  experimentalDecorators: true,
  useDefineForClassFields: false,
  resolveJsonModule: true,
  rewriteRelativeImportExtensions: true,
};

function transpileDir(src, dst, { skip = /\.(spec|test)\.ts$|\/(test|tests|__tests__|fixtures)\//, js = false } = {}) {
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dst, ent.name);
    if (skip.test(s + (ent.isDirectory() ? '/' : ''))) continue;
    if (ent.isDirectory()) {
      transpileDir(s, d, { skip, js });
      continue;
    }
    fs.mkdirSync(dst, { recursive: true });
    if (ent.name.endsWith('.d.ts')) continue;
    if (ent.name.endsWith('.ts') || (js && ent.name.endsWith('.js'))) {
      const code = fs.readFileSync(s, 'utf8');
      const out = ts.transpileModule(code, { compilerOptions: opts, fileName: s }).outputText.replace(/require\("(\.{1,2}\/[^"]+)\.ts"\)/g, 'require("$1.js")');
      fs.writeFileSync(d.replace(/\.ts$/, '.js'), out);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

function pkg(name, main, extra = {}) {
  const dir = path.join(NM, name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name, version: '0.0.0-local', main, ...extra }, null, 1));
  return dir;
}

function shim(name, code, file = 'index.js') {
  const dir = pkg(name, file);
  fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  fs.writeFileSync(path.join(dir, file), code);
  return dir;
}

// ---- Shopify packages
for (const [name, dir] of [
  ['@shopify/liquid-html-parser', 'liquid-html-parser'],
  ['@shopify/theme-check-common', 'theme-check-common'],
  ['@shopify/theme-check-node', 'theme-check-node'],
  ['@shopify/theme-check-docs-updater', 'theme-check-docs-updater'],
  ['@shopify/theme-graph', 'theme-graph'],
]) {
  const p = pkg(name, 'dist/index.js');
  transpileDir(`${TT}/${dir}/src`, `${p}/dist`);
  for (const extra of ['configs', 'data', 'scripts']) {
    if (fs.existsSync(`${TT}/${dir}/${extra}`)) fs.cpSync(`${TT}/${dir}/${extra}`, `${p}/${extra}`, { recursive: true });
  }
  const real = JSON.parse(fs.readFileSync(`${TT}/${dir}/package.json`, 'utf8'));
  const pj = JSON.parse(fs.readFileSync(`${p}/package.json`, 'utf8'));
  pj.version = real.version;
  fs.writeFileSync(`${p}/package.json`, JSON.stringify(pj, null, 1));
}

// ---- Microsoft packages (TS)
transpileDir(`${D}/vscode-uri/src`, `${pkg('vscode-uri', 'index.js')}`);
transpileDir(`${D}/node-jsonc-parser/src`, `${pkg('jsonc-parser', 'main.js')}`);
transpileDir(`${D}/vscode-languageserver-node/textDocument/src`, `${pkg('vscode-languageserver-textdocument', 'main.js')}`);
transpileDir(`${D}/vscode-languageserver-node/types/src`, `${pkg('vscode-languageserver-types', 'main.js')}`);
transpileDir(`${D}/vscode-l10n/l10n/src`, `${pkg('@vscode/l10n', 'main.js')}`, { skip: /\/(test|browser)\// });
transpileDir(`${D}/vscode-json-languageservice/src`, `${pkg('vscode-json-languageservice', 'jsonLanguageService.js')}`);
// yaml
transpileDir(`${D}/yaml/src`, `${pkg('yaml', 'index.js')}`, { skip: /cli\.ts$|test-events/ });

// ---- acorn (ESM sources; node 22 can require() ESM)
fs.cpSync(`${D}/acorn/acorn/src`, `${NM}/acorn/src`, { recursive: true });
fs.writeFileSync(`${NM}/acorn/package.json`, JSON.stringify({ name: 'acorn', type: 'module', main: 'src/index.js', exports: { '.': './src/index.js' } }));
fs.cpSync(`${D}/acorn/acorn-walk/src`, `${NM}/acorn-walk/src`, { recursive: true });
fs.writeFileSync(`${NM}/acorn-walk/package.json`, JSON.stringify({ name: 'acorn-walk', type: 'module', main: 'src/index.js', exports: { '.': './src/index.js' } }));

// ---- postcss (CJS lib) + safe parser + selector parser
fs.cpSync(`${D}/postcss/lib`, `${NM}/postcss/lib`, { recursive: true });
fs.writeFileSync(`${NM}/postcss/package.json`, JSON.stringify({ name: 'postcss', main: 'lib/postcss.js' }));
fs.cpSync(`${D}/postcss-safe-parser/lib`, `${NM}/postcss-safe-parser/lib`, { recursive: true });
fs.writeFileSync(`${NM}/postcss-safe-parser/package.json`, JSON.stringify({ name: 'postcss-safe-parser', main: 'lib/safe-parse.js' }));
transpileDir(`${D}/postcss-selector-parser/src`, `${pkg('postcss-selector-parser', 'index.js')}`, { js: true });

// ---- shims
shim('nanoid', `exports.nanoid=(n=21)=>{let s='';for(let i=0;i<n;i++)s+='abcdefghijklmnopqrstuvwxyz0123456789'[Math.random()*36|0];return s};exports.customAlphabet=(a,n)=>()=>exports.nanoid(n);`, 'non-secure/index.js');
fs.writeFileSync(`${NM}/nanoid/package.json`, JSON.stringify({ name: 'nanoid', main: 'non-secure/index.js' }));
shim('picocolors', `const id=(s)=>String(s);const p=new Proxy({},{get:(t,k)=>k==='isColorSupported'?false:k==='createColors'?()=>p:id});module.exports=p;`);
shim('source-map-js', `class SourceMapConsumer{constructor(){}}class SourceMapGenerator{constructor(){}addMapping(){}setSourceContent(){}toString(){return '{}'}toJSON(){return {}}static fromSourceMap(){return new SourceMapGenerator()}}module.exports={SourceMapConsumer,SourceMapGenerator};`);
shim('cssesc', `module.exports=function cssesc(s){return String(s).replace(/[^a-zA-Z0-9_\\u00A0-\\uFFFF-]/g,(c)=>'\\\\'+c)};`);
shim('util-deprecate', `module.exports=(fn)=>fn;`);
shim('line-column', `
function LineColumnFinder(str){ if(!(this instanceof LineColumnFinder)) return new LineColumnFinder(str); this.str=str; this.idx=[0]; for(let i=0;i<str.length;i++){ if(str[i]==='\\n') this.idx.push(i+1);} }
LineColumnFinder.prototype.fromIndex=function(index){ if(index<0||index>=this.str.length) { if(index===this.str.length && index>=0){} else return null; } let lo=0,hi=this.idx.length-1; while(lo<hi){const mid=(lo+hi+1)>>1; if(this.idx[mid]<=index) lo=mid; else hi=mid-1;} return {line:lo+1,col:index-this.idx[lo]+1}; };
LineColumnFinder.prototype.toIndex=function(line,col){ if(typeof line==='object'){col=line.col;line=line.line;} if(line<1||line>this.idx.length) return -1; return this.idx[line-1]+col-1; };
module.exports=LineColumnFinder;`);
shim('lodash', `
const words=(s)=>String(s).replace(/([a-z0-9])([A-Z])/g,'$1 $2').split(/[^A-Za-z0-9]+/).filter(Boolean);
exports.camelCase=(s)=>words(s).map((w,i)=>i?w[0].toUpperCase()+w.slice(1).toLowerCase():w.toLowerCase()).join('');
exports.kebabCase=(s)=>words(s).map((w)=>w.toLowerCase()).join('-');
exports.snakeCase=(s)=>words(s).map((w)=>w.toLowerCase()).join('_');
const toPath=(p)=>Array.isArray(p)?p:String(p).replace(/\\[(\\w+)\\]/g,'.$1').split('.').filter((x)=>x!=='');
exports.set=(o,p,v)=>{const k=toPath(p);let c=o;k.forEach((x,i)=>{if(i===k.length-1)c[x]=v;else{if(c[x]==null||typeof c[x]!=='object')c[x]=/^\\d+$/.test(k[i+1])?[]:{};c=c[x];}});return o;};
exports.unset=(o,p)=>{const k=toPath(p);let c=o;for(let i=0;i<k.length-1;i++){c=c&&c[k[i]];}if(c&&typeof c==='object'){delete c[k[k.length-1]];return true;}return true;};
exports.default=exports;`);
shim('lodash/set', `module.exports=require('lodash').set;`, 'set.js');
fs.writeFileSync(`${NM}/lodash/set.js`, `module.exports=require('./index.js').set;`);
shim('minimatch', `const path=require('node:path');exports.minimatch=(f,p,o)=>{try{return path.matchesGlob(f,p)}catch(e){return false}};`);
shim('glob', `const fs=require('node:fs');const path=require('node:path');
function sync(p,o){o=o||{};const r=fs.globSync(p,{cwd:o.cwd||process.cwd()});return r.map((f)=>path.isAbsolute(f)?f:path.resolve(o.cwd||process.cwd(),f)).filter((f)=>fs.statSync(f).isFile());}
module.exports=(p,o,cb)=>{if(typeof o==='function'){cb=o;o={};}try{cb(null,sync(p,o))}catch(e){cb(e)}};module.exports.sync=sync;module.exports.glob=async(p,o)=>sync(p,o);`);
shim('env-paths', `module.exports=(n)=>({cache:require('node:path').join(${JSON.stringify(OUT)},'cache',n),data:'',config:'',log:'',temp:''});`);
// docs are served from the local theme-liquid-docs clone instead of raw.githubusercontent.com
const fetchShim = `
const fs=require('node:fs');
const ROOT=${JSON.stringify(D + '/theme-liquid-docs')};
async function f(url){ const m=String(url).match(/theme-liquid-docs\\/[^/]+\\/(.*)$/); const p=m?ROOT+'/'+m[1]:null;
  if(p&&fs.existsSync(p)){const t=fs.readFileSync(p,'utf8');return {ok:true,status:200,text:async()=>t,json:async()=>JSON.parse(t)};}
  return {ok:false,status:404,text:async()=>'',json:async()=>({})}; }
module.exports=f; module.exports.default=f; module.exports.fetch=f;`;
shim('node-fetch', fetchShim);
shim('cross-fetch', fetchShim);
fs.mkdirSync(`${OUT}/cache/theme-liquid-docs`, { recursive: true });
fs.copyFileSync(new URL('./run.cjs', import.meta.url), `${OUT}/run.cjs`);
fs.writeFileSync(`${OUT}/SOURCES.txt`, sources.join('\n') + '\n');
console.log('built', OUT);

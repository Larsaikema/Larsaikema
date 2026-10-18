/* Logo upload, placement preview and proof steps; documented in snippets/product-print.liquid. */
(()=>{
const KK=window.KK,EXT=/\.(pdf|ai|eps|svg|png|jpe?g)$/i,IMG=/\.(svg|png|jpe?g)$/i;
const size=(b)=>(b>=1048576?`${(b/1048576).toFixed(1).replace('.',',')} MB`:`${Math.max(1,Math.round(b/1024))} kB`);
const svg=(d,w)=>`<svg class="icon icon--sm" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linejoin="round"/></svg>`;
const FILE=svg('M6.5 3.5h7l4 4v13h-11z M13.5 3.5v4h4',1.8),X=svg('M6 6l12 12M18 6L6 18',2);
KK.printUpload=(pf)=>{
const root=pf.root,q=(s)=>root.querySelector(s),urls=new Map(),mock=q('[data-mock]');
const url=(f)=>urls.get(f)||urls.set(f,URL.createObjectURL(f)).get(f);
const err=(m)=>{const b=q('[data-print-error]');if(b)(b.textContent=m||''),(b.hidden=!m);return b};
pf.printError=(m,scroll=true)=>{const b=err(m);if(b&&scroll)b.closest('.print')?.scrollIntoView({block:'center',behavior:'smooth'})};
const setMock=(opts)=>{
if(!mock)return;
const t=opts.join(' ').toLowerCase(),d=mock.dataset,j=(k)=>{try{return JSON.parse(d[k])}catch(e){return{}}},c=j('colours'),w=j('widths'),s=mock.querySelector('[data-mock-size]');
d.mode=/rondom|full colour/.test(t)?'rondom':/2 kanten|twee kanten|beide/.test(t)?'twee':'een';
opts.forEach((o)=>{
if(c[o])mock.style.setProperty('--hoes',c[o]),mock.classList.toggle('is-dark',d.dark.includes(`|${o}|`));
if(w[o]&&s)s.textContent=d.wTpl.replace('__W__',w[o]);
});
};
pf.renderFiles=()=>{
const ul=q('[data-print-files]'),f=pf.files[0],img=f&&IMG.test(f.name);
if(!ul)return;
urls.forEach((u,k)=>pf.files.includes(k)||(URL.revokeObjectURL(u),urls.delete(k)));
ul.innerHTML=pf.files.map((f,i)=>`<li class="print__file-item">${IMG.test(f.name)?`<img src="${url(f)}" alt="">`:FILE}<span class="print__file-name">${KK.escape(f.name)}</span><span class="print__file-size">${size(f.size)}</span><button type="button" class="print__file-remove" data-remove-file="${i}" aria-label="${KK.escape(KK.t('fileRemove',{name:f.name}))}">${X}</button></li>`).join('');
ul.closest('.field')?.classList.toggle('has-file',!!f);
if(!mock)return;
mock.classList.toggle('has-img',!!img);
mock.classList.toggle('has-file',!!f&&!img);
mock.querySelectorAll('[data-mock-img]').forEach((i)=>(img?i.setAttribute('href',url(f)):i.removeAttribute('href')));
mock.querySelector('[data-mock-ext]').textContent=f&&!img?f.name.split('.').pop().toUpperCase():'';
};
const add=(input,list)=>{
const box=input.closest('[data-print-upload]').dataset,max=+box.maxFiles||5,mb=+box.maxMb||20,errors=new Set();
err();
list.forEach((f)=>{
if(!EXT.test(f.name))return errors.add(KK.t('fileType',{name:f.name}));
if(f.size>mb*1048576)return errors.add(KK.t('fileTooBig',{name:f.name,size:mb}));
if(pf.files.some((x)=>x.name===f.name&&x.size===f.size))return;
if(pf.files.length>=max)return errors.add(KK.t('fileTooMany',{max}));
pf.files.push(f);
});
input.value='';
pf.renderFiles();
if(errors.size)pf.printError([...errors].join(' '),false);
const later=q('[data-print-later]');
if(pf.files.length&&later)later.checked=false;
};
root.addEventListener('change',(e)=>{
const t=e.target,file=q('.print__file');
if(t===file)add(t,[...(t.files||[])]);
if(t.matches('[data-print-later]')&&file){
err();
file.disabled=t.checked;
file.closest('.field').classList.toggle('is-disabled',t.checked);
if(t.checked)(pf.files=[]),pf.renderFiles();
}
});
root.addEventListener('click',(e)=>{
const rm=e.target.closest('[data-remove-file]');
if(!rm)return;
pf.files.splice(+rm.dataset.removeFile,1);
pf.renderFiles();
q('.print__file')?.focus();
});
KK.on('variant:change',({variant:v,root:r})=>{
const st=q('[data-print-steps]');
if(r!==root)return;
setMock(v.options);
if(st)st.hidden=!v.print;
});
const drop=q('[data-print-drop]');
if(!drop)return;
const over=(on)=>(e)=>(e.preventDefault(),drop.classList.toggle('is-over',on));
['dragenter','dragover'].forEach((t)=>drop.addEventListener(t,over(true)));
['dragleave','drop'].forEach((t)=>drop.addEventListener(t,over(false)));
drop.addEventListener('drop',(e)=>{const i=q('.print__file');if(i&&!i.disabled)add(i,[...(e.dataTransfer?.files||[])])});
};
})();

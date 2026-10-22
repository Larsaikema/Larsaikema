/* Main product form; documented in snippets/product-buy.liquid. */
(()=>{
const KK=window.KK;
const sync=(q)=>q?.closest('quantity-input')?.sync?.();
class ProductForm extends HTMLElement{
connectedCallback(){
const $=(s)=>this.root.querySelector(s);
this.$=$;
this.form=document.getElementById(this.dataset.formId);
this.root=this.closest('product-info')||document;
this.button=this.querySelector('[data-add-button]');
this.error=this.querySelector('[data-form-error]');
this.note=this.querySelector('[data-qty-note]');
this.qty=this.querySelector('input[name="quantity"]');
this.files=[];
this.form.addEventListener('submit',(e)=>this.onSubmit(e));
this.root.addEventListener('change',(e)=>{
const q=this.qty;
if(e.target===q){
const max=+q.max||0;
this.showNote(max&&+q.value>max?max:0);
const v=String(this.quantity);
if(q.value!==v)(q.value=v),sync(q);
}
if(e.target===q||e.target.matches('[data-addon]'))this.refresh();
});
KK.printUpload?.(this);
this.addEventListener('click',(e)=>{const t=e.target.closest('[data-mix-toggle]');if(t&&!this.mix)(this.mix=t).setAttribute('aria-busy','true'),document.head.append(Object.assign(document.createElement('script'),{src:t.dataset.js}));});
this.root.addEventListener('click',(e)=>{
const tier=e.target.closest('[data-staffel-qty]');
if(tier&&this.qty)return(this.qty.value=tier.dataset.staffelQty),this.qty.dispatchEvent(new Event('change',{bubbles:true}));
const ql=e.target.closest('[data-quote-link]');
const f=ql&&$('[name="contact[Aantal]"]');
if(f)f.value=ql.dataset.quoteLink?this.quantity:Math.max(this.quantity,this.tiers()[0]?.vanaf||1);
const more=e.target.closest('[data-addons-more]');
if(more)this.initAddons(more.getAttribute('aria-expanded')!=='true',true);
});
this.unsubs=[
KK.on('variant:change',({variant:v,root})=>{
if(root!==this.root)return;
this.loading=true;
this.error.hidden=true;
this.button.dataset.price=v.price;
this.quickAddons(v.ad);
this.setMax(v.max);
this.setAvailable(v);
this.refresh();
}),
KK.on('variant:rendered',({root,button,doc})=>{
if(root!==this.root)return;
this.loading=false;
if(button)this.button.dataset.preorder=button.dataset.preorder;
this.swapAddons(doc);
this.refresh();
if(this.queued)(this.queued=false),this.busy(false),this.form.requestSubmit();
}),
KK.on('vat:change',()=>this.refresh()),
];
this.initAddons();
this.initSticky();
this.initQuote();
this.refresh();
}
disconnectedCallback(){
this.unsubs?.forEach((u)=>u());
removeEventListener('scroll',this.onScroll);
}
showNote(n){
if(!this.note)return;
this.note.textContent=n?this.note.dataset.tpl.replace('__COUNT__',n):'';
this.note.hidden=!n;
}
setMax(max){
const q=this.qty;
if(!q||this.$('[data-config-qty]'))return;
max=+max||0;
max?(q.max=max):q.removeAttribute('max');
const over=max&&+q.value>max;
if(over)q.value=max;
this.showNote(over?max:0);
sync(q);
}
initQuote(){
const ok=this.$('[data-form-success]');
const d=ok?.closest('details');
if(ok)requestAnimationFrame(()=>(d&&(d.open=true),ok.scrollIntoView({block:'center'}),ok.focus({preventScroll:true})));
const f=(el)=>el.form?.dataset.msgRequired&&el.form;
this.root.addEventListener('invalid',({target:el})=>f(el)&&(el.setCustomValidity(el.validity.valueMissing?el.dataset.msgRequired||el.form.dataset.msgRequired:el.form.dataset.msgEmail),el.setAttribute('aria-invalid','true')),true);
this.root.addEventListener('input',({target:el})=>f(el)&&(el.setCustomValidity(''),el.removeAttribute('aria-invalid')));
}
get quantity(){
const q=this.qty;
if(!q)return 1;
const step=Math.max(1,+q.step||1);
const n=Math.max(Math.max(1,+q.min||1),Math.round((+q.value||0)/step)*step);
return q.max?Math.min(n,Math.floor(+q.max/step)*step||n):n;
}
tiers(){
try{
return JSON.parse(this.$('[data-staffel]').dataset.staffel).sort((a,b)=>a.vanaf-b.vanaf);
}catch(e){
return[];
}
}
addons(){
return[...this.root.querySelectorAll('[data-addon]:checked')];
}
addonQty(a){
return Math.max(1,+a.dataset.qty||1)*(a.closest('[data-addon-follow]')?.dataset.addonFollow!=='false'?this.quantity:1);
}
quickAddons(ad){
if(!Array.isArray(ad))return;
const rows=[...this.root.querySelectorAll('[data-addon]')];
const left=ad.filter((a)=>!rows.some((i)=>i.dataset.product==a[0]));
rows.forEach((i)=>{
let a=ad.find((x)=>x[0]==i.dataset.product);
if(!a&&(a=left.find((x)=>x[4]&&x[4]===i.dataset.type)))left.splice(left.indexOf(a),1);
if(a)[i.dataset.product,i.value,i.dataset.price,i.dataset.qty]=a.map(String);
else i.checked=false;
i.disabled=!a;
});
}
swapAddons(doc){
const cur=this.$('[data-dynamic="addons"]');
const fresh=doc?.querySelector?.('[data-dynamic="addons"]');
if(!cur||!fresh)return;
const on=(this.on=cur.querySelector('[data-addon]')?this.addons().map((a)=>[a.dataset.product,a.dataset.type]):this.on||[]);
const open=cur.querySelector('[data-addons-more]')?.getAttribute('aria-expanded')==='true';
const next=fresh.cloneNode(true);
const all=[...next.querySelectorAll('[data-addon]')];
all.forEach((a)=>(a.checked=on.some(([p])=>p===a.dataset.product)));
on.forEach(([p,t])=>all.some((a)=>a.dataset.product===p)||((p=all.find((a)=>!a.checked&&t&&a.dataset.type===t))&&(p.checked=true)));
cur.replaceWith(next);
this.initAddons(open);
}
initAddons(open=false,user=false){
const box=this.$('[data-addons]');
const btn=box?.querySelector('[data-addons-more]');
if(!btn)return;
const items=[...box.querySelectorAll('.addons__item')];
const n=+box.dataset.visible||3;
if(items.length<=n+1)return btn.setAttribute('hidden','');
const label=btn.querySelector('[data-more-label]');
label.textContent=label.textContent.replace(/\d+|__N__/,items.length-n);
btn.removeAttribute('hidden');
if(!user)open||=items.slice(n).some((li)=>li.querySelector('[data-addon]:checked'));
items.forEach((li,i)=>li.toggleAttribute('hidden',!open&&i>=n));
btn.setAttribute('aria-expanded',open);
label.hidden=open;
btn.querySelector('[data-less-label]').hidden=!open;
if(open&&user)items[n].querySelector('[data-addon]')?.focus();
}
setAvailable(v){
const label=this.button.querySelector('[data-add-label]');
this.button.disabled=!v.available;
this.button.dataset.state=v.available?'available':'soldout';
if(label&&!v.available)label.textContent=KK.strings.soldOut;
const sticky=this.$('[data-sticky-add]');
if(sticky)sticky.disabled=!v.available;
this.querySelector('[data-buy-qty]')?.toggleAttribute('hidden',!v.available);
}
refresh(){
const b=this.button;
const label=b.querySelector('[data-add-label]');
const unit=+b.dataset.price||0;
const q=this.quantity;
const excl=document.documentElement.dataset.vat==='excl';
const fm=(c,x=excl)=>KK.formatMoney(KK.vatShown(c,x));
const total=unit*q+this.addons().reduce((n,a)=>n+(+a.dataset.price||0)*this.addonQty(a),0);
const verb=b.disabled?KK.strings.soldOut:b.dataset.preorder==='true'?KK.strings.preOrder:KK.strings.addToCart;
const lv=label?.querySelector('.btn__verb'),lt=label?.querySelector('.btn__total'),ln=lt?.firstChild;
if(label&&!b.disabled&&b.dataset.state!=='busy'){
if(lv&&ln?.nodeType===3&&!lt.querySelector('small')===!excl)(lv.textContent===verb||(lv.textContent=verb)),(ln.nodeValue=fm(total)+(excl?' ':''));
else label.innerHTML=`<span class="btn__verb">${verb}</span> <span class="btn__sep" aria-hidden="true">·</span> <span class="btn__total">${fm(total)}${excl?` <small>${KK.strings.excl||'excl. btw'}</small>`:''}</span>`;
}
const sl=this.$('[data-sticky-label]');
if(sl)sl.textContent=verb;
const sv=this.$('[data-dynamic="sticky-variant"]');
const na=this.addons().length;
if(sv?.dataset.qty)(sv.orig??=sv.textContent.trim()),(sv.textContent=`${[q>1&&sv.dataset.qty.replace('__N__',q),sv.orig].filter(Boolean).join(' · ')} ${na?(na>1?sv.dataset.more.replace('__N__',na):sv.dataset.one):''}`.trim());
const sp=this.$('[data-dynamic="sticky-price"]');
if(sp){
sp.orig??=sp.innerHTML;
sp.innerHTML=total===unit?sp.orig:`<span class="price__value">${fm(total)}</span>${excl?` <span class="price__label">${KK.strings.excl||'excl. btw'}</span>`:''}`;
}
const vm=(c)=>['incl','excl'].map((m)=>`<span data-vat-show="${m}">${fm(c,m==='excl')}</span>`).join('');
const sh=this.$('[data-ship-line]');
if(sh){
const t=JSON.parse(sh.dataset.tiers||'[]'),r=t.filter((x)=>q>=x[0]).pop(),n=t.find((x)=>q<x[0]),each=!!sh.dataset.each;
if(r){
sh.querySelector('[data-ship-q]').textContent=q>1?sh.dataset.tplQ.replace('__N__',q):sh.dataset.tpl1;
sh.querySelector('[data-ship-amt]').innerHTML=vm(each?r[1]*q:r[1]);
const nx=sh.querySelector('[data-ship-next]');
if(nx)nx.innerHTML=n&&!each?' · '+sh.dataset.tplN.replace('__N__',n[0]).replace('__A__',vm(n[1])):'';
}
}
this.root.querySelectorAll('[data-addon]').forEach((a)=>{
const out=a.closest('.addon')?.querySelector('.addon__price');
const per=Math.max(1,+a.dataset.qty||1);
const n=this.addonQty(a)/per;
if(!out||(out.dataset.n||'1')===String(n))return;
out.dataset.n=n;
const c=(+a.dataset.price||0)*per;
out.innerHTML=`${n>1?`<span class="addon__mult">${n} × ${vm(c)}</span>`:''}+&nbsp;${vm(c*n)}`;
});
const st=this.$('[data-staffel]');
if(!st)return;
const tiers=this.tiers();
const active=tiers.filter((t)=>q>=t.vanaf).pop();
const next=tiers.find((t)=>q<t.vanaf);
const cells=[...st.querySelectorAll('[data-tier-min]')];
const act=cells.filter((c)=>q>=+c.dataset.tierMin).pop();
cells.forEach((c)=>{
c.classList.toggle('is-active',c===act);
c.querySelector('[data-staffel-qty]')?.setAttribute('aria-pressed',String(c===act));
});
const hint=st.querySelector('[data-staffel-hint]');
if(!hint)return;
const per=active&&Math.round(unit*(1-active.korting/100));
const parts=[];
if(st.dataset.mode==='quote')active&&parts.push(hint.dataset.tpl.replace('__QTY__',q).replace('__QUOTE__',fm(per*q)).replace('__CART__',fm(unit*q)));
else{
if(active)parts.push(KK.t('staffelHint',{qty:q,price:fm(per)}));
if(next)parts.push(KK.t('staffelNext',{qty:next.vanaf-q,discount:next.korting}));
}
hint.innerHTML=parts.join(' · ');
hint.hidden=!parts.length;
}
async onSubmit(e){
e.preventDefault();
if(this.button.disabled||this.button.dataset.state==='busy')return;
this.error.hidden=true;
if(this.loading){
this.queued=true;
this.busy(true);
return setTimeout(()=>this.loading&&KK.emit('variant:rendered',{root:this.root}),8000);
}
const cfg=this.$('product-configurator');
if(cfg?.validateAll&&!cfg.validateAll())return;
const fd=new FormData(this.form);
if(fd.has('quantity')&&!this.$('[data-config-qty]'))fd.set('quantity',this.quantity);
const printBox=this.$('[data-print]');
const printOn=!!printBox&&!printBox.disabled&&!printBox.hidden;
const later=fd.getAll('properties[Logo]').find((x)=>typeof x==='string'&&x!=='');
fd.delete('properties[Logo]');
const files=printOn?this.files:[];
files.forEach((f,i)=>fd.append(i?`properties[Logo ${i+1}]`:'properties[Logo]',f,f.name));
if(!files.length&&later)fd.append('properties[Logo]',later);
[...fd.keys()].forEach((k)=>k.startsWith('properties[')&&fd.get(k)===''&&fd.delete(k));
if(printOn&&!files.length&&!later)return this.printError?.(printBox.dataset.required||KK.strings.printRequired);
const extra=this.addons().map((a)=>({id:+a.value,quantity:this.addonQty(a)}));
this.busy(true);
let added=null;
try{
if(files.length){
const ex=extra.length?await KK.cart.add({items:extra},{quiet:true}):null;
try{
added=await KK.cart.add(fd);
}catch(err){
const cur=ex?.items?.length&&(await(await fetch(`${KK.routes.cart}.js`,{headers:{Accept:'application/json'}})).json().catch(()=>null));
for(const it of ex?.items||[]){
const line=cur?.items?.find((l)=>l.key===it.key);
if(line)await KK.cart.change(it.key,Math.max(0,line.quantity-it.quantity)).catch(()=>{});
}
throw err;
}
this.files=[];
this.renderFiles?.();
}else{
const props={};
for(const[k,v]of fd){
const m=k.match(/^properties\[(.+)\]$/);
if(m&&v!=='')props[m[1]]=v;
}
const main={id:+fd.get('id'),quantity:this.quantity};
if(Object.keys(props).length)main.properties=props;
const res=await KK.cart.add({items:[main,...extra]});
added=res.items?res.items.find((i)=>i.variant_id===main.id)||res.items[0]:res;
}
this.done();
KK.cart.afterAdd(this.$('.product__title')?.textContent?.trim(),added);
}catch(err){
const d=String(err.data?.description||err.data?.message||'');
const n=+(d.match(/\b(?:maar|only|alle|all)\s+(\d+)/i)||[])[1];
const t=this.dataset.productTitle;
if(n&&t&&d.includes(t)&&this.qty&&n<this.quantity){
this.qty.value=n;
sync(this.qty);
this.error.textContent=this.error.dataset.stockTpl.replace('__COUNT__',n);
}else this.error.textContent=err.message||KK.strings.addError;
this.error.hidden=false;
this.busy(false);
}
}
busy(on){
const label=this.button.querySelector('[data-add-label]');
this.button.dataset.state=on?'busy':'available';
this.button.setAttribute('aria-busy',String(on));
if(on&&label)label.textContent=KK.strings.adding;
if(!on)this.refresh();
}
done(){
const label=this.button.querySelector('[data-add-label]');
this.button.classList.add('is-added');
if(label)label.textContent=KK.strings.added;
setTimeout(()=>(this.button.classList.remove('is-added'),this.busy(false)),1500);
}
initSticky(){
const bar=this.$('[data-sticky-buy]');
if(!bar)return;
const btn=bar.querySelector('[data-sticky-add]');
let ticking=false;
let lastY=scrollY;
let upBy=0;
const update=()=>{
ticking=false;
const wide=innerWidth>=990;
upBy=scrollY<lastY?upBy+lastY-scrollY:scrollY>lastY?0:upBy;
const down=scrollY>lastY+2;
lastY=scrollY;
const r=this.button.getBoundingClientRect();
const foot=wide&&document.querySelector('.shopify-section-group-footer-group, footer');
const footIn=!!foot&&foot.getBoundingClientRect().top<innerHeight-40;
let show=r.bottom<(parseFloat(document.documentElement.style.getPropertyValue('--header-h'))||0)&&!footIn&&!this.button.closest('[hidden]');
if(wide&&show&&upBy<=200)show=!down&&bar.classList.contains('is-visible');
if(show===bar.classList.contains('is-visible'))return;
bar.classList.toggle('is-visible',show);
bar.setAttribute('aria-hidden',String(!show));
btn?.setAttribute('tabindex',show?'0':'-1');
};
this.onScroll=()=>ticking||((ticking=true),requestAnimationFrame(update));
addEventListener('scroll',this.onScroll,{passive:true});
document.addEventListener('focusin',({target:t})=>{
if(!bar.classList.contains('is-visible')||bar.contains(t)||!t.matches(':focus-visible'))return;
const b=bar.getBoundingClientRect().top-12;
const r=t.getBoundingClientRect();
if(r.bottom>b&&r.top<innerHeight&&r.height<innerHeight/2)scrollBy(0,r.bottom-b);
});
update();
}
}
customElements.get('product-form')||customElements.define('product-form',ProductForm);
})();

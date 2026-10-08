const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { pathToFileURL } = require('node:url');
const root = process.argv[2] || path.resolve(__dirname, '..');
const frontendRequire = createRequire(path.join(root,'frontend/package.json'));
let vite;
const settle = () => new Promise(resolve=>setImmediate(resolve));
async function harness(file, mocks = {}, extras = {}) {
  vite ||= await import(pathToFileURL(frontendRequire.resolve('vite')).href);
  const source=fs.readFileSync(path.join(root,'frontend/src',file),'utf8');
  const {code}=await vite.transformWithOxc(source,file,{jsx:{runtime:'automatic'}});
  let cursor=0, tree;
  const slots=[], effects=[], timers=new Map(), notices=[], calls=[];
  let timerId=0;
  const same=(a,b)=>a&&b&&a.length===b.length&&a.every((x,i)=>Object.is(x,b[i]));
  const react={
    useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],next=>{slots[i]=typeof next==='function'?next(slots[i]):next;}];},
    useRef(initial){const i=cursor++;return slots[i]||=( {current:initial} );},
    useEffect(fn,deps){const i=cursor++;if(!same(slots[i]?.deps,deps)){effects.push(()=>{slots[i]?.cleanup?.();slots[i]={deps,cleanup:fn()};});}},
    useCallback(fn,deps){const i=cursor++;if(!same(slots[i]?.deps,deps))slots[i]={deps,value:fn};return slots[i].value;},
    useMemo(fn,deps){const i=cursor++;if(!same(slots[i]?.deps,deps))slots[i]={deps,value:fn()};return slots[i].value;},
  };
  const node=(type,props)=>({type,props:props||{}});
  const document={body:{appendChild(link){calls.push(['append',link]);}},fonts:{ready:Promise.resolve()},createElement(){return {click(){calls.push(['download',this.download,this.href]);},remove(){}};},...extras.document};
  const context=vm.createContext({console,URLSearchParams,Blob,FormData,Buffer,document,window:{focus(){},print(){calls.push(['print']);},open(url){calls.push(['open',url]);return {};},...extras.window},URL:{createObjectURL(){return 'blob:audit';},revokeObjectURL(){}},sessionStorage:extras.sessionStorage||{getItem(){return null;},setItem(key,value){calls.push(['storage',key,value]);}},setTimeout(fn,ms){timers.set(++timerId,{fn,ms});return timerId;},clearTimeout(id){timers.delete(id);},setInterval(){return 0;},clearInterval(){},alert(){throw Error('Native browser alert used');},...extras.globals});
  const mod=new vm.SourceTextModule(code,{context,identifier:file});
  await mod.link(specifier=>{
    let values;
    if(specifier==='react')values=react;
    else if(specifier==='react/jsx-runtime')values={jsx:node,jsxs:node,Fragment:'fragment'};
    else if(specifier==='react-router-dom')values={useNavigate:()=>url=>calls.push(['navigate',url]),useParams:()=>({id:'audit-bill'}),useLocation:()=>({search:''}),useSearchParams:()=>[new URLSearchParams('')],Link:'a',...mocks[specifier]};
    else if(mocks[specifier])values=mocks[specifier];
    else if(specifier.includes('notifications'))values={notify:(...args)=>notices.push(args),confirmAction:async()=>false};
    else {
      const imports=[...code.matchAll(/import\s*\{([^}]+)\}\s*from\s*["']([^"']+)["']/g)].filter(match=>match[2]===specifier);
      const names=imports.flatMap(match=>match[1].split(',').map(name=>name.trim().split(/\s+as\s+/)[0]));
      values=Object.fromEntries(names.map(name=>[name,()=>null]));values.default=()=>null;
    }
    const exports=Object.keys(values);return new vm.SyntheticModule(exports,function(){for(const name of exports)this.setExport(name,values[name]);},{context});
  });
  await mod.evaluate();
  function render(){cursor=0;tree=mod.namespace.default();return tree;}
  function find(predicate,element=tree,result=[]){if(!element)return result;if(Array.isArray(element)){element.forEach(item=>find(predicate,item,result));return result;}if(typeof element==='object'){if(predicate(element))result.push(element);find(element.props?.children,undefined,result);}return result;}
  // Traverse JSX output without running third-party widgets or DOM/browser code.
  function nodes(predicate,element=tree){const result=[];function visit(value){if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object'){if(predicate(value))result.push(value);visit(value.props?.children);}}visit(element);return result;}
  return {render,nodes,notices,calls,timers,slots,async flush(){while(effects.length)effects.shift()();await settle();await settle();},async runTimers(){const pending=[...timers.values()];timers.clear();for(const timer of pending)await timer.fn();await settle();},dispose(){for(const slot of slots)slot?.cleanup?.();}};
}
let checks=0;
async function check(name,fn){await fn();checks++;console.log('PASS '+name);}
(async()=>{
  await check('Price Settings displays actual API prices, including zero, and saves those values',async()=>{
    const prices={breakfast:0,lunch:117,dinner:132};let saved;
    const h=await harness('pages/PriceSettings.jsx',{'../services/customerService':{getPrices:async()=>({success:true,data:prices}),updatePrices:async value=>{saved=value;}}});
    h.render();await h.flush();h.render();
    for(const input of h.nodes(node=>node.type==='input'))assert.equal(input.props.value,prices[input.props.name]);
    await h.nodes(node=>node.type==='form')[0].props.onSubmit({preventDefault(){}});assert.deepEqual(JSON.parse(JSON.stringify(saved)),prices);h.dispose();
  });
  await check('failed price read cannot overwrite persisted rates with defaults',async()=>{
    let writes=0;
    const h=await harness('pages/PriceSettings.jsx',{'../services/customerService':{getPrices:async()=>{throw Error('Fixture offline');},updatePrices:async()=>{writes++;}}});
    h.render();await h.flush();h.render();
    assert(h.nodes(node=>node.props?.role==='alert').length);assert.equal(h.nodes(node=>node.type==='button'&&node.props.type==='submit')[0].props.disabled,true);
    await h.nodes(node=>node.type==='form')[0].props.onSubmit({preventDefault(){}});assert.equal(writes,0);h.dispose();
  });
  await check('Bill Download creates a PDF attachment and WhatsApp uses the same PDF and bill ID',async()=>{
    const blob=new Blob(['%PDF-fixture'],{type:'application/pdf'});const sent=[];
    const h=await harness('pages/ViewBills.jsx',{'../services/billService':{getAllBills:async()=>({success:true,data:[{_id:'audit-bill',invoiceNo:'AUDIT-1',customer:{customerName:'Audit'}}]}),downloadBillPdf:async()=>({data:blob}),sendBillWhatsApp:async form=>{sent.push(form);return {success:true};}}});
    h.render();await h.flush();h.render();
    const buttons=h.nodes(node=>node.type==='button');
    await buttons[1].props.onClick();assert(h.calls.some(call=>call[0]==='download'&&call[1]==='OM-Tiffin-AUDIT-1.pdf'));
    h.render();await h.nodes(node=>node.type==='button')[3].props.onClick();assert.equal(sent[0].get('billId'),'audit-bill');assert.equal(await sent[0].get('pdf').text(),'%PDF-fixture');
    h.nodes(node=>node.type==='button')[2].props.onClick();assert(h.calls.some(call=>call[0]==='open'&&call[1]==='/view-bills/audit-bill?print=true'));h.dispose();
  });
  await check('bill auto-print waits for loaded data and runs once',async()=>{
    const h=await harness('pages/SingleBill.jsx',{'../services/billService':{getBillById:async()=>({data:{_id:'audit-bill',dailyDetails:[]}})},'react-router-dom':{useSearchParams:()=>[new URLSearchParams('print=true')]}});
    h.render();assert.equal(h.calls.filter(call=>call[0]==='print').length,0);await h.flush();h.render();await h.flush();await h.runTimers();assert.equal(h.calls.filter(call=>call[0]==='print').length,1);
    h.render();await h.flush();await h.runTimers();assert.equal(h.calls.filter(call=>call[0]==='print').length,1);h.dispose();
  });
  await check('receipt download and manual send use server PDF with no viewport-dependent canvas',async()=>{
    const blob=new Blob(['%PDF-canonical-receipt'],{type:'application/pdf'});const sends=[];
    const payment={_id:'audit-bill',receiptNo:'CUSTOM-RECEIPT',amount:120,paymentDate:'2026-10-08T02:00:00Z',paymentMethod:'Bank',customer:{customerName:'Audit',phone:'0000000000'},bill:{status:'Partial',invoiceNo:'AUDIT-1'}};
    const h=await harness('pages/PaymentReceipt.jsx',{'../services/paymentService':{getPaymentById:async()=>payment,downloadPaymentReceiptPdf:async()=>({data:blob}),sendPaymentReceiptWhatsApp:async(id,pdf)=>{sends.push([id,pdf]);return {success:true};}}});
    h.render();await h.flush();h.render();const buttons=h.nodes(node=>node.type==='button');
    await buttons[1].props.onClick();assert(h.calls.some(call=>call[0]==='download'&&call[1].includes('CUSTOM-RECEIPT')));
    await buttons[2].props.onClick();assert.equal(sends[0][0],'audit-bill');assert.equal(sends[0][1],blob);h.dispose();
  });
  await check('Login stores the new token and enters dashboard without a blocking alert',async()=>{
    const h=await harness('pages/Login.jsx',{'../services/authService':{loginAdmin:async()=>({success:true,token:'new-audit-token'})}});
    h.render();await h.nodes(node=>node.type==='form')[0].props.onSubmit({preventDefault(){}});
    assert(h.calls.some(call=>call[0]==='storage'&&call[1]==='token'&&call[2]==='new-audit-token'));
    assert(h.calls.some(call=>call[0]==='navigate'&&call[1]==='/dashboard'));assert.equal(h.notices.length,1);h.dispose();
  });
  await check('every static internal link in active source resolves to a defined frontend route',async()=>{
    const app=fs.readFileSync(path.join(root,'frontend/src/App.jsx'),'utf8');
    const patterns=[...app.matchAll(/path="([^"]+)"/g)].map(match=>new RegExp('^'+match[1].replace(/:[^/]+/g,'[^/]+').replace(/\*/g,'.*')+'/?$')).filter(re=>!re.source.includes('.*'));
    let links=0;function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())walk(file);else if(/\.(jsx|js)$/.test(entry.name)&&!entry.name.includes('git-reference')){const text=fs.readFileSync(file,'utf8');for(const match of text.matchAll(/(?:to=|navigate\(|path:\s*)["'](\/[^"']*)["']/g)){const target=match[1].split(/[?#]/)[0]||'/';assert(patterns.some(re=>re.test(target)),file+' broken link '+target);links++;}}}}walk(path.join(root,'frontend/src'));assert(links>50);console.log('  '+links+' internal links matched');
  });
  console.log('PASS '+checks+' component/flow regression groups (isolated JSX harness; not a live browser test).');
})().catch(error=>{console.error(error);process.exitCode=1;});

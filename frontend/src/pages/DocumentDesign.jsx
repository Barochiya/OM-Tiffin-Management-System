import {useEffect,useRef,useState} from 'react';
import api from '../services/api';
import './document-design.css';
export default function DocumentDesign(){
 const [data,setData]=useState(null),[type,setType]=useState('bill'),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[dirty,setDirty]=useState(false),[pdf,setPdf]=useState('');
 const previewRef=useRef('');
 useEffect(()=>{api.get('/document-design').then(r=>setData(r.data.data)).catch(()=>setError('Unable to load design settings. Please reload and try again.'));return()=>URL.revokeObjectURL(previewRef.current);},[]);
 useEffect(()=>{const guard=e=>{if(dirty){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',guard);return()=>window.removeEventListener('beforeunload',guard)},[dirty]);
 const change=(key,value)=>{setData(prev=>({...prev,[type]:{...prev[type],[key]:value}}));setDirty(true);setMessage('');setPdf('');URL.revokeObjectURL(previewRef.current);previewRef.current='';};
 const uploadSignature=async(event)=>{
  const file=event.target.files?.[0];event.target.value='';if(!file)return;
  if(!['image/png','image/jpeg'].includes(file.type)||file.size>256*1024){setError('Choose a PNG or JPG signature image up to 256 KB.');return;}
  const documentType=type;setBusy(true);setError('');
  try{
   const value=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file)});
   const image=new Image();image.src=value;await image.decode();
   if(image.naturalWidth>2048||image.naturalHeight>2048)throw Error('Use a signature image no larger than 2048 × 2048 pixels.');
   setData(prev=>({...prev,[documentType]:{...prev[documentType],signatureImage:value}}));setDirty(true);setMessage('');setPdf('');URL.revokeObjectURL(previewRef.current);previewRef.current='';
  }catch(e){setError(e.message||'Could not read the signature image. Choose another PNG or JPG.');}finally{setBusy(false)}
 };
 const save=async()=>{setBusy(true);setError('');try{const r=await api.put('/document-design',data);setData(r.data.data);setDirty(false);setMessage('Design saved for both mobile and website admin.');}catch(e){setError(e.response?.data?.message||'Could not save. Your changes are still here.');}finally{setBusy(false)}};
 const preview=async()=>{setBusy(true);setError('');try{const r=await api.post('/document-design/preview',{type,design:data[type]},{responseType:'blob'});URL.revokeObjectURL(previewRef.current);previewRef.current=URL.createObjectURL(r.data);setPdf(previewRef.current);}catch{setError('Unable to generate preview. Please try again.');}finally{setBusy(false)}};
 if(!data)return <div className="document-designer">{error||'Loading document settings...'}{error&&<button onClick={()=>location.reload()}>Reload</button>}</div>;
 const design=data[type];
 const textField=(key,label,multiline=false)=><label key={key}>{label}{multiline?<textarea value={design[key]} maxLength={500} rows={3} onChange={e=>change(key,e.target.value)}/>:<input value={design[key]} maxLength={120} onChange={e=>change(key,e.target.value)}/>}</label>;
 return <div className="document-designer">
  <div className="design-hero"><span>DOCUMENT STUDIO</span><h1>Bill &amp; Receipt Design</h1><p>One saved design across your mobile app, website and WhatsApp PDFs.</p></div>
  <div className="design-tabs" role="tablist" aria-label="Document type">{['bill','receipt'].map(t=><button disabled={busy} role="tab" aria-selected={type===t} key={t} onClick={()=>{setType(t);setPdf('')}}>{t==='bill'?'Bill / Invoice':'Payment receipt'}</button>)}</div>
  {error&&<p role="alert" className="design-error">{error}</p>}{message&&<p role="status" className="design-success">{message}</p>}
  <div className="design-layout"><section className="design-controls"><fieldset disabled={busy}><h2>Appearance</h2>
   <label className="design-check"><input type="checkbox" checked={design.enabled} onChange={e=>change('enabled',e.target.checked)}/>Use this custom design for {type==='bill'?'bills':'receipts'}</label><p className="design-hint">Turn off to keep the existing document design. Changes apply to PDFs generated after saving.</p>
   <div className="design-fields"><label>Layout<select aria-label="Layout" value={design.layout} onChange={e=>change('layout',e.target.value)}><option value="modern">Modern</option><option value="classic">Classic</option></select></label><label>Font<select aria-label="Font" value={design.font} onChange={e=>change('font',e.target.value)}><option value="Helvetica">Sans serif</option><option value="Times-Roman">Serif</option><option value="Courier">Monospace</option></select></label><label>Font size<select aria-label="Font size" value={design.fontSize} onChange={e=>change('fontSize',Number(e.target.value))}>{[9,10,11,12,13].map(n=><option key={n} value={n}>{n} pt</option>)}</select></label><label>Logo position<select aria-label="Logo position" value={design.logoPosition} onChange={e=>change('logoPosition',e.target.value)}>{['left','center','right'].map(x=><option key={x}>{x}</option>)}</select></label>
   {['primary','text'].map(key=><label key={key}>{key==='primary'?'Accent color':'Text color'}<div className="design-color"><input aria-label={key+' color'} type="color" value={design[key]} onChange={e=>change(key,e.target.value)}/><span>{design[key]}</span></div></label>)}</div>
   <label className="design-check"><input type="checkbox" checked={design.showLogo} onChange={e=>change('showLogo',e.target.checked)}/>Show business logo</label>
   <h2>Business &amp; document text</h2>{textField('businessName','Business name')}{textField('tagline','Tagline')}{textField('contact','Contact details')}{textField('footer','Footer message',true)}{textField('terms','Terms / notes',true)}
   <label className="design-check"><input type="checkbox" checked={design.showQr} onChange={e=>change('showQr',e.target.checked)}/>{type==='bill'?'Show payment QR code':'Show receipt verification QR'}</label>{type==='bill'&&textField('upiId','Payment UPI ID')}
   <div className="design-signature"><h2>Authorized signature</h2><p className="design-hint">Upload a signature photo for this {type==='bill'?'bill':'receipt'}. It replaces the logo in the signature area. PNG or JPG, up to 256 KB and 2048 × 2048 pixels. Enable the custom design and Save designs to apply it.</p><label>Upload signature<input type="file" accept="image/png,image/jpeg" onChange={uploadSignature}/></label>{design.signatureImage?<><div className="design-signature-preview"><img src={design.signatureImage} alt="Uploaded authorized signature"/></div><button type="button" onClick={()=>change('signatureImage','')}>Remove signature</button></>:<div className="design-signature-preview"><span>No signature uploaded</span></div>}</div>
   <div className="design-actions"><button disabled={busy} onClick={preview}>{busy?'Please wait...':'Preview PDF'}</button><button disabled={busy||!dirty} onClick={save}>Save designs</button></div><p className="design-hint">{dirty?'Unsaved changes':'Saved settings'} · Customer, bill and payment data use the same existing database. Preview uses demo data and sends no messages.</p>
  </fieldset></section><section className="design-preview"><h2>PDF preview</h2><p className="design-hint">Preview shows the draft above, even when custom design is off. Save and enable it to use it for customer documents.</p>{pdf?<><a href={pdf} download={`OM-Tiffin-${type}-design-preview.pdf`}>Download preview PDF</a>{window.OMAdminNative?<p className="design-hint">Save the preview, then open it in your phone’s PDF viewer.</p>:<iframe title="Document PDF preview" src={pdf}/>}</>:<div className="design-placeholder">Choose your style, then tap Preview PDF.</div>}</section></div>
 </div>
}

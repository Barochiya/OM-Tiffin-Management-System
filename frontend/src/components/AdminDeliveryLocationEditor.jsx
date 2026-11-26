import {useEffect,useId,useRef,useState} from 'react';
import {MapPin,Navigation,X,CheckCircle2,ExternalLink} from 'lucide-react';
import {saveDeliveryLocation} from '../services/deliveryLocationService';
import {parseDeliveryCoordinates,validDeliveryPin,deliveryPinUrl} from '../utils/deliveryLocations';
import './delivery-location-editor.css';

export default function AdminDeliveryLocationEditor({customer,onClose,onSaved,onReload}) {
  const titleId=useId(),dialog=useRef(null),alive=useRef(true),sending=useRef(false),request=useRef(null);
  const [lat,setLat]=useState(String(customer.deliveryLocation?.latitude??''));
  const [lng,setLng]=useState(String(customer.deliveryLocation?.longitude??''));
  const [accuracy,setAccuracy]=useState(null),[note,setNote]=useState(customer.deliveryInstructions||'');
  const [paste,setPaste]=useState(''),[checked,setChecked]=useState(false),[gpsBusy,setGpsBusy]=useState(false),[saving,setSaving]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState(''),[conflict,setConflict]=useState(false);
  const pin={latitude:Number(lat),longitude:Number(lng)};
  const valid=lat.trim()!==''&&lng.trim()!==''&&validDeliveryPin(pin);
  useEffect(()=>{alive.current=true;const element=dialog.current,opener=document.activeElement;element.showModal();element.scrollTop=0;return()=>{alive.current=false;element.close();if(opener?.isConnected)opener.focus();};},[]);
  function enter(set,value){set(value);setChecked(false);setAccuracy(null);setMessage('');}
  function locate(){
    if(!navigator.geolocation){setError('GPS is unavailable. Enter coordinates or paste a Maps link.');return;}
    setGpsBusy(true);setError('');setMessage('Finding this device’s location…');
    navigator.geolocation.getCurrentPosition(position=>{if(!alive.current)return;setLat(String(position.coords.latitude));setLng(String(position.coords.longitude));setAccuracy(position.coords.accuracy);setChecked(false);setGpsBusy(false);setMessage('Pin filled. Check that this is the customer’s doorstep before saving.');},()=>{if(!alive.current)return;setGpsBusy(false);setMessage('');setError('Location access was unavailable or denied. You can still enter coordinates manually.');},{enableHighAccuracy:true,timeout:15000,maximumAge:0});
  }
  function applyPaste(){const parsed=parseDeliveryCoordinates(paste);if(!parsed){setError('Use latitude,longitude or a full Google Maps link containing coordinates. For a short share link, open it and copy the full coordinate link.');return;}setLat(String(parsed.latitude));setLng(String(parsed.longitude));setAccuracy(null);setChecked(false);setError('');setMessage('Coordinates filled. Check the pin before saving.');}
  async function submit(event){
    event.preventDefault();if(sending.current||!valid||!checked||conflict||gpsBusy)return;
    sending.current=true;setSaving(true);setError('');
    const body={deliveryLocation:{...pin,...(accuracy!==null?{accuracy}:{})},deliveryInstructions:note,expectedVersion:customer.locationVersion};
    const signature=JSON.stringify(body);if(request.current?.signature!==signature)request.current={signature,id:crypto.randomUUID()};body.requestId=request.current.id;
    try{const response=await saveDeliveryLocation(customer._id,body);if(alive.current)await onSaved(response.data);}
    catch(failure){if(alive.current){setConflict(failure.response?.status===409);setError(failure.response?.data?.message||'The pin could not be saved. Your entered values are retained; retry when connected.');}}
    finally{sending.current=false;if(alive.current)setSaving(false);}
  }
  return <dialog ref={dialog} className="delivery-location-dialog" aria-labelledby={titleId} onCancel={event=>{event.preventDefault();if(!saving)onClose();}} onClick={event=>{if(event.target===event.currentTarget&&!saving)onClose();}}>
    <header><div><span className="location-eyebrow"><MapPin size={14}/>Delivery pin</span><h2 id={titleId}>{customer.deliveryLocation?'Update delivery location':'Add delivery location'}</h2></div><button type="button" className="location-icon" disabled={saving} aria-label="Close location editor" onClick={onClose}><X size={20}/></button></header>
    <form onSubmit={submit}>
      <div className="location-customer"><strong>{customer.customerName}</strong><span>{customer.barcode||'Customer'}{customer.phone?' · '+customer.phone:''}</span><p>{customer.address||'No written address recorded'}</p></div>
      <p className="location-help">This updates only the delivery pin and delivery instructions. Written address, meals, bills and wallet stay unchanged.</p>
      <button className="location-gps" type="button" onClick={locate} disabled={saving||gpsBusy}><Navigation size={17}/>{gpsBusy?'Finding location…':'Use this device’s location'}</button>
      <p className="location-hint">Use GPS only when you are at this customer’s delivery point.</p>
      <div className="location-coordinates"><label>Latitude<input type="number" inputMode="decimal" step="any" min="-90" max="90" required value={lat} disabled={saving} onChange={event=>enter(setLat,event.target.value)}/></label><label>Longitude<input type="number" inputMode="decimal" step="any" min="-180" max="180" required value={lng} disabled={saving} onChange={event=>enter(setLng,event.target.value)}/></label></div>
      {accuracy!==null&&<p className="location-hint">GPS accuracy: about {Math.round(accuracy)} metres.{accuracy>100?' This pin may be imprecise; verify it carefully.':''}</p>}
      <details className="location-paste"><summary>Paste coordinates or a full Maps link</summary><label>Coordinates / Maps link<input type="text" value={paste} onChange={event=>setPaste(event.target.value)} disabled={saving} placeholder="23.0225,72.5714"/></label><button className="location-secondary" type="button" onClick={applyPaste} disabled={saving||!paste.trim()}>Fill coordinates</button><p className="location-hint">Links are parsed on this device; no URL is fetched automatically. A Maps @ link can point to the map centre—check the actual doorstep.</p></details>
      <label>Delivery instructions (optional)<textarea rows={2} maxLength={300} value={note} disabled={saving} onChange={event=>setNote(event.target.value)} placeholder="Building, floor, entrance or landmark"/></label>
      {valid&&<a className="location-preview" href={deliveryPinUrl(pin)} target="_blank" rel="noreferrer"><ExternalLink size={15}/>Check pin in Google Maps</a>}
      <label className="location-check"><input type="checkbox" checked={checked} onChange={event=>setChecked(event.target.checked)} disabled={saving||!valid}/><span>I checked that this pin belongs to <strong>{customer.customerName}</strong>.</span></label>
      {message&&<p role="status" className="location-info">{message}</p>}{error&&<p role="alert" className="location-error">{error}</p>}
      <footer><button type="button" className="location-secondary" disabled={saving} onClick={onClose}>Cancel</button>{conflict?<button type="button" className="location-primary" onClick={onReload}>Close & refresh latest pin</button>:<button type="submit" className="location-primary" disabled={saving||gpsBusy||!valid||!checked}><CheckCircle2 size={17}/>{saving?'Saving…':'Save delivery location'}</button>}</footer>
    </form>
  </dialog>;
}

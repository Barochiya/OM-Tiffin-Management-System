import {useEffect,useState} from 'react';
import {getCustomersForEntry} from '../services/dailyEntryService';
import {getDeliveries,markDelivery,currentDeliveryMeal} from '../services/mealDeliveryService';
import {getBusinessDate} from '../utils/businessDate';
import './meal-deliveries.css';
import SwipeDelivery from './SwipeDelivery';
export default function MealDeliveries(){
 const [date,setDate]=useState(getBusinessDate);const [meal,setMeal]=useState(currentDeliveryMeal);
 const [customers,setCustomers]=useState([]),[records,setRecords]=useState([]),[search,setSearch]=useState('');
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(''),[error,setError]=useState(''),[ready,setReady]=useState(false);const [filter,setFilter]=useState('All');
 useEffect(()=>{let live=true;setLoading(true);setError('');Promise.all([getCustomersForEntry(),getDeliveries(date)]).then(([c,d])=>{if(live){setCustomers(c.data||[]);setRecords(d.data||[]);setReady(d.whatsappConfigured===true);}}).catch(e=>{if(live)setError(e.response?.data?.message||'Delivery service is unavailable. Please retry.');}).finally(()=>{if(live)setLoading(false);});return()=>{live=false;};},[date]);
 async function mark(customer,status){
  if(busy)return;
  setBusy(customer._id);setError('');
  try{const result=await markDelivery({customer:customer._id,date,meal,status});setRecords(prev=>[...prev.filter(r=>!(r.customer===customer._id&&r.meal===meal)),result.data]);}
  catch(e){setError(e.response?.data?.message||'Could not confirm the update. Refresh delivery status before retrying.');}
  finally{setBusy('');}
 }
 const eligible=customers.filter(c=>c.status==='Active'&&[meal,'Both'].includes(c.mealType));

 const statusOf=c=>records.find(r=>r.customer===c._id&&r.meal===meal)?.status||'Pending';
 const counts=Object.fromEntries(['Pending','Out for delivery','Delivered'].map(status=>[status,eligible.filter(c=>statusOf(c)===status).length]));
 const visible=eligible.filter(c=>(filter==='All'||statusOf(c)===filter)&&[c.customerName,c.barcode,c.phone].join(' ').toLowerCase().includes(search.toLowerCase()));
 const completed=eligible.length?Math.round(counts.Delivered/eligible.length*100):0;
 const refresh=()=>{setLoading(true);getDeliveries(date).then(d=>{setRecords(d.data||[]);setReady(d.whatsappConfigured===true);setError('');}).catch(()=>setError('Refresh failed. Please try again.')).finally(()=>setLoading(false));};
 return <main className="delivery-workspace">
 <section className="delivery-header"><span className="delivery-eyebrow">OM TIFFIN · DELIVERY DESK</span><h1>Tiffin deliveries</h1><p>One shift. Every doorstep accounted for.</p>
 <div className="delivery-shift"><label>Date<input aria-label="Delivery date" type="date" value={date} onChange={e=>setDate(e.target.value)} disabled={!!busy}/></label><label>Meal<select aria-label="Delivery meal" value={meal} onChange={e=>{setMeal(e.target.value);setFilter('All');}} disabled={!!busy}><option>Lunch</option><option>Dinner</option></select></label></div>
 <div className="delivery-progress"><span>{completed}% completed</span><span>{counts.Delivered} / {eligible.length} stops</span></div><progress max="100" value={completed} aria-label="Delivery completion"/>
 </section>
 <section className="delivery-body">
 <div className="delivery-summary">{['Pending','Out for delivery','Delivered'].map(status=><button type="button" key={status} onClick={()=>setFilter(status)} aria-pressed={filter===status}><strong>{counts[status]}</strong><span>{status==='Out for delivery'?'On the way':status}</span></button>)}</div>
 <div className="delivery-toolbar"><h2>{meal} shift</h2><button type="button" disabled={loading||!!busy} onClick={refresh}>Refresh status</button></div>
 <input className="delivery-search" aria-label="Search delivery customers" placeholder="Search name, barcode or phone" value={search} onChange={e=>setSearch(e.target.value)}/>
 <nav className="delivery-filters" aria-label="Delivery status filter">{['All','Pending','Out for delivery','Delivered'].map(status=><button type="button" key={status} aria-pressed={filter===status} onClick={()=>setFilter(status)}>{status==='Out for delivery'?'On the way':status}</button>)}</nav>
 <p className="delivery-note">{date===getBusinessDate()?'Today’s shift · Mark dispatch before confirming handover.':'Past shift · Status is read-only.'} Delivery marks do not change meal or billing entries.</p>
 {error&&<p role="alert" className="delivery-error">{error}</p>}
 {loading?<p role="status" className="delivery-empty">Loading your delivery list...</p>:error?null:<div className="delivery-list">{visible.map((c,index)=>{const r=records.find(r=>r.customer===c._id&&r.meal===meal);const status=r?.status||'Pending';return <article key={c._id} className={'delivery-card '+(status==='Delivered'?'is-delivered':'')}>
 <div className="delivery-card-top"><span className="delivery-stop">{String(index+1).padStart(2,'0')}</span><div><h2>{c.customerName}</h2><span className="delivery-code">{c.barcode||'Customer'} · {meal}</span></div><span className={'delivery-badge status-'+status.split(' ')[0].toLowerCase()}>{status==='Out for delivery'?'On the way':status}</span></div>
 {c.address&&<p className="delivery-address">{c.address}</p>}
 <div className="delivery-contact">{c.phone&&<a href={'tel:'+c.phone}>Call customer</a>}{(c.deliveryLocation||c.address)&&<a href={'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(c.deliveryLocation?c.deliveryLocation.latitude+','+c.deliveryLocation.longitude:c.address)} target="_blank" rel="noreferrer">{c.deliveryLocation?'Open saved pin':'Open address'}</a>}</div>
 <div className="delivery-timeline"><span className={status!=='Pending'?'done':''}>Dispatched{r?.dispatchedAt&&<small>{new Date(r.dispatchedAt).toLocaleTimeString('en-IN',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit'})}</small>}</span><span className={status==='Delivered'?'done':''}>Delivered{r?.deliveredAt&&<small>{new Date(r.deliveredAt).toLocaleTimeString('en-IN',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit'})}</small>}</span></div>
 {status!=='Delivered'?<SwipeDelivery key={status} disabled={!!busy||date!==getBusinessDate()} onComplete={()=>mark(c,status==='Pending'?'Out for delivery':'Delivered')} label={busy===c._id?'Saving...':status==='Pending'?'Swipe: Out for delivery':'Swipe: Delivered'}/>:<p className="delivery-success">Handover confirmed</p>}
 {[[r?.dispatchNotification,'Dispatch'],[r?.notification,'Delivered']].map(([notice,label])=>notice?.status&&<p key={label} className="delivery-message">{label} WhatsApp: {notice.status==='not_configured'?'awaiting activation':notice.status==='accepted'?'accepted by WhatsApp':notice.status==='pending'?'sending':notice.status==='unknown'?'unconfirmed - check inbox before retrying':notice.status==='failed'?'failed - check WhatsApp setup':notice.status}</p>)}
 </article>;})}{!visible.length&&<div className="delivery-empty"><strong>{filter==='Delivered'?'No completed deliveries yet':'No stops in this list'}</strong><p>Change the meal, date or status filter.</p></div>}</div>}
 <p className="delivery-footer">{ready?'WhatsApp connection is enabled.':'WhatsApp notices are prepared. Sending will start after approval and activation.'}</p>
 </section></main>;
}

import {useEffect,useState} from 'react';
import {getCustomersForEntry} from '../services/dailyEntryService';
import {getDeliveries,markDelivery,currentDeliveryMeal} from '../services/mealDeliveryService';
import {getBusinessDate} from '../utils/businessDate';
import {confirmAction} from '../services/notifications';
export default function MealDeliveries(){
 const [date,setDate]=useState(getBusinessDate);const [meal,setMeal]=useState(currentDeliveryMeal);
 const [customers,setCustomers]=useState([]),[records,setRecords]=useState([]),[search,setSearch]=useState('');
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(''),[error,setError]=useState(''),[ready,setReady]=useState(false);
 useEffect(()=>{let live=true;setLoading(true);setError('');Promise.all([getCustomersForEntry(),getDeliveries(date)]).then(([c,d])=>{if(live){setCustomers(c.data||[]);setRecords(d.data||[]);setReady(d.whatsappConfigured===true);}}).catch(e=>{if(live)setError(e.response?.data?.message||'Delivery service is unavailable. Please retry.');}).finally(()=>{if(live)setLoading(false);});return()=>{live=false;};},[date]);
 async function mark(customer,status){
  if(busy||!await confirmAction(`${customer.customerName}: mark ${meal} as ${status}?`))return;
  setBusy(customer._id);setError('');
  try{const result=await markDelivery({customer:customer._id,date,meal,status});setRecords(prev=>[...prev.filter(r=>!(r.customer===customer._id&&r.meal===meal)),result.data]);}
  catch(e){setError(e.response?.data?.message||'Could not confirm the update. Refresh delivery status before retrying.');}
  finally{setBusy('');}
 }
 const eligible=customers.filter(c=>c.status==='Active'&&[meal,'Both'].includes(c.mealType)&&`${c.customerName} ${c.barcode||''} ${c.phone||''}`.toLowerCase().includes(search.toLowerCase()));
 return <main className="p-4 max-w-4xl mx-auto"><h1 className="text-2xl font-bold">Tiffin deliveries</h1><p className="text-sm text-slate-600 my-2">Pending → Out for delivery → Delivered. Delivery marks do not create meal or billing entries.</p>
 <div className="flex flex-wrap gap-3 my-4"><label>Date <input aria-label="Delivery date" type="date" value={date} onChange={e=>setDate(e.target.value)} disabled={!!busy} className="border rounded-lg p-2"/></label><label>Meal <select aria-label="Delivery meal" value={meal} onChange={e=>setMeal(e.target.value)} disabled={!!busy} className="border rounded-lg p-2"><option>Lunch</option><option>Dinner</option></select></label></div>
 <p className="text-sm p-3 bg-amber-50 rounded-lg">{ready?'WhatsApp connection enabled. Provider acceptance does not confirm message delivery.':'WhatsApp notifications are off until the approved template is connected.'}</p>
 <input aria-label="Search delivery customers" placeholder="Search customer, barcode or phone" value={search} onChange={e=>setSearch(e.target.value)} className="border rounded-lg p-3 my-4 w-full"/>
 <button type="button" disabled={loading||!!busy} onClick={()=>{setLoading(true);getDeliveries(date).then(d=>{setRecords(d.data||[]);setError('');}).catch(()=>setError('Refresh failed. Please try again.')).finally(()=>setLoading(false));}} className="border rounded-lg px-4 py-2 mb-3">Refresh status</button>
 {error&&<p role="alert" className="text-red-700 p-3">{error}</p>}{loading?<p role="status">Loading deliveries...</p>:error?null:<><p className="my-3">{eligible.length} customers · {meal}</p>{eligible.map(c=>{const r=records.find(r=>r.customer===c._id&&r.meal===meal);const status=r?.status||'Pending';return <article key={c._id} className="bg-white border rounded-xl p-4 mb-3"><h2 className="font-bold">{c.customerName}</h2><p className="text-sm text-slate-500">{c.barcode}</p><p className="my-2 font-semibold">{status}</p>{r?.notification?.status&&status==='Delivered'&&<p className="text-sm mb-2">WhatsApp: {r.notification.status==='not_configured'?'not configured':r.notification.status==='accepted'?'accepted by provider':r.notification.status}</p>}{status!=='Delivered'&&<button disabled={!!busy||date!==getBusinessDate()} onClick={()=>mark(c,status==='Pending'?'Out for delivery':'Delivered')} className="bg-emerald-800 text-white rounded-lg px-4 py-3">{busy===c._id?'Saving...':status==='Pending'?'Mark Out for delivery':'Mark Delivered'}</button>}</article>;})}{!eligible.length&&<p>No active customers for this meal.</p>}</>}
 </main>;
}

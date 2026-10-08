import { useEffect, useRef, useState } from 'react';
import { FaBell } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
export default function AdminNotifications() {
  const [data,setData]=useState(null), [open,setOpen]=useState(false), [error,setError]=useState(''), [reading,setReading]=useState(false);
  const container=useRef(null), inFlight=useRef(false), generation=useRef(0);
  const navigate=useNavigate();
  useEffect(()=>{
    let active=true;
    const load=async()=>{
      if(inFlight.current || document.visibilityState==='hidden') return;
      inFlight.current=true;const version=generation.current;
      try { const result=await api.get('/dashboard/notifications'); if(active && version===generation.current){setData(result.data);setError('');} }
      catch { if(active) setError('Notifications could not refresh.'); }
      finally {inFlight.current=false;}
    };
    load();const timer=setInterval(load,30000);
    document.addEventListener('visibilitychange',load);
    window.addEventListener('focus',load);
    return ()=>{active=false;clearInterval(timer);document.removeEventListener('visibilitychange',load);window.removeEventListener('focus',load);};
  },[]);
  useEffect(()=>{
    if(!open)return;
    const close=event=>{if(!container.current?.contains(event.target))setOpen(false);};
    const escape=event=>{if(event.key==='Escape')setOpen(false);};
    document.addEventListener('pointerdown',close);document.addEventListener('keydown',escape);
    return ()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',escape);};
  },[open]);
  const markRead=async(category,path)=>{
    if(reading || !data?.updatedAt)return;
    setReading(true);generation.current++;
    try {
      await api.post('/dashboard/notifications/read',{category,readThrough:data.updatedAt});
      generation.current++;
      setData(old=>{const categories=old.categories.map(item=>category==='all'||item.id===category?{...item,count:0}:item);return {...old,categories,total:categories.reduce((sum,item)=>sum+item.count,0)};});
      setError('');
      if(path){setOpen(false);navigate(path);}
    }catch {setError('Could not mark notifications as read. Please retry.');}
    finally{setReading(false);}
  };
  const categories=(data?.categories||[]).filter(item=>item.count>0);
  return <div className="relative" ref={container}>
    <button type="button" aria-label="Notifications" aria-expanded={open} onClick={()=>setOpen(!open)} title="Notifications" className="relative rounded-xl border border-slate-200 p-3 text-slate-600 hover:bg-slate-50">
      <FaBell/>{data?.total>0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-blue-600 px-1 text-xs font-bold text-white">{data.total>99?'99+':data.total}</span>}
    </button>
    {open && <section aria-label="Action notifications" className="fixed left-3 right-3 top-20 z-[100] max-h-[75vh] overflow-auto rounded-2xl border border-slate-200 bg-white shadow-xl md:absolute md:left-auto md:right-0 md:top-14 md:w-96">
      <div className="border-b border-slate-100 p-5"><h3 className="font-bold text-slate-900">Notifications</h3><p className="mt-1 text-sm text-slate-500">Approvals, messages and delivery actions</p></div>
      {data?.total>0 && <button type="button" disabled={reading} onClick={()=>markRead('all')} className="w-full border-b border-slate-100 px-5 py-3 text-left text-sm font-semibold text-blue-600 disabled:opacity-50">{reading?'Marking read…':'Mark all as read'}</button>}
      {error && <p role="status" className="px-5 py-3 text-sm text-amber-700">{error} {data?'Showing last available counts.':''}</p>}
      {data?.unavailable?.length>0 && <p className="px-5 py-3 text-sm text-amber-700">Some notification categories are temporarily unavailable.</p>}
      {!data && !error && <p className="p-6 text-sm text-slate-500">Loading notifications…</p>}
      {categories.map(item=><button key={item.id} type="button" disabled={reading} onClick={()=>markRead(item.id,item.path)} className="flex w-full items-center gap-4 border-b border-slate-100 px-5 py-4 text-left hover:bg-blue-50"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-600">{item.count}</span><span className="flex-1 text-sm font-semibold text-slate-700">{item.title}</span><span aria-hidden="true">→</span></button>)}
      {data && !categories.length && !error && !data.unavailable?.length && <p className="p-6 text-sm text-slate-500">You are all caught up. No unread notifications.</p>}
      {data?.updatedAt && <p className="px-5 py-3 text-xs text-slate-400">Updated {new Date(data.updatedAt).toLocaleTimeString('en-IN')}</p>}
    </section>}
  </div>;
}

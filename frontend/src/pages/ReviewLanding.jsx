import { useEffect, useState } from 'react';
import { Star, CheckCircle2, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../services/apiBaseUrl';
import logo from '../assets/logo-public.webp';
import '../styles/review-invitations.css';
const publicApi=axios.create({baseURL:API_BASE_URL,timeout:20000});
export default function ReviewLanding({token}){
 const [state,setState]=useState('loading'),[name,setName]=useState(''),[rating,setRating]=useState(0),[text,setText]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{let alive=true;setState('loading');publicApi.get(`/review-invitations/public/${encodeURIComponent(token)}`).then(({data})=>{if(!alive)return;setName(data.data.customerName||'');setState(data.data.submitted?'done':'ready');}).catch(()=>{if(alive)setState('unavailable');});return()=>{alive=false;};},[token]);
 async function submit(e){e.preventDefault();if(busy)return;if(!rating){setError('Please choose a star rating.');return;}setBusy(true);setError('');try{await publicApi.post('/review-invitations/public/submit',{token,customerName:name,rating,reviewText:text});setState('done');}catch(e){setError(e.response?.data?.message||'Unable to submit. Please try again.');}finally{setBusy(false);}}
 return <main className="review-landing" style={{minHeight:'80vh'}}><section className="review-card"><img className="review-logo" src={logo} alt="OM Tiffin Service"/><p className="review-eyebrow">OM TIFFIN SERVICE · CUSTOMER FEEDBACK</p>
 {state==='loading'?<p role="status">Opening your personal review link…</p>:state==='done'?<><CheckCircle2 size={52} className="review-success-icon"/><h1>Thank you for your review</h1><p>Your review has been received. You cannot submit another review using this link.</p><p className="review-muted">Thank you for sharing your experience with OM Tiffin Service.</p></>:state==='unavailable'?<><h1>This review link is unavailable</h1><p>Please ask OM Tiffin Service for your personal review link.</p></>:<><h1>How was your experience?</h1><p>Your honest feedback helps us serve you better.</p><form onSubmit={submit}>
 <label htmlFor="invite-review-name">Your name <span>You can change this</span></label><input id="invite-review-name" value={name} onChange={e=>setName(e.target.value)} required maxLength={100} autoComplete="name" disabled={busy}/>
 <fieldset><legend>Your rating</legend><div className="review-stars" role="radiogroup" aria-label="Your rating">{[1,2,3,4,5].map(n=><button key={n} type="button" role="radio" aria-checked={n===rating} aria-label={`${n} ${n===1?'star':'stars'}`} onClick={()=>setRating(n)} disabled={busy}><Star size={34} fill={n<=rating?'currentColor':'none'} /></button>)}</div></fieldset>
 <label htmlFor="invite-review-text">Your review</label><textarea id="invite-review-text" value={text} onChange={e=>setText(e.target.value)} required minLength={1} maxLength={1000} rows={5} placeholder="Tell us about your tiffin experience…" disabled={busy}/><small>{text.length}/1000</small>
 {error&&<p role="alert" className="review-error">{error}</p>}<button className="review-primary" disabled={busy}>{busy?'Submitting…':'Submit review'}</button><p className="review-privacy"><ShieldCheck size={16}/>Your review will be published on our website.</p></form></>}
 </section></main>;
}

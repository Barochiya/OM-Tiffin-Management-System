import {useRef,useState} from 'react';
import './swipe-delivery.css';
export default function SwipeDelivery({label,disabled,onComplete}){
 const ref=useRef(null),drag=useRef(null),pending=useRef(false);const [offset,setOffset]=useState(0);
 const max=()=>Math.max(1,ref.current.clientWidth-58);
 async function commit(){if(disabled||pending.current)return;pending.current=true;try{await onComplete();}finally{pending.current=false;setOffset(0);}}
 return <div ref={ref} className={'delivery-swipe'+(disabled?' is-disabled':'')}><span>{label}</span><button type="button" aria-label={label+'. Drag right or press Enter to confirm'} disabled={disabled} style={{transform:`translateX(${offset}px)`}} onPointerDown={e=>{if(disabled||pending.current)return;if(e.isPrimary===false)return;drag.current=e.clientX;try{e.currentTarget.setPointerCapture(e.pointerId);}catch{}}} onPointerMove={e=>{if(drag.current!==null)setOffset(Math.min(max(),Math.max(0,e.clientX-drag.current)));}} onPointerUp={e=>{if(drag.current===null)return;const distance=e.clientX-drag.current;drag.current=null;setOffset(0);if(distance>=max()*.85)commit();}} onPointerCancel={()=>{drag.current=null;setOffset(0);}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();commit();}}}>→</button></div>;
}

import { useEffect, useId, useRef } from 'react';
import WalletPanel from './WalletPanel';

export default function WalletDialog({ customerId, name, onClose }) {
  const dialog = useRef(null), titleId = useId();
  useEffect(() => { const element = dialog.current, opener = document.activeElement; element.showModal(); return () => { element.close(); if (opener?.isConnected) opener.focus(); }; }, []);
  return <dialog ref={dialog} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }} className="fixed inset-0 m-auto max-h-[92dvh] w-[min(960px,96vw)] max-w-none overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-0 text-slate-800 shadow-2xl backdrop:bg-slate-950/50">
    <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-white p-4"><h2 id={titleId} className="font-bold">{name ? `${name} · Wallet` : 'My wallet'}</h2><button type="button" onClick={onClose} aria-label="Close wallet" className="rounded-lg border px-3 py-2 text-sm font-semibold">Close ✕</button></div>
    <div className="px-3 sm:px-5"><WalletPanel key={customerId || 'own'} customerId={customerId} /></div>
  </dialog>;
}

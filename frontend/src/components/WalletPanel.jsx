import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../services/api';
import customerApi from '../services/customerAuthService';

const rupees = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((value || 0) / 100);
export default function WalletPanel({ customerId, refreshKey }) {
  const admin = Boolean(customerId), client = admin ? api : customerApi;
  const path = admin ? `/wallets/${customerId}` : '/customer-portal/wallet';
  const [wallet, setWallet] = useState(null), [proposal, setProposal] = useState(null);
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [older, setOlder] = useState([]);
  const [amount, setAmount] = useState(''), [reason, setReason] = useState('');
  const request = useRef(null), inFlight = useRef(false);
  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try { const { data } = await client.get(path); setWallet(data.data); setError(''); }
    catch (e) { setError(e.response?.data?.message || 'Wallet could not be refreshed. Please retry.'); }
    finally { inFlight.current = false; }
  }, [client, path]);
  useEffect(() => { setWallet(null); setProposal(null); setOlder([]); load(); const timer = setInterval(() => { if (!document.hidden) load(); }, 15000); window.addEventListener('focus', load); return () => { clearInterval(timer); window.removeEventListener('focus', load); }; }, [load, refreshKey]);
  const review = async () => { setBusy(true); try { const { data } = await api.get(`${path}/reconciliation`); setProposal(data.data); setError(''); } catch(e) { setError(e.response?.data?.message || 'Reconciliation failed'); } finally { setBusy(false); } };
  const activate = async () => { setBusy(true); try { await api.post(`${path}/activate`, { fingerprint: proposal.fingerprint }); setProposal(null); await load(); } catch(e) { setError(e.response?.data?.message || 'Activation failed'); } finally { setBusy(false); } };
  const adjust = async event => {
    event.preventDefault(); if (busy) return;
    const payload = { amount, reason: reason.trim() };
    const signature = JSON.stringify(payload);
    // Retain the same identity after a network failure; a retry cannot add money twice.
    if (request.current?.signature !== signature) request.current = { signature, id: crypto.randomUUID() };
    setBusy(true);
    try { await api.post(`${path}/adjustments`, { ...payload, requestId: request.current.id }); request.current = null; setAmount(''); setReason(''); setOlder([]); await load(); }
    catch(e) { setError(e.response?.data?.message || 'Adjustment could not be confirmed. Retry the same details.'); }
    finally { setBusy(false); }
  };
  const more = async () => { setBusy(true); try { const before = older.length ? older.at(-1).sequence : wallet.nextBefore; const { data } = await client.get(path, { params: { before } }); setOlder(rows => [...rows, ...data.data.history]); setWallet(w => ({ ...w, nextBefore: data.data.nextBefore })); } catch { setError('Older transactions could not be loaded'); } finally { setBusy(false); } };
  return <section className="my-6 rounded-2xl border border-slate-200 bg-white p-5" aria-label="Wallet">
    <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold text-slate-900">Wallet</h2><button type="button" onClick={load} className="rounded-lg border px-3 py-2 text-blue-700">Refresh wallet</button></div>
    {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}
    {!wallet && <p className="mt-3">Loading wallet…</p>}
    {wallet && !wallet.active && <><p className="mt-3 text-slate-600">Wallet opening balance is awaiting reconciliation.</p>{admin && <button disabled={busy} onClick={review} className="mt-3 rounded-lg bg-blue-700 px-4 py-2 text-white">Review opening balance</button>}</>}
    {proposal && <div className="mt-4 rounded-lg bg-slate-50 p-4"><p>Unused advance: {rupees(proposal.advancePaise)}</p><p>Invoice outstanding: {rupees(proposal.outstandingPaise)}</p><p>Unbilled meals: {rupees(proposal.unbilledPaise)}</p><p className="font-bold">Opening balance: {rupees(proposal.balancePaise)}</p>{proposal.issues.length ? <><p className="mt-2 font-semibold text-red-700">Review required before activation:</p><ul className="list-disc pl-5">{proposal.issues.map(item => <li key={item}>{item}</li>)}</ul></> : <button disabled={busy} onClick={activate} className="mt-3 rounded-lg bg-blue-700 px-4 py-2 text-white">Confirm opening balance and activate</button>}</div>}
    {wallet?.active && <><p className={`mt-4 text-3xl font-bold ${wallet.balancePaise < 0 ? 'text-red-700' : 'text-emerald-700'}`}>{rupees(wallet.balancePaise)}</p><p className="mt-1 text-slate-600">{wallet.balancePaise < 0 ? 'Amount outstanding' : 'Available credit'} · Meal charges and approved payments update automatically.</p>
      <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Wallet transaction history, latest first</caption><thead><tr className="border-b"><th className="p-2">Date</th><th className="p-2">Transaction</th><th className="p-2">Amount</th><th className="p-2">Balance after</th></tr></thead><tbody>{[...wallet.history, ...older].map(row => <tr key={row._id} className="border-b"><td className="p-2 whitespace-nowrap">{new Date(row.createdAt).toLocaleString('en-IN')}</td><td className="p-2"><span className="capitalize font-semibold">{row.type}</span><br/>{row.reason}</td><td className={`p-2 whitespace-nowrap ${row.amountPaise < 0 ? 'text-red-700' : 'text-emerald-700'}`}>{rupees(row.amountPaise)}</td><td className="p-2 whitespace-nowrap">{rupees(row.balancePaise)}</td></tr>)}</tbody></table></div>
      {wallet.nextBefore && <button disabled={busy} onClick={more} className="mt-3 rounded-lg border px-3 py-2">Older transactions</button>}
      {admin && <form onSubmit={adjust} className="mt-5 grid gap-3 border-t pt-4 sm:grid-cols-2"><p className="sm:col-span-2 font-semibold">Audited adjustment</p><label>Amount (₹; negative to debit)<input required type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label><label>Reason<input required minLength={5} maxLength={500} value={reason} onChange={e => setReason(e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label><button disabled={busy} className="rounded-lg bg-blue-700 px-4 py-2 text-white sm:col-span-2">{busy ? 'Saving…' : 'Record adjustment'}</button></form>}
    </>}
  </section>;
}

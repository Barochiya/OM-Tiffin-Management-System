import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../services/api';
import customerApi from '../services/customerAuthService';
import { currentBillingPeriod } from '../services/billingCycle';

export const walletMoney = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((value || 0) / 100);
export default function WalletPanel({ customerId, refreshKey }) {
  const admin = Boolean(customerId), client = admin ? api : customerApi;
  const path = admin ? `/wallets/${customerId}` : '/customer-portal/wallet';
  const [loadedWallet, setWallet] = useState(null), [proposal, setProposal] = useState(null);
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [older, setOlder] = useState([]);
  const [mode, setMode] = useState('unbilled'), [period, setPeriod] = useState(currentBillingPeriod);
  const [amount, setAmount] = useState(''), [reason, setReason] = useState(''), [adjustOpen, setAdjustOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false), [refreshedAt, setRefreshedAt] = useState(null);
  const request = useRef(null), activeLoad = useRef(null), selection = useRef('');
  const filterKey = JSON.stringify([path, mode, period]); selection.current = filterKey;
  const wallet = loadedWallet?._selection === filterKey ? loadedWallet : null;
  const params = { mode, ...(mode === 'cycle' ? period : {}) };
  const load = useCallback(async (background = false) => {
    if (background === true && activeLoad.current) return;
    activeLoad.current?.abort(); setRefreshing(true); const controller = new AbortController(); activeLoad.current = controller;
    try { const { data } = await client.get(path, { params: { mode, ...(mode === 'cycle' ? period : {}) }, signal: controller.signal, timeout: 12000 }); if (!controller.signal.aborted) { setOlder([]); setWallet({ ...data.data, _selection: JSON.stringify([path, mode, period]) }); setError(''); setRefreshedAt(new Date()); } }
    catch (e) { if (!controller.signal.aborted) setError(e.response?.data?.message || 'Wallet could not be refreshed. Please retry.'); }
    finally { if (activeLoad.current === controller) { activeLoad.current = null; setRefreshing(false); } }
  }, [client, path, mode, period]);
  useEffect(() => { setOlder([]); setProposal(null); load(); const refresh = () => { if (!document.hidden) load(true); }; const timer = setInterval(refresh, 15000); window.addEventListener('focus', refresh); window.addEventListener('online', refresh); document.addEventListener('visibilitychange', refresh); return () => { activeLoad.current?.abort(); clearInterval(timer); window.removeEventListener('focus', refresh); window.removeEventListener('online', refresh); document.removeEventListener('visibilitychange', refresh); }; }, [load, refreshKey]);
  const review = async () => { setBusy(true); try { const { data } = await api.get(`${path}/reconciliation`); setProposal(data.data); setError(''); } catch(e) { setError(e.response?.data?.message || 'Reconciliation failed'); } finally { setBusy(false); } };
  const activate = async () => { setBusy(true); try { await api.post(`${path}/activate`, { fingerprint: proposal.fingerprint }); setProposal(null); await load(); } catch(e) { setError(e.response?.data?.message || 'Activation failed'); } finally { setBusy(false); } };
  const adjust = async event => {
    event.preventDefault(); if (busy) return;
    const payload = { amount, reason: reason.trim() }, signature = JSON.stringify(payload);
    if (request.current?.signature !== signature) request.current = { signature, id: crypto.randomUUID() };
    setBusy(true);
    try { await api.post(`${path}/adjustments`, { ...payload, requestId: request.current.id }); request.current = null; setAmount(''); setReason(''); setOlder([]); setAdjustOpen(false); await load(); }
    catch(e) { setError(e.response?.data?.message || 'Adjustment could not be confirmed. Retry the same details.'); }
    finally { setBusy(false); }
  };
  const more = async () => {
    if (busy) return; const key = filterKey, loadAtStart = activeLoad.current; setBusy(true);
    try { const before = wallet.nextBefore; const { data } = await client.get(path, { params: { ...params, before } }); if (selection.current !== key || activeLoad.current !== loadAtStart) return; if (data.data.sequence !== wallet.sequence) { await load(); return; } setOlder(rows => [...new Map([...rows, ...data.data.history].map(row => [row._id, row])).values()]); setWallet(w => ({ ...w, nextBefore: data.data.nextBefore })); }
    catch { if (selection.current === key) setError('Older entries could not be loaded'); } finally { setBusy(false); }
  };
  return <section className="my-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6" aria-label="Wallet">
    <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold text-slate-900">Wallet</h2><button type="button" onClick={() => load()} disabled={refreshing} className="rounded-lg border px-3 py-2 text-blue-700">{refreshing ? 'Refreshing…' : 'Refresh wallet'}</button></div>
    <p role="status" className="mt-2 text-xs text-slate-500">{refreshing ? 'Checking latest wallet…' : refreshedAt ? `Last refreshed at ${refreshedAt.toLocaleTimeString('en-IN')}. Auto-refresh every 15 seconds.` : 'Auto-refresh every 15 seconds.'}</p>
    {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}
    {!wallet && <p className="mt-3">Loading wallet…</p>}
    {wallet && !wallet.active && <><p className="mt-3 text-slate-600">Wallet opening balance is awaiting reconciliation.</p>{admin && <button disabled={busy} onClick={review} className="mt-3 rounded-lg bg-blue-700 px-4 py-2 text-white">Review opening balance</button>}</>}
    {proposal && <div className="mt-4 rounded-lg bg-slate-50 p-4"><p>Unused advance: {walletMoney(proposal.advancePaise)}</p><p>Invoice outstanding: {walletMoney(proposal.outstandingPaise)}</p><p>Unbilled meals: {walletMoney(proposal.unbilledPaise)}</p><p className="font-bold">Opening balance: {walletMoney(proposal.balancePaise)}</p>{proposal.issues.length ? <><p className="mt-2 font-semibold text-red-700">Review required before activation:</p><ul className="list-disc pl-5">{proposal.issues.map(item => <li key={item}>{item}</li>)}</ul></> : <button disabled={busy} onClick={activate} className="mt-3 rounded-lg bg-blue-700 px-4 py-2 text-white">Confirm opening balance and activate</button>}</div>}
    {wallet?.active && <>
      <p className={`mt-4 text-3xl font-bold ${wallet.balancePaise < 0 ? 'text-red-700' : 'text-emerald-700'}`}>{walletMoney(wallet.balancePaise)}</p>
      <p className="mt-1 text-slate-600">{wallet.balancePaise < 0 ? 'Amount outstanding' : 'Available credit'}</p>
      <div className="mt-5 flex flex-wrap items-end gap-3">
        <label className="text-sm font-semibold">Show<select aria-label="Wallet history filter" value={mode} onChange={e => setMode(e.target.value)} className="mt-1 block rounded-lg border bg-white p-2 font-normal"><option value="unbilled">Current / unbilled entries</option><option value="cycle">Billing cycle</option><option value="all">All history</option>{admin && <option value="audit">Detailed audit</option>}</select></label>
        {mode === 'cycle' && <>
          <label className="text-sm">Month<select aria-label="Wallet month" value={period.month} onChange={e => setPeriod(p => ({ ...p, month: Number(e.target.value) }))} className="mt-1 block rounded-lg border p-2">{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{new Date(2026, i, 1).toLocaleString('en-IN', { month: 'short' })}</option>)}</select></label>
          <label className="text-sm">Year<input aria-label="Wallet year" type="number" min="2000" max="2100" value={period.year} onChange={e => { const year = Number(e.target.value); if (year >= 2000 && year <= 2100) setPeriod(p => ({ ...p, year })); }} className="mt-1 block w-24 rounded-lg border p-2" /></label>
          <label className="text-sm">Cycle<select aria-label="Wallet billing cycle" value={period.cycle} onChange={e => setPeriod(p => ({ ...p, cycle: e.target.value }))} className="mt-1 block rounded-lg border p-2"><option value="1">1st–15th</option><option value="2">16th–End</option></select></label>
        </>}
      </div>
      <p className="mt-3 text-xs text-slate-500">Amount is the current meal charge, not each edit delta. One meal row per date. Modified entries replace the displayed row. Billed entries remain available in Billing cycle or All history. Balance always shows your current total.</p>
      <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Wallet entries, latest update first</caption><thead><tr className="border-b bg-slate-50"><th className="p-3">Date</th><th className="p-3">Entry</th><th className="p-3">{mode === 'audit' ? 'Change' : 'Amount'}</th><th className="p-3">Balance after update</th></tr></thead><tbody>
        {[...new Map([...wallet.history, ...older].map(row => [row._id, row])).values()].map(row => <tr key={row._id} className="border-b"><td className="p-3 whitespace-nowrap">{row.serviceDate ? new Date(`${row.serviceDate}T00:00:00+05:30`).toLocaleDateString('en-IN') : new Date(row.createdAt).toLocaleDateString('en-IN')}</td><td className="p-3"><span className="font-semibold">{row.type === 'meal' ? row.modified ? 'Entry modified' : 'Meal entry' : row.type === 'opening' ? 'Opening balance' : row.type === 'payment' ? 'Payment received' : 'Adjustment'}</span>{row.archived && <span className="ml-2 rounded bg-slate-100 px-2 py-1 text-xs">Billed</span>}{row.quantities && <p className="mt-1 text-xs text-slate-500">Breakfast {row.quantities.breakfast} · Lunch {row.quantities.lunch} · Dinner {row.quantities.dinner}</p>}{(row.type === 'adjustment' || mode === 'audit') && <p className="mt-1 text-xs text-slate-500">{row.reason}</p>}</td><td className={`p-3 whitespace-nowrap ${row.amountPaise < 0 ? 'text-red-700' : 'text-emerald-700'}`}>{walletMoney(row.amountPaise)}</td><td className="p-3 whitespace-nowrap">{row.balancePaise === null ? 'Included in opening balance' : walletMoney(row.balancePaise)}</td></tr>)}
        {wallet.history.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-slate-500">No entries in this view. Use Billing cycle or All history to view previous entries.</td></tr>}
      </tbody></table></div>
      {wallet.nextBefore && <button disabled={busy} onClick={more} className="mt-3 rounded-lg border px-3 py-2">Older entries</button>}
      {admin && <div className="mt-5 border-t pt-4"><button type="button" onClick={() => setAdjustOpen(open => !open)} aria-expanded={adjustOpen} className="rounded-lg border px-3 py-2 font-semibold text-blue-700">{adjustOpen ? 'Close adjustment' : 'Add adjustment'}</button>{adjustOpen && <form onSubmit={adjust} className="mt-4 grid gap-3 sm:grid-cols-2"><label>Amount (₹; negative to debit)<input required type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label><label>Reason<input required minLength={5} maxLength={500} value={reason} onChange={e => setReason(e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label><button disabled={busy} className="rounded-lg bg-blue-700 px-4 py-2 text-white sm:col-span-2">{busy ? 'Saving…' : 'Record adjustment'}</button></form>}</div>}
    </>}
  </section>;
}

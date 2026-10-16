import { useEffect, useState } from 'react';
import { Wallet } from 'lucide-react';
import api from '../services/api';
import { walletMoney } from '../components/WalletPanel';
import WalletDialog from '../components/WalletDialog';

export default function AdminWallets() {
  const [search, setSearch] = useState(''), [filter, setFilter] = useState('all');
  const [rows, setRows] = useState([]), [summary, setSummary] = useState(null), [error, setError] = useState(''), [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null), [revision, setRevision] = useState(0);
  useEffect(() => { setRows([]); }, [search, filter]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      setLoading(true);
      try { const { data } = await api.get('/wallets', { params: { search, filter }, signal: controller.signal }); if (!controller.signal.aborted) { setRows(data.data); setSummary(data.summary); setError(''); } }
      catch(e) { if (!controller.signal.aborted) setError(e.response?.data?.message || 'Could not load wallets. Please refresh.'); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [search, filter, revision]);
  useEffect(() => { const refresh = () => setRevision(value => value + 1); const timer = setInterval(() => { if (!document.hidden) refresh(); }, 15000); window.addEventListener('focus', refresh); return () => { clearInterval(timer); window.removeEventListener('focus', refresh); }; }, []);
  return <main className="mx-auto max-w-7xl p-4 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900"><Wallet />Customer Wallets</h1><p className="mt-1 text-slate-500">Manage every customer balance and wallet history.</p></div><button onClick={() => setRevision(value => value + 1)} className="rounded-xl border bg-white px-4 py-2 font-semibold text-blue-700">Refresh wallets</button></div>
    {summary && <div className="my-5 grid grid-cols-1 gap-3 sm:grid-cols-3"><div className="rounded-xl border bg-white p-4"><p className="text-sm text-slate-500">Customers</p><p className="mt-1 text-2xl font-bold">{summary.customers}</p></div><div className="rounded-xl border bg-white p-4"><p className="text-sm text-slate-500">Available wallet credit</p><p className="mt-1 text-2xl font-bold text-emerald-700">{walletMoney(summary.creditPaise)}</p></div><div className="rounded-xl border bg-white p-4"><p className="text-sm text-slate-500">Wallet outstanding</p><p className="mt-1 text-2xl font-bold text-red-700">{walletMoney(summary.duePaise)}</p></div></div>}
    <div className="my-4 flex flex-wrap gap-3"><label className="flex-1 text-sm font-semibold">Search customer<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Name, customer ID or phone" className="mt-1 block w-full min-w-48 rounded-xl border bg-white p-3 font-normal" /></label><label className="text-sm font-semibold">Balance<select value={filter} onChange={event => setFilter(event.target.value)} className="mt-1 block rounded-xl border bg-white p-3 font-normal"><option value="all">All customers</option><option value="credit">Available credit</option><option value="due">Outstanding</option><option value="zero">Zero balance</option><option value="inactive">Awaiting reconciliation</option></select></label></div>
    {error && <p role="alert" className="mb-4 text-red-700">{error}</p>}
    <div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-left text-sm"><caption className="sr-only">All customer wallet balances</caption><thead className="bg-slate-50"><tr><th className="p-4">Customer</th><th className="p-4">Wallet balance</th><th className="p-4">Unused advance</th><th className="p-4">Manage</th></tr></thead><tbody>{rows.map(row => <tr key={row.customer} className="border-t"><td className="p-4"><p className="font-semibold">{row.name}</p><p className="text-xs text-slate-500">{row.barcode}</p></td><td className={`p-4 whitespace-nowrap font-bold ${row.balancePaise < 0 ? 'text-red-700' : 'text-emerald-700'}`}>{row.active ? walletMoney(row.balancePaise) : 'Awaiting reconciliation'}</td><td className="p-4 whitespace-nowrap">{walletMoney(row.advancePaise)}</td><td className="p-4"><button aria-label={`Open wallet for ${row.name}`} onClick={() => setSelected(row)} className="whitespace-nowrap rounded-lg bg-blue-700 px-3 py-2 font-semibold text-white">Open wallet</button></td></tr>)}{!rows.length && <tr><td colSpan={4} className="p-8 text-center text-slate-500">{loading ? 'Loading wallets…' : 'No matching customers.'}</td></tr>}</tbody></table></div>
    <p className="mt-3 text-xs text-slate-500">Unused advance is already included in the wallet balance; do not add the two values together.</p>
    {selected && <WalletDialog customerId={selected.customer} name={selected.name} onClose={() => { setSelected(null); setRevision(value => value + 1); }} />}
  </main>;
}

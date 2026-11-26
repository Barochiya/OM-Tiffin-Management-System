import { useEffect, useState } from 'react';
import { FaWalking } from 'react-icons/fa';
import api from '../services/api';

export default function WalkInCustomers() {
  const [latest, setLatest] = useState(null);
  const [search, setSearch] = useState('');
  const [balanceFilter,setBalanceFilter]=useState('all');
  const [rows, setRows] = useState([]);
  const [entry, setEntry] = useState({ name: '', phone: '' });
  const [selected, setSelected] = useState(null);
  const [payment, setPayment] = useState({ amount: '', total: '', type: 'Full', method: 'Cash', reference: '', requestId: '' });
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function load() {
    const { data } = await api.get('/walk-ins');
    setRows(data.data);
  }
  useEffect(() => { load().catch(() => setError('Could not load walk-in customers.')); }, []);
  async function run(action) {
    setBusy(true);
    setError('');
    setNotice('');
    try { await action(); await load(); }
    catch (err) { setError(err.response?.data?.message || 'Could not complete this action. Refresh before retrying.'); }
    finally { setBusy(false); }
  }
  const query = search.trim().toLowerCase();
  const digits = /^[+\d\s()-]+$/.test(query) ? query.replace(/\D/g, '') : '';
  const balance=row=>{const history=row.payments || (row.payment?[row.payment]:[]);const paid=history.slice(row.orderPaymentStart??0).reduce((sum,item)=>sum+Math.round(item.amount*100),0);return (row.totalPaise??paid)-paid;};
  const pendingCount=rows.filter(row=>balance(row)>0).length;
  const filtered = rows.filter(row => (balanceFilter==='all'||balance(row)>0)&&(!query || row.customerName.toLowerCase().includes(query) || (digits && ('91' + row.phone).includes(digits))));
  return <main className="mx-auto max-w-5xl space-y-4 p-4">
    <section className="rounded-2xl bg-[#152c52] px-6 py-7 text-white shadow-sm sm:px-8"><h1 className="flex items-center gap-3 text-2xl font-bold text-white"><FaWalking className="text-sky-300" aria-hidden="true" />Walk-in Customers</h1><p className="mt-2 text-slate-200">Track repeat orders, payments and review invitations.</p></section>
    {notice && <p role="status">{notice}</p>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <form className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4" onSubmit={e => {
      e.preventDefault();
      run(async () => { await api.post('/walk-ins', entry); setEntry({ name: '', phone: '' }); setNotice('Walk-in entry saved.'); });
    }}>
      <label>Name<input required maxLength={120} value={entry.name} onChange={e => setEntry({ ...entry, name: e.target.value })} className="block w-full rounded border p-2" /></label>
      <label>WhatsApp mobile number<input required type="tel" value={entry.phone} onChange={e => setEntry({ ...entry, phone: e.target.value })} className="block w-full rounded border p-2" /></label>
      <button disabled={busy} className="rounded bg-blue-700 p-2 text-white">Add walk-in customer</button>
    </form>
    <button type="button" disabled={busy} onClick={() => run(async () => {})} className="text-blue-700 underline">Refresh entries</button>
    <label className="block rounded-xl border bg-white p-4 font-semibold">Search walk-in customers
      <input type="search" placeholder="Name or WhatsApp number" value={search} onChange={e => setSearch(e.target.value)} className="mt-2 block w-full rounded-lg border p-2 sm:max-w-md" />
    </label>
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"><label className="font-semibold text-slate-700">Payment status<select aria-label="Filter payment status" value={balanceFilter} onChange={e=>setBalanceFilter(e.target.value)} className="ml-3 rounded-lg border p-2"><option value="all">All customers</option><option value="pending">Pending / balance due ({pendingCount})</option></select></label><span className="ml-auto text-sm text-amber-800">{pendingCount} customers awaiting payment</span></div>
    {filtered.length === 0 && !error && <p className="rounded-xl border border-dashed bg-white p-4">{search.trim() ? 'No matching customers.' : 'No walk-in customers yet.'}</p>}
    {filtered.map(row => { const history = row.payments || (row.payment ? [row.payment] : []); const paid = history.slice(row.orderPaymentStart ?? 0).reduce((sum, item) => sum + Math.round(item.amount * 100), 0); const due = (row.totalPaise ?? paid) - paid; const closed = history.length > 0 && due === 0; return <article key={row._id} className="space-y-4 rounded-2xl border border-slate-200 border-l-4 border-l-blue-600 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="break-words text-lg font-bold text-slate-900">{row.customerName}</h2>
          <p className="text-sm tabular-nums text-slate-600">+91 {row.phone}</p>
        </div>
        <span className={closed ? 'rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-900' : 'rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-900'}>
          {closed ? 'Fully paid' : due>0 ? (paid>0?'Partially paid':'Pending payment') : 'No order yet'}
        </span>
      </div>
      {(history.length > 0 || row.totalPaise>0) && <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-100 p-3">
        <div><div className="text-sm text-slate-600">Received</div><strong className="tabular-nums text-slate-900">₹{(paid / 100).toFixed(2)}</strong></div>
        <div><div className="text-sm text-slate-600">Remaining</div><strong className="tabular-nums text-slate-900">₹{(due / 100).toFixed(2)}</strong></div>
        {history.slice(row.orderPaymentStart??0).length>0 && row.whatsappStatus && <p className="col-span-2 text-sm text-slate-600">Latest payment message · {row.whatsappStatus}</p>}
      </div>}
        <button type="button" disabled={busy} className="mr-3 rounded border p-2" onClick={() => {
          setSelected(row._id); setPayment({ newOrder: closed, amount: due ? String(due / 100) : '', total: !closed && row.totalPaise ? String(row.totalPaise / 100) : '', type: 'Full', method: 'Cash', reference: '', requestId: crypto.randomUUID() });
        }}>{closed ? "New Order" : "Record Payment"}</button>
      {!row.reviewSubmitted && <button type="button" disabled={busy} className="rounded border p-2" onClick={() => run(async () => {
        const { data } = await api.post('/walk-ins/' + row._id + '/review', { requestId: crypto.randomUUID() });
        const status = data.data.results[0].status;
        setNotice(({ queued: 'Review link queued.', cooldown: 'A review link was requested in the past 24 hours.', review_received: 'Review already received.' })[status] || 'Review link status: ' + status);
      })}>Send Review Link</button>}
      <p className="text-sm text-slate-600">Review invitation · {row.reviewStatus}{row.reviewSubmitted && ' · Review submitted'}</p>
      {history.length > 0 && <details open={latest === row._id || undefined} className="rounded-lg border border-slate-200 p-3">
        <summary className="cursor-pointer font-medium">Payment history ({history.length})</summary>
        <ul className="mt-2 divide-y divide-slate-200">
          {history.map(item => <li key={item.requestId || item.receiptNo} className="py-2 text-sm">
            ₹{Number(item.amount).toFixed(2)} · {item.paymentMethod} · {new Date(item.paymentDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
            <div className="mt-2 flex flex-wrap gap-2">
              {item.receiptNo && ['message', 'receipt'].map(format => <button type="button" key={format} disabled={busy} className="rounded border px-3 py-2" onClick={() => run(async () => {
                await api.post('/walk-ins/' + row._id + '/payment/send', { receiptNo: item.receiptNo, format });
                setNotice(format === 'message' ? 'Payment message queued.' : 'Payment receipt queued.');
              })}>{format === 'message' ? 'Send Message' : 'Send Receipt'}</button>)}
            </div>
          </li>)}
        </ul>
      </details>}
      {selected === row._id && <form className="grid gap-4 rounded-xl border bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={e => {
        e.preventDefault();
        run(async () => { await api.post('/walk-ins/' + row._id + '/payment', payment); setSelected(null); setLatest(row._id); setNotice(payment.type==='Pending'?'Order saved as pending. No payment or receipt created.':'Payment saved. Choose Send Message or Send Receipt in Payment history.'); });
      }}>
        <label>Total amount<input className="block w-full rounded border p-2" type="number" required min="0.01" step="0.01" readOnly={Boolean(row.totalPaise) && !payment.newOrder} value={payment.total} onChange={e => setPayment({ ...payment, total: e.target.value, ...(payment.type==='Full'?{amount:String(Math.max(0,Number(e.target.value)-(payment.newOrder?0:paid/100)))}:{}) })} /></label>
        <label>Payment type<select className="block w-full rounded border p-2" value={payment.type} onChange={e => setPayment({ ...payment, type: e.target.value, reference:e.target.value==='Pending'?'':payment.reference, amount:e.target.value==='Pending'?'0':e.target.value==='Full'?String(Math.max(0,Number(payment.total)-(payment.newOrder?0:paid/100))):'' })}>{[['Full','Full — paid in full'],['Partial','Partial — some amount received'],['Pending','Pending — nothing received (₹0)']].filter(([type])=>type!=='Pending'||payment.newOrder||!row.totalPaise).map(([type,label])=><option key={type} value={type}>{label}</option>)}</select></label>
        <label>Received amount<input type="number" required min={payment.type==='Pending'?"0":"0.01"} readOnly={payment.type==='Pending'||payment.type==='Full'} max="999999.99" step="0.01" value={payment.amount} onChange={e => setPayment({ ...payment, amount: e.target.value })} className="block w-full rounded border p-2" /></label>
        <label>Method<select disabled={payment.type==='Pending'} value={payment.method} onChange={e => setPayment({ ...payment, method: e.target.value })} className="block rounded border p-2">{['Cash', 'UPI', 'Bank Transfer'].map(method => <option key={method}>{method}</option>)}</select></label>
        <label>Reference number (optional)<input disabled={payment.type==='Pending'} maxLength={160} value={payment.reference} onChange={e => setPayment({ ...payment, reference: e.target.value })} className="block w-full rounded border p-2" /></label>
        <button disabled={busy} className="rounded bg-blue-700 p-2 text-white">{payment.type==='Pending'?'Save pending order':'Save Payment'}</button>
        <p className="text-sm text-slate-600 sm:col-span-2 lg:col-span-3">{payment.type==='Pending'?'No money received: this order will stay in the pending list. No receipt or message will be created.':'Record only money actually received. Sending a message or receipt is a separate action.'}</p><button type="button" onClick={() => setSelected(null)}>Cancel</button>
      </form>}
    </article>; })}
  </main>;
}

import { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import api from '../services/api';
import customerApi from '../services/customerAuthService';

export default function WalletTopUps({ admin = false }) {
  const client = admin ? api : customerApi;
  const path = admin ? '/wallet-top-ups' : '/customer-portal/wallet/top-ups';
  const [rows, setRows] = useState([]);
  const [amount, setAmount] = useState('');
  const [details, setDetails] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(null);
  const request = useRef(null);
  const refresh = useCallback(async () => {
    const { data } = await client.get(path);
    setRows(data.data);
  }, [client, path]);
  useEffect(() => {
    refresh().catch(() => setError('Unable to load top-up requests.'));
  }, [refresh]);
  async function submit(url, body, onSuccess) {
    setBusy(true);
    setError('');
    try {
      const { data } = await client.post(url, body);
      onSuccess?.(data.data);
      await refresh();
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to update top-ups. Please retry.');
    } finally {
      setBusy(false);
    }
  }
  function create(event) {
    event.preventDefault();
    if (request.current?.amount !== amount) request.current = { amount, requestId: crypto.randomUUID() };
    submit(path, request.current, (row) => {
      setSelected(row._id);
      request.current = null;
    });
  }
  const money = (paise) => (paise / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
  return <section className="my-4 space-y-3 rounded-xl border bg-white p-4">
    <h2 className="font-bold">{admin ? 'Wallet Top-up Approvals' : 'Add money'}</h2>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {admin ? <p className="text-sm">Verify the payment in your bank or UPI account before approving.</p> :
      <form onSubmit={create} className="flex flex-wrap items-end gap-2">
        <label>Amount (₹)<input className="block rounded border p-2" type="number" min="1" max="50000" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
        {[100, 500, 1000, 2000].map(value => <button key={value} type="button" className="rounded border p-2" onClick={() => setAmount(String(value))}>₹{value}</button>)}
        <button disabled={busy} className="rounded bg-blue-700 p-2 text-white">Generate UPI QR</button>
      </form>}
    <button type="button" className="text-sm text-blue-700 underline" onClick={() => refresh().catch(() => setError('Unable to refresh top-ups.'))}>Refresh requests</button>
    {admin && <p className="text-sm">{rows.length} requests · {rows.filter(row => row.status === 'pending').length} pending · {rows.filter(row => row.status === 'rejected').length} rejected · {money(rows.reduce((total, row) => total + (row.status === 'approved' ? row.amountPaise : 0), 0))} approved</p>}
    {rows.map(row => <article key={row._id} className="space-y-2 rounded border p-3">
      <p className="font-semibold">{money(row.amountPaise)} · {row.status}</p>
      <p className="break-all text-xs">{row._id} · {new Date(row.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
      {admin && <p>{row.name} · {row.userId} · {row.phone}</p>}
      {row.reference && <p className="break-words">Payment reference {row.reference}</p>}
      {row.rejectionReason && <p className="break-words">{row.rejectionReason}</p>}
      {row.whatsappStatus && <p className="text-sm">WhatsApp · {row.whatsappStatus}</p>}
      {!admin && row.status === 'pending' && (!row.whatsappStatus || row.whatsappStatus === 'failed') &&
        <button type="button" disabled={busy} className="mr-3 rounded border p-2" onClick={() => submit(`${path}/${row._id}/whatsapp`, {})}>Send QR on WhatsApp</button>}
      {(row.status === 'pending' || admin) && <button type="button" className="text-blue-700 underline" onClick={() => setSelected(selected === row._id ? null : row._id)}>{selected === row._id ? 'Hide QR' : 'Show QR'}</button>}
      {selected === row._id && <div className="w-fit bg-white p-3"><QRCode value={row.upiUri} size={176} /></div>}
      {admin && row.status === 'pending' && <div className="flex flex-wrap gap-2">
        <input aria-label="Payment reference or rejection reason" placeholder="Payment reference or rejection reason" className="rounded border p-2" value={details[row._id] || ''} onChange={e => setDetails(previous => ({ ...previous, [row._id]: e.target.value }))} />
        {[['approved', 'Approve verified payment'], ['rejected', 'Reject']].map(([action, label]) =>
          <button key={action} disabled={busy || (details[row._id] || '').trim().length < 3} className="rounded border p-2 disabled:opacity-50" onClick={() => submit(`${path}/${row._id}/decision`, { action, detail: details[row._id] })}>{label}</button>)}
      </div>}
    </article>)}
  </section>;
}

import { useCallback, useEffect, useRef, useState } from 'react';

import api from '../services/api';
import customerApi from '../services/customerAuthService';
import { getWhatsAppMedia } from '../services/whatsappInboxService';

export default function WalletTopUps({ admin = false }) {
  const client = admin ? api : customerApi;
  const path = admin ? '/wallet-top-ups' : '/customer-portal/wallet/top-ups';
  const [rows, setRows] = useState([]);
  const [amount, setAmount] = useState('');
  const [details, setDetails] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(false);
  const request = useRef(null);
  const [proof, setProof] = useState(null);
  const [selectedProof, setSelectedProof] = useState({});
  useEffect(() => () => { if (proof) URL.revokeObjectURL(proof.url); }, [proof]);
  async function openProof(row, screenshot) {
    try {
      const blob = await getWhatsAppMedia(screenshot._id);
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(blob.type)) throw new Error('Unsupported screenshot');
      setProof({ id: row._id, url: URL.createObjectURL(blob) });
      setSelectedProof(previous => ({ ...previous, [row._id]: screenshot._id }));
    } catch {
      setError('Could not load the WhatsApp screenshot.');
    }
  }
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
  async function sendPaymentDetails(row) {
    await client.post(path + '/' + row._id + '/whatsapp', {});
    const { data } = await client.get(path);
    setRows(data.data);
    const updated = data.data.find(item => item._id === row._id);
    if (['accepted', 'sent', 'delivered', 'read'].includes(updated?.whatsappStatus)) {
      setNotice(true);
    } else if (updated?.whatsappStatus === 'failed') {
      throw new Error(updated.failureReason || 'WhatsApp delivery failed. Please retry.');
    }
  }
  async function sendRequest(loadRow) {
    setBusy(true);
    setError('');
    try {
      await sendPaymentDetails(await loadRow());
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Unable to send payment details.');
      await refresh().catch(() => {});
    } finally {
      setBusy(false);
    }
  }
  function create(event) {
    event.preventDefault();
    if (request.current?.amount !== amount) request.current = { amount, requestId: crypto.randomUUID() };
    sendRequest(async () => {
      const { data } = await client.post(path, request.current);
      request.current = null;
      return data.data;
    });
  }
  const money = (paise) => (paise / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
  const refreshRequests = () => refresh().catch(() => setError('Unable to refresh top-ups.'));
  const pendingCount = rows.filter(row => row.status === 'pending').length;
  const stats = [
    { label: 'Total requests', value: rows.length, color: 'border-blue-100 bg-blue-50 text-blue-900' },
    { label: 'Pending review', value: pendingCount, color: 'border-amber-100 bg-amber-50 text-amber-900' },
    { label: 'Rejected', value: rows.filter(row => row.status === 'rejected').length, color: 'border-rose-100 bg-rose-50 text-rose-900' },
    { label: 'Approved amount', value: money(rows.reduce((total, row) => total + (row.status === 'approved' ? row.amountPaise : 0), 0)), color: 'border-emerald-100 bg-emerald-50 text-emerald-900' },
  ];
  return <section className="my-4 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
    {admin ? <header className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Wallet Payment Approvals</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">Pending requests appear after a WhatsApp image is received. Verify the payment in your bank or UPI account before approving.</p>
        </div>
        <button type="button" className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50" onClick={refreshRequests}>Refresh requests</button>
      </div>
      <dl className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, color }) => <div key={label} className={`min-w-0 rounded-xl border p-4 ${color}`}>
          <dt className="text-sm font-medium">{label}</dt>
          <dd className="mt-2 break-words text-2xl font-semibold tabular-nums">{value}</dd>
        </div>)}
      </dl>
    </header> : <h2 className="text-xl font-semibold text-slate-900">Add money</h2>}
    {notice && <div role="status" className="rounded-lg bg-green-50 p-3 text-green-800">Payment details sent to your WhatsApp. <button type="button" className="underline" onClick={() => setNotice(false)}>Dismiss</button></div>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {!admin &&
      <form onSubmit={create} className="flex flex-wrap items-end gap-2">
        <label>Amount (₹)<input className="block rounded border p-2" type="number" min="1" max="50000" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
        {[100, 500, 1000, 2000].map(value => <button key={value} type="button" className="rounded border p-2" onClick={() => setAmount(String(value))}>₹{value}</button>)}
        <button disabled={busy} className="rounded bg-blue-700 p-2 text-white">Request Payment Details</button>
      </form>}
    {!admin && <button type="button" className="text-sm text-blue-700 underline" onClick={refreshRequests}>Refresh requests</button>}
    {admin && pendingCount === 0 && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No wallet payments awaiting review.</p>}
    {rows.map(row => <article key={row._id} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="font-semibold">{money(row.amountPaise)} · {row.status}</p>
      <p className="break-all text-xs">{row._id} · {new Date(row.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
      {admin && <p>{row.name} · {row.userId} · {row.phone}</p>}
      {admin && row.status === 'pending' && <div className="space-y-2">
        <p className="text-sm font-semibold">Recent WhatsApp images from this customer</p>
        {(row.screenshots || []).map(screenshot => <button key={screenshot._id} type="button" className="mr-2 rounded border p-2 text-sm" onClick={() => openProof(row, screenshot)}>
          View image · {new Date(screenshot.whatsappTimestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
        </button>)}
        {!row.screenshots?.length && <p className="text-sm text-slate-500">No images received since this request.</p>}
        {proof?.id === row._id && <><img src={proof.url} alt="Customer WhatsApp screenshot" className="max-h-96 max-w-full object-contain" /><button type="button" onClick={() => setProof(null)}>Close image</button></>}
      </div>}
      {row.reference && <p className="break-words">Payment reference {row.reference}</p>}
      {row.rejectionReason && <p className="break-words">{row.rejectionReason}</p>}
      {row.whatsappStatus && <p className="text-sm">WhatsApp · {row.whatsappStatus}</p>}
      {!admin && row.status === 'pending' && (!row.whatsappStatus || row.whatsappStatus === 'failed') &&
        <button type="button" disabled={busy} className="mr-3 rounded border p-2" onClick={() => sendRequest(() => row)}>Retry WhatsApp</button>}
      {admin && row.status === 'pending' && <div className="flex flex-wrap gap-2">
        <input aria-label="Reference (optional) or reason for rejection" placeholder="Reference (optional) or reason for rejection" className="rounded border p-2" value={details[row._id] || ''} onChange={e => setDetails(previous => ({ ...previous, [row._id]: e.target.value }))} />
        {[['approved', 'Approve verified payment'], ['rejected', 'Reject']].map(([action, label]) =>
          <button key={action} disabled={busy || (action === 'rejected' && !(details[row._id] || '').trim()) || (action === 'approved' && !selectedProof[row._id])} className="rounded border p-2 disabled:opacity-50" onClick={() => submit(`${path}/${row._id}/decision`, { action, detail: details[row._id], proofMessageId: selectedProof[row._id] })}>{label}</button>)}
      </div>}
    </article>)}
  </section>;
}

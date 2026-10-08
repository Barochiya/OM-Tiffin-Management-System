export default function GrowthBadge({ growth }) {
  if(!growth)return null;
  const value=growth.percent;
  const numeric=typeof value==='number' && Number.isFinite(value);
  const tone=!numeric || growth.share || value===0 ? 'bg-slate-100 text-slate-600' : value>0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700';
  return <div className="mt-3"><span className={'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold '+tone}>
    {numeric ? (growth.share ? '' : value>0?'↑ +':value<0?'↓ ':'')+value.toLocaleString('en-IN',{maximumFractionDigits:1})+'%' : growth.note || '—'}
  </span><p className="mt-1 text-xs leading-5 text-slate-500">{growth.label}</p></div>;
}

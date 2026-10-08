export default function PageLoading() {
  return <div className="om-page-loading" role="status" aria-live="polite" aria-label="Loading page"><div className="om-loading-heading"><span /><span /></div><div className="om-loading-grid">{[1,2,3].map(item=><div key={item}/>)}</div><div className="om-loading-table">{[1,2,3,4].map(item=><span key={item}/>)}</div><p>Loading your workspace…</p></div>;
}

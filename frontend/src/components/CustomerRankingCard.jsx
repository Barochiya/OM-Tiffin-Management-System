import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { getCustomerRanking } from "../services/customerAuthService";

export default function CustomerRankingCard() {
  const [ranking, setRanking] = useState(null);const [error, setError] = useState("");
  useEffect(() => { let active=true;getCustomerRanking().then((r)=>active&&setRanking(r.data)).catch(()=>active&&setError("Ranking is temporarily unavailable."));return()=>{active=false;}; }, []);
  if (error) return <section className="customer-rank-card customer-rank-error">{error}</section>;
  if (!ranking) return <section className="customer-rank-card animate-pulse" aria-label="Loading personal ranking"><div className="h-28 rounded-2xl bg-white/10" /></section>;
  const progress = ranking.rank ? Math.max(8, Math.min(100, (5 / ranking.rank) * 100)) : 0;
  return <section className="customer-rank-card" aria-label="Personal customer ranking">
    <div className="customer-rank-icon"><Trophy size={28} /></div><div className="min-w-0 flex-1"><p className="customer-rank-kicker">Your customer ranking</p><div className="flex flex-wrap items-end gap-x-3"><strong className="customer-rank-number">{ranking.rank ? `#${ranking.rank}` : "Not ranked"}</strong><span className="pb-2 text-sm text-blue-100">of {ranking.totalEligible} eligible customers</span></div><p className="text-sm text-blue-100">{ranking.period} · {ranking.scoreLabel}</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-amber-300" style={{ width: `${progress}%` }} /></div><p className="mt-2 text-xs text-blue-100">{ranking.topFive ? "Top 5 achievement unlocked" : ranking.rank ? `${ranking.progress.amountToTopFive.toLocaleString("en-IN", { style: "currency", currency: "INR" })} from the current Top 5 threshold` : "Complete an eligible successful payment to enter the ranking"}</p></div>
    <span className={`customer-rank-status ${ranking.topFive ? "is-top" : ""}`}>{ranking.topFive ? "Top 5" : "Keep growing"}</span>
  </section>;
}

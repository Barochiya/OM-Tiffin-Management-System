const PgStudents = lazy(() => import('./PgStudents'));
import { lazy } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
const Customers = lazy(() => import('./Customers'));
const Employees = lazy(() => import('./Employees'));
const ReviewInvitations = lazy(() => import('./ReviewInvitations'));
const Wallets = lazy(() => import('./AdminWallets'));
const WalletTopUps = lazy(() => import('../components/WalletTopUps'));
export default function CustomerDirectory() {
  const [query] = useSearchParams();
  if(query.get('view') === 'pg') return <PgStudents />;
  if(query.get('view') === 'review-invitations') return <ReviewInvitations />;
  if(query.get('view') === 'employees') return <Employees />;
  if(query.get('view') === 'wallet-payment-approvals') return <main className="mx-auto max-w-7xl p-4 sm:p-6"><WalletTopUps admin /></main>;
  return query.get('view') === 'wallets' ? <Wallets /> : <><div className="mb-4 flex justify-end"><Link className="rounded-xl bg-emerald-800 px-4 py-3 font-semibold text-white" to="/customers?view=employees">Employee Management</Link></div><Customers /></>;
}

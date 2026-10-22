import { lazy } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
const Customers = lazy(() => import('./Customers'));
const Employees = lazy(() => import('./Employees'));
const ReviewInvitations = lazy(() => import('./ReviewInvitations'));
const Wallets = lazy(() => import('./AdminWallets'));
export default function CustomerDirectory() {
  const [query] = useSearchParams();
  if(query.get('view') === 'review-invitations') return <ReviewInvitations />;
  if(query.get('view') === 'employees') return <Employees />;
  return query.get('view') === 'wallets' ? <Wallets /> : <><div className="mb-4 flex justify-end"><Link className="rounded-xl bg-emerald-800 px-4 py-3 font-semibold text-white" to="/customers?view=employees">Employee Management</Link></div><Customers /></>;
}

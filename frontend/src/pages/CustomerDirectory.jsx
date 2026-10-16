import { lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
const Customers = lazy(() => import('./Customers'));
const Wallets = lazy(() => import('./AdminWallets'));
export default function CustomerDirectory() {
  const [query] = useSearchParams();
  return query.get('view') === 'wallets' ? <Wallets /> : <Customers />;
}

import { useNavigate } from 'react-router-dom';
import WalletCard from '@/components/dashboard/WalletCard';
import QuickActions from '@/components/dashboard/QuickActions';
import SpendingBanner from '@/components/dashboard/SpendingBanner';
import RecentMovements from '@/components/dashboard/RecentMovements';
import AccountDetails from '@/components/dashboard/AccountDetails';
import AppLayout, { panelClass } from '@/components/layout/AppLayout';
import ThemeToggle from '@/components/common/ThemeToggle';
import { routes } from '@/lib/routes';
import { useWalletStore } from '@/store/useWalletStore';

export function greetingFor(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 6 && hour < 13) return 'Buen día';
  if (hour >= 13 && hour < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

function DashboardHeader({ summary }) {
  const fullName = `${summary.holder.firstName} ${summary.holder.lastName}`;
  return (
    <header className="flex items-center justify-between gap-4">
      <div>
        <p className="m-0 text-[15px] text-[#4A4560] lg:hidden dark:text-[#9D97B5]">{greetingFor()},</p>
        <h1 className="m-0 text-[28px] leading-tight font-bold tracking-tight lg:text-[32px] lg:text-white">
          <span className="lg:hidden">{fullName}</span>
          <span className="hidden lg:inline">{greetingFor()}, {summary.holder.firstName}</span>
        </h1>
        <p className="mt-1 mb-0 hidden text-sm text-white/75 lg:block">Así está tu billetera hoy.</p>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle className="lg:hidden" />
        <div className="hidden text-right lg:block">
          <p className="m-0 text-sm font-semibold text-white">{fullName}</p>
          <p className="m-0 text-xs text-white/70">Cuenta personal</p>
        </div>
        <span
          aria-hidden="true"
          className="grid size-12 place-items-center rounded-full border-2 border-white bg-[#4C1DB8] text-sm font-semibold text-white shadow-[0_8px_16px_-8px_rgba(76,29,184,0.7)] lg:border-white/40 lg:bg-[#FFD54A] lg:text-[#2A0E7A] dark:border-[#090613] lg:dark:border-white/30"
        >
          {summary.holder.firstName[0]}{summary.holder.lastName[0]}
        </span>
      </div>
    </header>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { balanceHidden, spendingDismissed, toggleBalanceHidden, dismissSpending } = useWalletStore();

  return (
    <AppLayout header={summary => <DashboardHeader summary={summary} />}>
      {summary => (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-7 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start lg:gap-8">
          <div className={`contents lg:grid lg:min-w-0 lg:grid-cols-[minmax(0,1fr)] lg:content-start lg:gap-7 ${panelClass}`}>
            <h2 className="m-0 hidden text-lg font-semibold lg:block">Mi cuenta</h2>
            <div className="order-1 min-w-0 lg:order-none">
              <WalletCard
                holderName={`${summary.holder.firstName} ${summary.holder.lastName}`}
                balance={summary.balance}
                lastDigits={summary.card.lastDigits}
                expiry={summary.card.expiry}
                hidden={balanceHidden}
                onToggleHidden={toggleBalanceHidden}
              />
            </div>
            <div className="order-2 lg:order-none">
              <QuickActions onAction={action => navigate(routes[action])} />
            </div>
            <div className="order-5 min-w-0 lg:order-none">
              <AccountDetails cvu={summary.account.cvu} alias={summary.account.alias} />
            </div>
          </div>

          <div className={`contents lg:grid lg:min-w-0 lg:grid-cols-[minmax(0,1fr)] lg:content-start lg:gap-7 ${panelClass}`}>
            {!spendingDismissed && (
              <div className="order-3 min-w-0 lg:order-none">
                <SpendingBanner
                  amount={summary.monthlySpending.amount}
                  budget={summary.monthlySpending.budget}
                  changePercent={summary.monthlySpending.changePercent}
                  onDismiss={dismissSpending}
                />
              </div>
            )}
            <div className="order-4 min-w-0 lg:order-none">
              <RecentMovements movements={summary.recentMovements} limit={6} onViewAll={() => navigate(routes.movements)} />
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

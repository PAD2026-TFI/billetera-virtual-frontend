import { useNavigate } from 'react-router-dom';
import { ChevronRight, UserRound } from 'lucide-react';
import WalletCard from '@/components/dashboard/WalletCard';
import QuickActions from '@/components/dashboard/QuickActions';
import SpendingBanner from '@/components/dashboard/SpendingBanner';
import RecentMovements from '@/components/dashboard/RecentMovements';
import AccountDetails from '@/components/dashboard/AccountDetails';
import AppLayout, { panelClass } from '@/components/layout/AppLayout';
import ThemeToggle from '@/components/common/ThemeToggle';
import { routes } from '@/lib/routes';
import { isMerchantUser, useAuthStore } from '@/store/useAuthStore';
import { useWalletStore } from '@/store/useWalletStore';

export function greetingFor(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 6 && hour < 13) return 'Buen día';
  if (hour >= 13 && hour < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

function DashboardHeader({ summary }) {
  const navigate = useNavigate();
  const isMerchant = useAuthStore(state => isMerchantUser(state.session?.user));
  const fullName = `${summary.holder.firstName} ${summary.holder.lastName}`;
  return (
    <header className="flex items-center justify-between gap-4">
      <div>
        <p className="m-0 text-xs font-semibold tracking-wider text-[#6E6888] uppercase lg:hidden dark:text-[#9D97B5]">
          {greetingFor()}
        </p>
        <h1 className="m-0 text-[28px] leading-tight font-bold tracking-[-0.02em] text-[#1C1633] lg:text-[34px] lg:text-white dark:text-[#F4F2FA]">
          <span className="lg:hidden">{fullName}</span>
          <span className="hidden lg:inline">
            {greetingFor()}, {summary.holder.firstName}
          </span>
        </h1>
        <p className="mt-1 mb-0 hidden text-sm text-white/75 lg:block">
          {isMerchant
            ? 'Panel de cobros y administración de tu comercio.'
            : 'Resumen en tiempo real de tu cuenta personal.'}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle className="lg:hidden" />
        <div className="hidden text-right lg:block">
          <p className="m-0 text-sm font-semibold text-white">{fullName}</p>
          <p className="m-0 font-mono text-xs text-[#FFD54A]/90">{summary.account.alias}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(routes.profile)}
          aria-label="Ver mi perfil"
          className="m-0 grid size-12 place-items-center rounded-2xl border-2 border-white bg-[#4C1DB8] p-0 text-sm font-bold text-white shadow-[0_10px_20px_-8px_rgba(76,29,184,0.75)] transition-transform hover:scale-105 lg:border-white/30 lg:bg-[#FFD54A] lg:text-[#1C1633] dark:border-[#261E3D] lg:dark:border-white/25"
        >
          <span aria-hidden="true">
            {summary.holder.firstName[0]}
            {summary.holder.lastName[0]}
          </span>
        </button>
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
        <div className="grid grid-cols-[minmax(0,1fr)] gap-7 lg:grid-cols-[minmax(0,390px)_minmax(0,1fr)] lg:items-stretch lg:gap-8">
          <div
            className={`contents lg:grid lg:h-full lg:min-w-0 lg:grid-cols-[minmax(0,1fr)] lg:content-start lg:gap-6 ${panelClass}`}
          >
            <div className="hidden items-center justify-between lg:flex">
              <div className="flex items-center gap-2">
                <span aria-hidden="true" className="size-2 rounded-full bg-[#FFD54A]" />
                <h2 className="m-0 text-base font-bold tracking-tight">Mi cuenta</h2>
              </div>
              <button
                type="button"
                onClick={() => navigate(routes.profile)}
                className="group inline-flex h-8 items-center gap-1 rounded-full bg-[#F3F1F9] px-3 text-xs font-semibold text-[#4C1DB8] transition-colors hover:bg-[#E9E5F6] dark:bg-[#1E1735] dark:text-[#C4B2FF] dark:hover:bg-[#281F45]"
              >
                <UserRound className="size-3.5" aria-hidden="true" />
                Ver mis datos
                <ChevronRight
                  className="size-3 transition-transform duration-150 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </button>
            </div>

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

            <div className="order-5 flex min-w-0 flex-col gap-3 lg:order-none">
              <AccountDetails cvu={summary.account.cvu} alias={summary.account.alias} />
              <button
                type="button"
                onClick={() => navigate(routes.profile)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#ECE9F5] bg-[#FAF9FE] py-3 text-sm font-semibold text-[#4C1DB8] transition-colors hover:bg-[#EDE7FC] lg:hidden dark:border-[#261E3D] dark:bg-[#19122C] dark:text-[#FFD54A] dark:hover:bg-[#241B3E]"
              >
                <UserRound className="size-4" aria-hidden="true" />
                Ver mis datos
              </button>
            </div>
          </div>

          <div
            className={`contents lg:grid lg:h-full lg:min-w-0 lg:grid-cols-[minmax(0,1fr)] lg:content-start lg:gap-6 ${panelClass}`}
          >
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
              <RecentMovements
                movements={summary.recentMovements}
                limit={6}
                onViewAll={() => navigate(routes.movements)}
              />
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

import { Component } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { primaryActionClass, secondaryActionClass } from '@/components/forms/formStyles';
import { routes } from '@/lib/routes';

class ErrorBoundary extends Component {
  state = { error: null, errorId: null };

  static getDerivedStateFromError(error) {
    return { error, errorId: crypto.randomUUID().slice(0, 8).toUpperCase() };
  }

  componentDidCatch(error, info) {
    console.error(`Error ${this.state.errorId}`, error, info.componentStack);
  }

  componentDidUpdate(previous) {
    if (this.state.error && previous.resetKey !== this.props.resetKey) this.reset();
  }

  reset = () => this.setState({ error: null, errorId: null });

  render() {
    if (!this.state.error) return this.props.children;
    return <ErrorFallback errorId={this.state.errorId} onRetry={this.reset} />;
  }
}

function ErrorFallback({ errorId, onRetry }) {
  const navigate = useNavigate();

  function goHome() {
    navigate(routes.home);
    onRetry();
  }

  return (
    <main className="m-0 grid min-h-svh max-w-none place-items-center bg-[#F8F7FD] p-5 font-[Poppins] text-[#1C1633] dark:bg-[#090613] dark:text-[#F4F2FA]">
      <div className="grid w-full max-w-md justify-items-center gap-3 rounded-[24px] bg-white p-7 text-center dark:border dark:border-[#261E3D] dark:bg-[#140F24]">
        <span className="grid size-14 place-items-center rounded-full bg-red-50 text-red-600 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertTriangle className="size-7" aria-hidden="true" />
        </span>
        <h1 className="m-0 text-xl font-bold">Algo no salió como esperábamos</h1>
        <p className="m-0 text-sm text-[#4A4560] dark:text-[#9D97B5]">
          Tu dinero y tus datos están a salvo. Probá de nuevo y, si se repite, contactá a soporte con este código:
        </p>
        <p className="m-0 rounded-xl bg-[#F3F1F9] px-4 py-2 font-mono text-sm font-semibold dark:bg-[#1E1735]">{errorId}</p>
        <div className="mt-3 grid w-full gap-2">
          <button type="button" onClick={onRetry} className={primaryActionClass}>Reintentar</button>
          <button type="button" onClick={goHome} className={secondaryActionClass}>Volver al inicio</button>
        </div>
      </div>
    </main>
  );
}

export default function AppErrorBoundary({ children }) {
  const { pathname } = useLocation();
  return <ErrorBoundary resetKey={pathname}>{children}</ErrorBoundary>;
}

import AppRoutes from '@/AppRoutes';
import AppErrorBoundary from '@/components/common/AppErrorBoundary';
import ConnectionBanner from '@/components/common/ConnectionBanner';
import Toaster from '@/components/common/Toaster';

export default function App() {
  return (
    <>
      <ConnectionBanner />
      <AppErrorBoundary>
        <AppRoutes />
      </AppErrorBoundary>
      <Toaster />
    </>
  );
}

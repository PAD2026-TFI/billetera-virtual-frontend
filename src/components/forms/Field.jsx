import { Label } from '@/components/ui/label';
import { fieldLabelClass } from './formStyles';

export default function Field({ id, label, error, hint, children }) {
  return (
    <div className="grid content-start gap-1.5">
      <Label htmlFor={id} className={fieldLabelClass}>{label}</Label>
      {children}
      {error ? (
        <p className="m-0 text-xs text-red-600 dark:text-rose-300">{error.message ?? error}</p>
      ) : (
        hint && <div className="text-xs text-[#8C87A3] dark:text-[#6B6485]">{hint}</div>
      )}
    </div>
  );
}

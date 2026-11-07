import { useNavigate } from 'react-router-dom';
import { UserRound } from 'lucide-react';
import { routes } from '@/lib/routes';
import { roundButtonClass, variants } from './buttonStyles';

export default function ProfileButton() {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate(routes.profile)} aria-label="Ver mi perfil" className={`${roundButtonClass} ${variants.surface}`}>
      <UserRound className="size-5" aria-hidden="true" />
    </button>
  );
}

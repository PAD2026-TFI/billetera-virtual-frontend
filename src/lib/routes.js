export const routes = {
  home: '/dashboard',
  movements: '/movimientos',
  transfer: '/transferir',
  topUp: '/cargar',
  pay: '/pagar',
  card: '/tarjeta',
  sandbox: '/sandbox',
  paymentReturn: '/payments/return',
  login: '/login',
  register: '/registro',
  forgotPassword: '/recuperar',
};

export function sectionFromPath(pathname) {
  const match = Object.entries(routes).find(([, path]) => path !== '/' && pathname.startsWith(path));
  return match ? match[0] : 'home';
}

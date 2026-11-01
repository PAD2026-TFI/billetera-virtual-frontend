export const routes = {
  home: '/dashboard',
  movements: '/movimientos',
  transfer: '/transferir',
  topUp: '/cargar',
  pay: '/pagar',
  card: '/tarjeta',
  login: '/',
};

export function sectionFromPath(pathname) {
  const match = Object.entries(routes).find(([, path]) => path !== '/' && pathname.startsWith(path));
  return match ? match[0] : 'home';
}

# padi. · Billetera virtual — Frontend

Frontend de **padi.** (*Pagos Al Día*), la billetera virtual del trabajo final de PAD 2026. Está hecho con React y Vite, con diseño mobile-first, modo claro y oscuro, y se comunica con el [backend en ASP.NET Core](https://github.com/PAD2026-TFI/billetera-virtual-backend).

> Entorno académico de pruebas: no se mueve dinero real.

## Tecnologías

- **React 19 + Vite** como base.
- **Tailwind CSS 4** y componentes de **shadcn/ui** y **Radix** para la interfaz, con íconos de **Lucide React**.
- **React Router 7** para las rutas, con rutas protegidas.
- **Zustand** para el estado global: sesión, billetera, avisos y tema.
- **React Hook Form + Zod** para los formularios y sus validaciones.
- **Motion** para las animaciones de las pantallas de ingreso.
- **Vitest + Testing Library** para los tests.

## Cómo levantarlo

Requisitos: **Node 22.12 o superior** (el CI usa Node 24).

1. Instalá las dependencias:

   ```sh
   npm ci
   ```

2. Activá el control de credenciales antes de cada commit (se hace una sola vez por clon):

   ```sh
   git config core.hooksPath .githooks
   ```

3. Copiá `.env.example` a `.env.local` y ajustá `VITE_API_BASE_URL` si tu backend usa otra dirección. Fuera de `localhost`, la API tiene que usar HTTPS.

4. Iniciá el servidor de desarrollo y abrí `http://localhost:5173`:

   ```sh
   npm run dev
   ```

Para que el login funcione con el backend real, la API tiene que permitir el origen `http://localhost:5173` en `Frontend:AllowedOrigins`, y su certificado HTTPS tiene que ser de confianza (`dotnet dev-certs https --trust`).

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en `http://localhost:5173`. |
| `npm test` | Corre todos los tests una vez. |
| `npm run build` | Genera la versión de producción en `dist/`. |
| `npm run preview` | Sirve la versión de producción para probarla. |
| `npm run check:credentials` | Revisa que los cambios preparados para commit no tengan claves ni archivos sensibles. |

## Pantallas

| Ruta | Pantalla | Acceso |
|---|---|---|
| `/login` | Inicio de sesión | Pública |
| `/registro` | Registro en 6 pasos: datos, correo, código, contraseña, DNI y validación facial | Pública |
| `/recuperar` | Recuperación de contraseña | Pública |
| `/dashboard` | Inicio: saldo, accesos rápidos, tarjeta, datos de la cuenta y últimos movimientos | Con sesión |
| `/movimientos` | Historial con filtros, resumen del período y comprobante | Con sesión |
| `/transferir` | Transferencia guiada en 4 pasos | Con sesión |
| `/cargar` | Carga de saldo | Con sesión |
| `/pagar` | Pago con QR | Con sesión |
| `/tarjeta` | Tarjeta virtual y pedido de tarjeta física | Con sesión |
| `/sandbox` | Pantalla de pruebas de carga real con Mercado Pago sandbox | Con sesión |

Si entrás a una pantalla con sesión sin haber iniciado sesión, la app te lleva al login y, después de ingresar, te devuelve a la pantalla que pediste. Mercado Pago vuelve a `/payments/return`, que redirige a `/sandbox`.

## Datos reales y simulados

Las pantallas se construyen primero con **datos simulados** y se conectan al backend al final (tarea FE-INT-01), según las reglas del proyecto.

- **Con el backend real:** el inicio de sesión y la pantalla `/sandbox`.
- **Simulados:** el registro, el inicio, los movimientos, las transferencias, la carga, el pago con QR y la tarjeta. Los datos de prueba están en `src/services/mocks/` y el estado en `src/store/`. Las transferencias simuladas respetan la clave de idempotencia, igual que el backend.
- **Pendiente:** si el backend no responde, el inicio de sesión crea una sesión de prueba con cualquier correo. Sirve para mostrar la app sin backend, pero hay que quitarlo antes de la entrega final.

## Estructura

```text
src/
├── pages/            Una pantalla por ruta
├── components/
│   ├── auth/         Login, registro, recuperación y su diseño
│   ├── common/       Avisos, banner de conexión, pantalla de error, botón de tema
│   ├── dashboard/    Piezas del inicio
│   ├── movements/    Historial y comprobante
│   ├── transfer/     Pasos de la transferencia
│   ├── routing/      Guardias de rutas
│   ├── layout/       Estructura con menú lateral y barra inferior
│   ├── forms/        Campos y estilos compartidos de formularios
│   └── ui/           Componentes base (shadcn/ui)
├── services/
│   ├── api.js        Cliente HTTP: token, errores del backend y reintentos
│   └── mocks/        Datos y operaciones simuladas
├── store/            Estado global con Zustand
├── lib/              Funciones puras: formatos, dinero, movimientos y rutas
└── AppRoutes.jsx     Todas las rutas de la app
docs/
├── frontend-tasks.md Plan de tareas con el detalle de cada pantalla
└── ai-guidelines.md  Reglas de diseño y de código del proyecto
```

## Seguridad

- **Sesión solo en memoria:** el token nunca se guarda en el navegador, así que al recargar la página hay que volver a iniciar sesión.
- **Errores en un solo lugar:** `src/services/api.js` agrega el token a cada pedido y maneja los errores del backend. Ante un 401 cierra la sesión, ante un 403 muestra un aviso, y ante un error del servidor o sin conexión muestra un banner con "Reintentar".
- **Nada de claves en el repo:** no van claves de Mercado Pago en variables `VITE_*`, en el navegador ni en Git. El control de credenciales del paso 2 bloquea los commits que las incluyan.
- **Cargas con Mercado Pago (`/sandbox`):**
  - Solo se abren enlaces HTTPS del checkout sandbox.
  - En `sessionStorage` se guarda únicamente la clave, el importe y el identificador de la carga, para poder recuperarla si se pierde una respuesta.
  - El regreso desde Mercado Pago no confirma el pago: el saldo se acredita recién cuando el backend lo verifica.

## Tests

```sh
npm test
```

- Los tests fijan la zona horaria de Argentina para que las fechas den igual en cualquier máquina y en el CI.
- El CI de GitHub corre `npm ci`, `npm test` y `npm run build` en cada push y en cada pull request a `dev`, `develop` y `main`.

## Cómo trabajar

- **Ramas:** cada tarea va en su rama, que sale de `dev` y se llama `feature/<TAREA>-<descripcion>` (por ejemplo, `feature/US-FE-05-transfers`). Se integra a `dev` con un pull request.
- **Commits:** en español con [Conventional Commits](https://www.conventionalcommits.org/es/) (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
- **Reglas del código:**
  - Nombres de archivos, carpetas y variables en inglés; todos los textos que ve el usuario en español de Argentina.
  - Sin comentarios en el código y sin emojis.
  - Montos, fechas, CVU y alias siempre con `font-mono`.
  - El detalle completo está en [`docs/ai-guidelines.md`](docs/ai-guidelines.md).
- **Qué falta hacer:** está en [`docs/frontend-tasks.md`](docs/frontend-tasks.md).
- **Despliegue:** el servidor estático tiene que devolver `index.html` en todas las rutas de navegación, para que funcionen al recargar.

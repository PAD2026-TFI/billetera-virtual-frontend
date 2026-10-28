# Mi billetera · Flujo de pagos sandbox

Desarrollo una interfaz mínima en React y Vite para probar el Incremento 3 del backend. Puedo registrarme, iniciar sesión, crear mi billetera, consultar saldo y movimientos, preparar una carga de saldo y consultar su resultado. Dejo el diseño final y las demás pantallas para los siguientes cambios.

## Ejecución

Uso Node 24 y el backend de la rama `feature/INC-003-pagos-mercadopago`.

```sh
npm ci
```

Copio `.env.example` a `.env.local` y ajusto VITE_API_BASE_URL si mi API usa otra URL. La API necesita permitir mi origen exacto en Frontend:AllowedOrigins; para Vite local uso `http://localhost:5173`. Primero confío el certificado HTTPS del backend con `dotnet dev-certs https --trust` cuando mi plataforma lo permite.

```sh
npm run dev
```

Abro `http://localhost:5173`. Creo una cuenta o ingreso con una existente, creo mi billetera si falta y preparo una carga. Abro el checkout de prueba en otra pestaña y regreso para consultar el resultado. Nunca interpreto los parámetros de retorno del navegador como confirmación del pago.

Para habilitar el checkout necesito configurar la aplicación sandbox, el vendedor de prueba, el secreto de Webhooks y una URL HTTPS pública en el backend. Consulto su README para esa configuración. Mientras Payments:Enabled sea false, puedo usar identidad y billetera y veo que las cargas todavía no están disponibles.

## Seguridad y reintentos

Mantengo el JWT únicamente en memoria y vuelvo a iniciar sesión después de recargar. No guardo credenciales de Mercado Pago en variables VITE_*, en almacenamiento del navegador ni en Git.

Conservo en sessionStorage únicamente la clave, el importe y el identificador de la carga, separados por usuario. Si pierdo una respuesta recupero la misma intención con su clave. Para realizar otra operación uso Iniciar otra carga. Tras una aprobación confirmada por el backend, actualizo saldo e historial desde la API.

Sólo abro enlaces HTTPS del checkout sandbox de Mercado Pago. No capturo números de tarjeta ni CVV en formularios propios. Si una operación necesita revisión, conservo su referencia y evito volver a pagar sin verificarla.

## Verificación

```sh
npm test
npm run build
```

Pruebo importes, enlaces seguros, conservación de claves, respuesta perdida, recuperación tras recarga y actualización del saldo después de la aprobación. Estas pruebas usan respuestas controladas de la API; completo por separado el recorrido real frontend → backend → SQL → Mercado Pago sandbox antes de declarar terminado el incremento.

Para desplegar la SPA configuro el servidor estático para devolver index.html en las rutas de navegación. No habilito dinero real con esta configuración.

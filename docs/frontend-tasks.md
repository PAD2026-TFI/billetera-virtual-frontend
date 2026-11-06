# Plan de Tareas Frontend — Billetera Virtual (padi.)
## Especificación Detallada de Vistas, Componentes y Ergonomía Fintech

---

## 1. Lineamientos de Densidad Visual y Principios de Diseño

Para evitar que las vistas resulten desiertas o con aspecto de maqueta preliminar, cada pantalla debe respetar los siguientes estándares de **densidad informativa, jerarquía visual y ergonomía B2B/Fintech**:

1. **Enfoque Mobile-First con Escalado Progresivo**:
   - En móvil ($\le$ 480px), la navegación principal se ancla en la parte inferior (`backdrop-blur-lg`) y los elementos se apilan respetando áreas táctiles mínimas de 44px.
   - En tablet y desktop ($\ge$ 1024px), la interfaz aprovecha el ancho con paneles complementarios (resúmenes laterales, accesos rápidos, métricas de actividad y widgets de estado), impidiendo que una tarjeta o formulario quede aislado en el centro de un lienzo vacío.
2. **Arquitectura de Superficies y Elevación (Identidad padi.)**:
   - **Lienzo Base**: Modo Oscuro OLED `#090613` / Modo Claro `#EFEBFB`.
   - **Tarjetas Principales (Nivel 1)**: Fondo `#140F24` (oscuro) / `#FFFFFF` (claro) con borde sutil `#261E3D` y esquinas redondeadas `rounded-[24px]`.
   - **Filas Interactivas e Inputs (Nivel 2)**: Fondo `#1E1735` (oscuro) / `#F3F1F9` (claro) con bordes `rounded-xl`.
   - **Acentos**: Violeta Eléctrico `#5B2EE0` con halo difuso `shadow-[0_0_25px_rgba(91,46,224,0.35)]` y Dorado `#FFD54A` para badges y llamadas a la acción primarias.
3. **Manejo Integral de Estados**:
   - Cada vista debe contemplar 4 estados visuales explícitos: **Carga** (esqueletos `Skeleton` animados con la silueta real del componente), **Vacío / Empty State** (icono de Lucide React, texto explicativo y botón de acción), **Error** (banner o toast contextual con opción de reintentar) y **Datos Activos**.
4. **Tipografía y Formato Obligatorio**:
   - `Poppins` para branding y encabezados destacados.
   - Tipografía monoespaciada (`font-mono`) mandatoria para: cifras monetarias (`$ 1.250.000,00`), CVU/Alias, fechas (`DD/MM/AAAA HH:mm`), UUIDs y números de tarjeta.
   - Prohibición absoluta de emojis; uso exclusivo de iconos de **Lucide React**.

---

## 2. Desglose Detallado de Tareas por Incremento

### Incremento 0 — Entorno, Base Visual y Despliegue

#### `FE-001`: Configuración de Arquitectura Base, Design System y Shell de Navegación
- **Historia de Usuario**:
  - **Como** desarrollador del equipo,
  - **Quiero** disponer de la estructura base del frontend con Vite, React, Tailwind CSS, shadcn/ui y soporte de modo claro/oscuro (Identidad padi.),
  - **Para** comenzar a construir las pantallas sobre un sistema de diseño consistente, accesible y mobile-first.
- **Componentes y Elementos de la Vista**:
  - **Cabecera Global (`AppHeader`)**:
    - Isotipo y wordmark `padi.` con el punto dorado característico (`#FFD54A`).
    - Badge de estado de conexión ("En línea" con punto verde esmeralda parpadeante `animate-pulse`).
    - Alternador de tema claro/oscuro con microtransición suave.
    - Botón de notificaciones con badge numérico flotante.
    - Avatar del usuario con iniciales y menú desplegable para ver perfil o cerrar sesión.
  - **Barra de Navegación Móvil Inferior (`MobileNavbar`)**:
    - Contenedor fijo inferior con desenfoque de fondo (`bg-[#0E0A1A]/85 backdrop-blur-lg border-t border-[#261E3D]`).
    - Cuatro accesos principales con iconos de Lucide React: Inicio (`LayoutDashboard`), Movimientos (`ReceiptText`), Tarjeta (`CreditCard`) y Perfil (`User`).
    - Botón flotante central elevado tipo FAB (Floating Action Button) en violeta eléctrico o dorado para operaciones inmediatas (`Plus` / `ArrowLeftRight`).
  - **Barra Lateral Adaptativa para Desktop (`DesktopSidebar`)**:
    - En pantallas grandes, panel lateral izquierdo que contiene el menú principal, acceso rápido al saldo resumido y atajos de soporte.
- **Criterios de Aceptación**:
  - Configuración de variables semánticas en `src/index.css` bajo la clase `.dark`.
  - Componentes primitivos listos en `@/components/ui/` (`Button` en píldora `rounded-full`, `Input` `rounded-xl`, `Card` `rounded-[24px]`, `Badge`, `Skeleton`, `Tooltip`).
  - Enrutamiento con `react-router-dom` distinguiendo rutas públicas y privadas.

#### `FE-002`: Dockerización del Proyecto Frontend
- **Historia de Usuario**:
  - **Como** desarrollador y responsable de despliegue,
  - **Quiero** disponer de una imagen Docker reproducible y optimizada para empaquetar el frontend con un servidor web liviano,
  - **Para** ejecutar la aplicación de forma idéntica en cualquier entorno y facilitar la integración con Docker Compose.
- **Componentes y Elementos de Configuración**:
  - **`Dockerfile` Multi-Stage**:
    - Etapa 1 (`build`): Imagen base `node:22-alpine`, copia de archivos de dependencia, instalación limpia (`npm ci`) y empaquetado optimizado con Vite (`npm run build`).
    - Etapa 2 (`production`): Imagen base `nginx:alpine` ligera y sin dependencias de Node en runtime, copiando únicamente la carpeta `dist/` a `/usr/share/nginx/html`.
  - **`nginx.conf` Especializado para SPA**:
    - Regla de enrutamiento client-side: `try_files $uri $uri/ /index.html;` para evitar errores 404 al refrescar rutas de React Router.
    - Compresión gzip activada para archivos `.js`, `.css`, `.svg` y `.json`.
    - Cabeceras de seguridad estrictas: `X-Frame-Options DENY`, `X-Content-Type-Options nosniff`, `Referrer-Policy strict-origin-when-cross-origin`.
    - Caché inmutable (`Cache-Control: public, max-age=31536000, immutable`) para `/assets/*` y `Cache-Control: no-cache` para `index.html`.
  - **`.dockerignore`**: Exclusión de `node_modules`, `.git`, `.env*`, `dist` y reportes temporales.
  - **`docker-compose.yml`**: Definición del servicio `frontend` con mapeo de puertos (`80:80` o `3000:80`) y paso de variables de entorno (`VITE_API_BASE_URL`).

---

### Incremento 1 — Identidad y Seguridad

#### `US-FE-01`: Formulario de Registro con Validaciones, Onboarding y Feedback Visual
- **Historia de Usuario**:
  - **Como** usuario nuevo,
  - **Quiero** contar con un formulario de registro interactivo con validaciones en tiempo real y guía visual,
  - **Para** ingresar mis datos correctamente y abrir mi cuenta de forma ágil y segura.
- **Componentes y Elementos de la Vista (`/registro`)**:
  - **Encabezado Motivacional**: Título institucional `Creá tu cuenta en padi.` con subtítulo sobre infraestructura financiera ágil.
  - **Campos de Entrada en Grilla Responsiva**:
    - Nombre y Apellido con icono `User`.
    - Correo Electrónico con icono `Mail` y validación de sintaxis en tiempo real.
    - Contraseña con icono `Lock` y botón de alternancia de visibilidad `Eye` / `EyeOff`.
    - Confirmación de contraseña con verificación síncrona de coincidencia.
  - **Medidor Visual de Fortaleza de Contraseña (`PasswordStrengthMeter`)**:
    - Barra segmentada interactiva de 4 niveles con código de color dinámico (Débil, Regular, Buena, Excelente).
    - Lista de requisitos en checklist con iconos reactivos (`CheckCircle2` en verde esmeralda y `Circle` en gris tenue): mínimo 8 caracteres, al menos un número y una mayúscula.
  - **Check de Términos y Condiciones**: Checkbox estilizado con enlace a modal de términos legales y política de privacidad.
  - **Panel Lateral Informativo (en Desktop)**:
    - Tarjeta ilustrativa con los 3 beneficios del ecosistema: transferencias instantáneas 24/7, cobros omnicanal con QR y tarjeta física internacional.
  - **Acción y Feedback**:
    - Botón primario en píldora `Crear cuenta` con estado deshabilitado reactivo si el formulario no es válido.
    - Spinner `Loader2` animado durante el envío.
    - Enlace inferior hacia la vista de inicio de sesión: `¿Ya tenés una cuenta? Iniciá sesión`.

#### `US-FE-02`: Inicio de Sesión, Sesión en Memoria y Atajos de Sandbox
- **Historia de Usuario**:
  - **Como** usuario registrado o evaluador del sistema,
  - **Quiero** ingresar mis credenciales de forma sencilla o seleccionar cuentas de prueba preconfiguradas,
  - **Para** acceder a las funcionalidades protegidas de la billetera sin fricciones.
- **Componentes y Elementos de la Vista (`/login`)**:
  - **Tarjeta Central Elevada (`#140F24`)**: Contenedor con borde tenue `#261E3D` y resplandor violeta en modo oscuro.
  - **Formulario de Credenciales**:
    - Campo de Correo Electrónico y Contraseña con iconos de Lucide React y mensajes de error inline.
    - Enlace de recuperación: `¿Olvidaste tu contraseña?` que abre un diálogo o vista de asistencia.
    - Opción `Recordar correo` mediante checkbox estilizado.
  - **Módulo de Cuentas de Demostración (`DemoCredentialsCard`)**:
    - Sección desplegable o cuadrícula de píldoras con credenciales rápidas de prueba:
      - *Usuario Particular* (`juan.perez@padi.com`)
      - *Comercio B2B* (`pagos@techstore.com`)
      - *Usuario Nuevo (Sin Billetera)* para probar flujos de activación.
    - Un clic en cualquiera de las píldoras rellena automáticamente los campos del formulario.
  - **Footer de Seguridad Institucional**: Badges de certificación técnica ("Cifrado TLS 1.3", "Sesión segura en memoria").

#### `FE-003`: Middleware y Guardias para Manejo de Rutas Protegidas
- **Historia de Usuario**:
  - **Como** usuario de la plataforma,
  - **Quiero** que el sistema restrinja la navegación según mi estado de autenticación y permisos,
  - **Para** proteger mis datos financieros y redirigirme de forma transparente al iniciar sesión.
- **Componentes y Lógica de Implementación**:
  - **Componente de Guardia Privada (`ProtectedRoute`)**:
    - Verifica el estado de autenticación en Zustand (`useAuthStore`).
    - Si el token no existe o expiró, redirige a `/login` preservando la ruta solicitada en `location.state.from`.
    - Muestra un esqueleto de carga de pantalla completa (`FullScreenSpinner`) durante la hidratación de sesión para evitar parpadeos visuales (*flash of unauthenticated content*).
  - **Componente de Guardia Pública (`PublicOnlyRoute`)**:
    - Impide que usuarios ya autenticados ingresen a `/login` o `/registro`, redirigiéndolos de forma automática al `/dashboard`.
  - **Redirección Post-Login**: Al iniciar sesión con éxito, redirige automáticamente a la URL guardada en `from` o al `/dashboard` por defecto.

#### `FE-004`: Middleware e Interceptores para Control Centralizado de Errores
- **Historia de Usuario**:
  - **Como** desarrollador del equipo,
  - **Quiero** un middleware centralizado para captura de excepciones y tratamiento unificado de respuestas de error de la API,
  - **Para** evitar caídas de la aplicación y presentar advertencias claras y consistentes al usuario.
- **Componentes y Lógica de Implementación**:
  - **`ErrorBoundary` Global y de Ruta (React)**:
    - Captura excepciones inesperadas en el ciclo de renderizado.
    - Presenta una pantalla de contingencia con estética padi.: icono de advertencia `AlertTriangle`, mensaje comprensible en español ("Algo no salió como esperábamos"), código de correlación para soporte y botón `Reintentar` o `Volver al inicio`.
  - **Interceptor de Red en `src/services/api.js`**:
    - Intercepta todas las peticiones salientes inyectando `Authorization: Bearer <token>`.
    - Parsea errores RFC 7807 (`ProblemDetails`) extrayendo mensajes legibles.
    - Tratamiento de `401 Unauthorized`: Dispara el reinicio automático del almacén de Zustand y redirige a login.
    - Tratamiento de `403 Forbidden`: Muestra toast de permisos insuficientes.
    - Tratamiento de `422 Unprocessable Entity`: Formatea y transmite los errores de validación a los formularios activos.
    - Tratamiento de `500 / 503 / Offline`: Dispara un banner flotante superior indicando problemas de red o mantenimiento del servidor con botón de reintento.
  - **Sistema de Feedback Visual**: Notificaciones flotantes tipo Toast (usando componentes Radix/shadcn) con temporizador automático y botón de cierre.

---

### Incremento 2 — Billetera, Saldos y Transferencias

#### `US-FE-03`: Dashboard Principal (Panel Financiero Integral)
- **Historia de Usuario**:
  - **Como** usuario autenticado con billetera,
  - **Quiero** disponer de un panel principal con la visualización de mi saldo, accesos rápidos, tarjeta virtual y datos de cuenta,
  - **Para** consultar mi disponibilidad financiera y operar de forma ágil desde cualquier dispositivo.
- **Componentes y Elementos de la Vista (`/dashboard`)**:
  - **Saludo y Encabezado de Usuario**:
    - Saludo personalizado dinámico según la hora del día ("Buenas tardes, Juan").
    - Badge semántico con el estado de la billetera: "Cuenta Activa" (verde esmeralda) o "En Verificación".
  - **Tarjeta Hero de Balance Principal (`HeroBalanceCard`)**:
    - Opciones de estilo: gradiente irisado cálido o midnight profundo con halo violeta `#5B2EE0`.
    - Cifra principal de saldo en pesos argentinos (`$ 1.250.000,00` con `font-mono` en 32px a 36px bold).
    - Botón de alternancia de visibilidad `Eye` / `EyeOff` para ocultar saldos en lugares públicos.
    - Pill de variación mensual: indicador porcentual verde esmeralda con icono `TrendingUp` (`+12.4% este mes`).
    - Desglose secundario: saldo disponible vs. saldo en retención (si aplica).
  - **Botonera de Acciones Rápidas en Píldora (`QuickActionsRow`)**:
    - Botón primario sólido en píldora: `Ingresar dinero` con icono `ArrowDownLeft`.
    - Botón secundario contorneado en píldora: `Transferir` con icono `ArrowUpRight`.
    - Botón complementario: `Cobrar con QR` con icono `QrCode`.
  - **Visualización de Tarjeta Virtual Apilada (`VirtualCardStack`)**:
    - Representación gráfica de la tarjeta virtual en gradiente violeta oscuro con textura sutil.
    - Chip EMV metálico simulado, logotipo de marca (Mastercard/Visa), numeración enmascarada (`•••• 4589` en `font-mono`) y fecha de caducidad.
    - Botón directo para "Ver datos completos" o "Pausar tarjeta".
  - **Módulo de Datos de Cuenta (Billetera)**:
    - Tarjeta compacta con CVU (22 dígitos) y Alias institucional (`juan.perez.padi`).
    - Botón táctil con icono `Copy` que copia al portapapeles y despliega confirmación visual ("Copiado al portapapeles").
    - Botón para desplegar código QR propio de recepción de transferencias.
  - **Widgets de Métricas Mensuales (en Desktop y Tablet)**:
    - Dos mini-cards estadísticas: "Ingresos del mes: +$ 450.000,00" y "Gastos del mes: -$ 180.200,00".
    - Gráfico lineal minimalista de tendencia de saldo en los últimos 7 días.
  - **Módulo de Contactos Frecuentes (`FrequentContactsRow`)**:
    - Carrusel horizontal deslizable con avatares redondeados de destinatarios recientes (`Carla M.`, `Marcos G.`, `Tech Store SRL`) permitiendo iniciar una transferencia con un solo toque.
  - **Previsualización de Últimos Movimientos**:
    - Lista de las últimas 4 operaciones con acceso directo `Ver todo el historial`.

#### `US-FE-04`: Historial de Movimientos, Filtros y Comprobantes Detallados
- **Historia de Usuario**:
  - **Como** usuario de la billetera,
  - **Quiero** visualizar el listado cronológico de mis transacciones con filtros por tipo, fecha y comprobantes completos,
  - **Para** llevar un control exhaustivo de mis movimientos financieros.
- **Componentes y Elementos de la Vista (`/movimientos`)**:
  - **Barra de Búsqueda y Filtros Multifacéticos**:
    - Input de búsqueda con icono `Search` para filtrar por nombre de contraparte, concepto o ID de operación.
    - Barra de píldoras de filtrado rápido: `Todos`, `Ingresos`, `Egresos`, `Cobros QR`.
    - Selector desplegable de rango de fechas: `Hoy`, `Últimos 7 días`, `Este mes`, `Rango personalizado`.
  - **Resumen Financiero del Período Filtrado**:
    - Barra resumen que calcula en tiempo real los totales del filtro actual ("Ingresos: $ 620.000,00 | Egresos: $ 145.000,00 | Balance Neto: +$ 475.000,00").
  - **Lista Agrupada por Fechas (`MovementsList`)**:
    - Encabezados de grupo temporal claros ("Hoy", "Ayer", "28 de Octubre 2026").
    - Fila de transacción con diseño redondeado de alta legibilidad:
      - Icono de categoría semántico (`ArrowDownLeft` para crédito, `ArrowUpRight` para débito, `Store` para comercio).
      - Título del destinatario u origen y subtítulo con la hora y método ("Transferencia inmediata", "Carga en sandbox").
      - Importe en `font-mono` resaltado en verde esmeralda (`+$ 15.000,00`) o blanco/rojo (`-$ 4.200,00`).
      - Badge de estado de la operación (`Completado`, `Pendiente`, `Fallido`).
  - **Modal / Bottom Sheet de Comprobante Oficial (`MovementReceiptModal`)**:
    - Encabezado con icono de confirmación `CheckCircle2` y monto transferido.
    - Identificador único de transacción (UUID) en `font-mono` con botón de copiado.
    - Detalle de titular emisor y receptor con sus respectivos CUIT/CUIL.
    - Fecha y hora exacta de imputación en formato argentino (`DD/MM/AAAA HH:mm:ss`).
    - Saldo posterior registrado en el libro mayor (`balanceAfter`).
    - Botones de acción: `Descargar comprobante en PDF`, `Compartir comprobante` y `Repetir transferencia`.
  - **Estado Vacío Enriquecido (`EmptyState`)**:
    - Si no hay resultados para el filtro seleccionado: ilustración/icono `Receipt`, mensaje explicativo amigable ("No se encontraron movimientos para los filtros seleccionados") y botón para limpiar los filtros.

#### `US-FE-05`: Flujo Guiado de Transferencias con Idempotencia y Contactos
- **Historia de Usuario**:
  - **Como** usuario con fondos en mi billetera,
  - **Quiero** transferir dinero indicando la billetera de destino y el importe mediante un flujo guiado y seguro,
  - **Para** enviar dinero a otro usuario de forma inmediata y sin riesgo de duplicaciones.
- **Componentes y Elementos de la Vista (`/transferir`)**:
  - **Barra de Progreso / Stepper Guiado**:
    - Pasos visibles: `1. Destinatario` $\rightarrow$ `2. Importe` $\rightarrow$ `3. Confirmación` $\rightarrow$ `4. Comprobante`.
  - **Paso 1: Búsqueda y Validación de Destinatario**:
    - Pestañas entre `Contactos Frecuentes` y `Nuevo Destinatario`.
    - Input para ingresar CVU, CBU o Alias.
    - Validación asíncrona de titularidad: al completar el dato, se despliega una tarjeta de confirmación del destinatario con su Nombre completo, CUIT (`XX-XXXXXXXX-X` en `font-mono`) y Entidad receptora, impidiendo continuar si el destinatario es la propia cuenta.
  - **Paso 2: Entrada Numérica y Ergonomía Monetaria**:
    - Campo de importe en gran tamaño con signo `$` fijo y formateo dinámico con comas y puntos.
    - Selector de montos preconfigurados en píldoras: `$ 5.000`, `$ 10.000`, `$ 20.000`, `$ 50.000` y `Transferir todo el saldo`.
    - Indicador en tiempo real del saldo disponible y cálculo del saldo remanente posterior a la operación.
    - Alerta inline preventiva si el importe supera el saldo disponible o excede el límite máximo por transacción (\$ 780.400,00).
    - Selector opcional de motivo de transferencia (Varios, Alquiler, Factura, Servicios).
  - **Paso 3: Pantalla de Revisión Previa (Confirmación)**:
    - Tarjeta resumen con todos los datos consolidados: emisor, receptor, importe, comisión ($ 0,00) y acreditación inmediata.
    - Generación interna de cabecera `Idempotency-Key` (UUID v4) en memoria.
    - Botón de confirmación con estado de carga `Loader2` y bloqueo automático para evitar solicitudes duplicadas por doble pulsación.
  - **Paso 4: Comprobante de Acreditación Inmediata**:
    - Pantalla de éxito con código de operación, actualización reactiva del saldo en el store de Zustand y botones para `Realizar otra transferencia` o `Volver al inicio`.

---

### Incremento 3 — Pasarela de Pagos (WaaS y Checkout Omnicanal)

#### `US-FE-06`: Módulo de Recarga, Generación de Cobros y Web Checkout UI
- **Historia de Usuario**:
  - **Como** usuario o comercio,
  - **Quiero** generar links de pago y códigos QR para recibir cobros, así como disponer de una interfaz de checkout responsiva para abonar con saldo o tarjeta,
  - **Para** operar dentro del ecosistema B2B (Wallet as a Service) y liquidar pagos de forma instantánea.
- **Componentes y Elementos de la Vista**:
  - **Sub-módulo A: Panel de Cobros del Comercio (`/cobrar`)**:
    - Formulario para emitir una nueva orden: importe a cobrar, concepto/título del producto y tiempo de vencimiento (TTL: 15 min, 1 hora, 24 horas).
    - Tarjeta de enlace generado con botón táctil para copiar la URL pública (`checkoutUrl`).
    - Renderizador interactivo del Código QR en formato SVG (`image/svg+xml`):
      - Visualización nítida y redimensionable en pantalla.
      - Botón `Descargar QR para imprimir` (para colocar en mostradores comerciales) y botón `Compartir link`.
    - Historial de links de pago emitidos con estado en tiempo real: `Activo`, `Pagado`, `Expirado`.
  - **Sub-módulo B: Web Checkout UI para el Pagador (`/checkout?token=...`)**:
    - Vista pública responsive adaptada a cualquier dispositivo.
    - **Cabecera del Comercio**: Nombre de la empresa emisora ("Tech Store SRL"), logotipo y badge de "Pago Seguro Protegido por padi.".
    - **Tarjeta de Desglose de Pago**:
      - Concepto de la orden, subtotal, impuestos aplicables y total final a pagar en `font-mono`.
      - Reloj con temporizador dinámico de cuenta regresiva ("Esta orden expira en 14:35 min").
    - **Selector de Medio de Pago**:
      - **Pestaña 1: Saldo de Billetera padi.**: Autenticación rápida de usuario y confirmación de débito directo en 1 solo clic si dispone de fondos suficientes.
      - **Pestaña 2: Tarjetas de Débito / Crédito (Simulador Financiero)**:
        - **Visualizador Interactivo de Tarjeta Plástica**: Componente visual que reproduce una tarjeta física en pantalla; conforme el usuario tipea el número, nombre y fecha, los datos se reflejan en tiempo real sobre el plástico, volteándose con animación 3D al enfocar el campo de código de seguridad (CVV).
        - Formateo automático de espacios en el número de tarjeta (4-4-4-4) y detección automática de la franquicia (Visa, Mastercard, Cabal, American Express).
        - Validación algorítmica de Luhn en cliente y verificación de fecha de expiración.
      - **Banners de Atajo para Sandbox de Desarrollo**:
        - Módulo desplegable con números de tarjeta de prueba para simulación rápida:
          - *Aprobada*: terminación estándar con CVV `123`.
          - *Fondos Insuficientes*: CVV `999` o terminación `0000` (dispara error `422`).
          - *Tarjeta Bloqueada*: terminación `9999` (dispara error `422`).
    - **Pantalla de Resultado del Pago**:
      - Si fue aprobado: comprobante digital con número de autorización, fecha y desglose.
      - Si fue rechazado: explicación clara de la causa (fondos insuficientes, tarjeta rechazada) y botón para intentar con otro medio de pago sin perder la sesión.

---

### Incremento 4 — Tarjeta Física y Logística de Entrega

#### `US-FE-07`: Solicitud de Tarjeta Física y Normalización Geográfica
- **Historia de Usuario**:
  - **Como** usuario de la billetera,
  - **Quiero** solicitar una tarjeta de débito física ingresando mi dirección validada geográficamente,
  - **Para** recibir el plástico en mi domicilio sin inconvenientes de entrega.
- **Componentes y Elementos de la Vista (`/tarjeta/solicitar`)**:
  - **Hero de Presentación del Plástico**:
    - Render de alta fidelidad de la tarjeta física padi.: acabado negro mate, bordes violeta brillante y chip EMV dorado.
    - Lista de beneficios de la tarjeta: compras contactless internacionales, extracciones en cajeros automáticos, sin costo de emisión ni mantenimiento.
  - **Formulario de Domicilio Estructurado**:
    - Calle, Número/Altura, Piso, Departamento/Oficina.
    - Código Postal, Localidad y Provincia mediante selector desplegable.
    - Campo adicional: "Indicaciones especiales para el repartidor" ("Casa con rejas negras", "Timbre 4B").
  - **Módulo de Asistencia Geográfica y Normalización (`GeoValidationCard`)**:
    - Al ingresar el domicilio, el sistema consume el servicio de geocodificación y presenta una tarjeta de confirmación de dirección estandarizada.
    - Muestra las coordenadas geográficas obtenidas (`Latitud: -34.6037, Longitud: -58.3816` en `font-mono`).
    - Mapa o pin interactivo que confirma visualmente la ubicación aproximada del domicilio de entrega.
    - Manejo de direcciones ambiguas: lista de sugerencias para que el usuario seleccione la opción exacta antes de confirmar.
  - **Resumen Previo y Confirmación**:
    - Desglose del envío: Costo del plástico: `$ 0,00 (Bonificado)`, Costo de envío: `$ 0,00`, Plazo estimado: `3 a 5 días hábiles`.
    - Botón primario en píldora: `Confirmar solicitud de tarjeta`.

#### `US-FE-08`: Centro de Tarjetas y Seguimiento Visual de Entrega (Stepper de Envío)
- **Historia de Usuario**:
  - **Como** solicitante de una tarjeta física,
  - **Quiero** consultar una línea de tiempo interactiva con las etapas del envío y gestionar mi tarjeta,
  - **Para** saber exactamente cuándo llegará a mi domicilio y administrar su seguridad.
- **Componentes y Elementos de la Vista (`/tarjeta`)**:
  - **Línea de Tiempo Interactiva de Seguimiento Postal (`DeliveryTimelineStepper`)**:
    - Indicador vertical u horizontal con 4 hitos secuenciales:
      1. *Solicitud Confirmada*: fecha y hora de registro.
      2. *En Producción*: "Tu tarjeta física ha sido impresa y embalada de forma segura".
      3. *En Distribución*: "En poder de la empresa de logística" con número de seguimiento en `font-mono` y botón para copiar o acceder al tracking externo.
      4. *Entregada en Domicilio*: confirmación de recepción y habilitación del botón de activación.
  - **Tarjeta de Dirección de Entrega Asociada**:
    - Tarjeta resumen con la dirección validada, código postal y coordenadas registradas para el envío.
  - **Centro de Control de Seguridad de Tarjeta (Una vez activada)**:
    - Opciones con interruptores (`Switch`):
      - "Pausar tarjeta temporalmente" (bloqueo preventivo en caso de extravío).
      - "Compras internacionales" (activar/desactivar).
      - "Compras por internet" (activar/desactivar).
      - "Límite diario de extracción": control deslizante interactivo con visualización del importe en `font-mono`.
  - **Módulo de Soporte y Preguntas Frecuentes**:
    - Acordeón de dudas frecuentes: "¿Qué hago si el correo no me encuentra?", "¿Cómo activo el PIN de cajero?".
    - Botón de asistencia directa: `Contactar soporte sobre mi envío`.

---

### Fase Final — Integración Backend y Cierre de Hitos

#### `FE-INT-01`: Integración de Servicios HTTP con API ASP.NET Core
- **Historia de Usuario**:
  - **Como** equipo de desarrollo,
  - **Quiero** reemplazar los servicios mock por el cliente HTTP conectado a los endpoints reales de la API,
  - **Para** completar la aceptación integrada de punta a punta entre frontend y backend.
- **Componentes y Lógica de Implementación**:
  - **Cliente HTTP Centralizado (`src/services/api.js`)**:
    - Conexión con `VITE_API_BASE_URL`.
    - Inyección automática del header `Authorization: Bearer <token>` y del header `Idempotency-Key` en operaciones mutables de dinero (`POST /transfers`, `POST /checkout/pay`).
  - **Verificación de Hito H2**:
    - Prueba integrada entre dos usuarios simultáneos en sesiones distintas: consulta de saldo, transferencia entre ambos, actualización inmediata de saldos y persistencia en movimientos.
  - **Verificación de Hito H3**:
    - Prueba de flujo completo de pasarela propia: generación de link/QR por un comercio, pago desde el checkout con tarjeta simulada o saldo y acreditación instantánea en la billetera de destino.

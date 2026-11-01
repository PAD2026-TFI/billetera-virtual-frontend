# Plan de Tareas Frontend — Billetera Virtual

## Estrategia: UI-First (Mock Driven) y Mobile-First
1. **Enfoque Mobile-First**:
   - Todas las vistas, flujos e interacciones se diseñan y maquetan prioritariamente para pantallas móviles (resolución base de smartphone).
   - Componentes optimizados para uso táctil (áreas táctiles mínimas de 44px, barras de navegación inferior / drawer móvil, inputs accesibles y modales tipo bottom-sheet).
   - Escalado progresivo y adaptativo hacia tablets y pantallas de escritorio sin perder densidad de información.
2. **Fase 1 (Pantallas y Flujos)**: Se desarrollan todos los componentes, vistas y validaciones con datos simulados (mocks) y Zustand, asegurando una experiencia visual completa e interactiva antes de tocar red.
3. **Fase 2 (Integración Backend)**: Se reemplaza la capa de mocks por los servicios HTTP que consumen la API de ASP.NET Core una vez que las pantallas estén listas.

---

## 1. Configuración y Base Visual (Incremento 0)
- **`FE-001` Setup de Diseño, Modo Oscuro y Layout (Identidad padi. 2.0)**:
  - Consolidar la paleta dual: Modo Claro (Lienzo `#EFEBFB`, tarjetas blancas) y Modo Oscuro (Lienzo OLED `#090613`, tarjetas `#140F24`, acentos violeta brillante `#5B2EE0` y dorado `#FFD54A`).
  - Configurar soporte de Modo Oscuro por clase `.dark` en Tailwind v4 (`src/index.css`) con variables semánticas y selector/store de tema en Zustand.
  - Consolidar primitivos de `shadcn/ui` en `@/components/ui` adaptados a botones píldora (`rounded-full`), inputs con fondo tenue y bordes `rounded-xl`.
  - Implementar el layout principal (`AppLayout`) Mobile-First con barra de navegación inferior anclada con efecto blur (`backdrop-blur-lg`), botón de acción central y cabecera adaptable con alternador de tema.

---

## 2. Identidad y Seguridad (Incremento 1)
- **`US-FE-01` Formulario de Registro**:
  - Vista `/registro` con validaciones en tiempo real mediante `react-hook-form` y `zod`.
  - Validación de campos: nombre, apellido, email, contraseña y confirmación.
  - Adaptada para modo claro y oscuro con inputs y botones en píldora.
- **`US-FE-02` Inicio de Sesión y Sesión con Zustand**:
  - Vista `/login` con atajo para cargar credenciales de prueba.
  - Manejo de sesión y token exclusivamente en memoria con Zustand.
  - Enrutamiento protegido (`ProtectedRoute`) para restringir el acceso a vistas privadas.

---

## 3. Billetera y Operaciones (Incremento 2)
- **`US-FE-03` Dashboard   Principal (Inspirado en Mockups)**:
  - Vista `/dashboard`:
    - **Tarjeta Hero de Saldo**: Tarjeta con gradiente irisado/mesh (de cálido dorado a lavanda suave) en modo oscuro con texto de alto contraste, o tarjeta oscura con resplandor violeta y cifra en pesos argentinos (`font-mono`).
    - **Pares de Acciones Rápidas en Píldora**: Botón de recarga/ingreso en píldora sólida y botón de transferencia/retiro en píldora contorno (`Deposit` / `Withdraw`).
    - **Visualización de Tarjeta Virtual**: Tarjeta apilada con gradiente violeta, chip y numeración en `font-mono`.
    - **Datos de cuenta**: CVU/Alias con botón táctil para copiar al portapapeles.
- **`US-FE-04` Historial de Movimientos**:
  - Vista `/movimientos`: Filas de transacciones redondeadas de alta legibilidad inspiradas en los mockups, con badges semánticos (verde esmeralda para ingresos, violeta/rojo para egresos), filtros por tipo y modal con comprobante.
- **`US-FE-05` Envío de Transferencias**:
  - Vista `/transferir`: Flujo guiado con selector de destinatario, validación de saldo disponible e idempotencia simulada con confirmación en modal.

---

## 4. Pasarela de Pagos (Incremento 3)
- **`US-FE-06` Recarga de Fondos y Checkout**:
  - Vista `/pagos`: Formulario para solicitar recarga de saldo.
  - Generación simulada de Checkout con visualización de Código QR y Link de Pago.

---

## 5. Tarjeta Física y Geolocalización (Incremento 4)
- **`US-FE-07` Solicitud de Tarjeta**:
  - Vista `/tarjeta/solicitud`: Formulario de domicilio de entrega con integración de servicio de geolocalización para validación de dirección y coordenadas.
- **`US-FE-08` Seguimiento Visual**:
  - Componente de línea de tiempo (stepper) con el estado del trámite y envío postal (solicitada, en producción, enviada, entregada).

---

## 6. Conexión Backend (Fase Final)
- **`FE-INT-01` Integración con ASP.NET Core**:
  - Reemplazo de servicios mock por cliente HTTP (`api.ts`) apuntando a `VITE_API_BASE_URL`.
  - Conexión de endpoints de Auth, Billetera, Transferencias, Pagos y Tarjetas.
  - Pruebas de aceptación integrada de punta a punta.

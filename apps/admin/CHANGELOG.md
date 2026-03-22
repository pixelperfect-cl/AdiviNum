# Changelog — AdiviNum Admin Panel

Todos los cambios importantes del panel de administración se documentan aquí.

---

## [1.0.0] — 2026-03-22

### 🆕 Nuevo
- **Stack moderno**: Tailwind CSS v4, React Query, Lucide Icons, React Hook Form, Zod.
- **Gestión de Usuarios** (Drawer lateral):
  - Abonar/debitar billeteras (Virtual y Fiat) con motivo registrado.
  - Fijar nivel manualmente o resetear a nivel 1 (borra todo el progreso).
  - Toggle de estado VIP/Premium.
  - Ban/Unban de usuarios.
  - Vista de saldos en la tabla de usuarios.
- **Modo Espectador GOD**:
  - Vista en vivo de partidas activas vía WebSocket.
  - Tableros duales mostrando intentos de ambos jugadores en tiempo real.
  - GOD Chat: enviar mensajes como admin visibles para ambos jugadores.
  - Cards de partidas en vivo con avatares, niveles, y timers.
- **Logros** (nueva página):
  - CRUD completo: crear, editar y eliminar logros.
  - Campos: clave, nombre, descripción, recompensa en monedas.
- **Configuración Global** (nueva página):
  - Parámetros del juego en formato clave-valor.
  - Saldo virtual inicial configurable (se aplica al registrar nuevos usuarios).
  - Tabla `SystemSetting` en la base de datos.
- **Gestión de Retiros**:
  - Aprobar o rechazar solicitudes de retiro.
  - Reembolso automático al rechazar.
  - Campo `status` en transacciones para tracking (PENDING/APPROVED/REJECTED).
- **Changelog** (nueva página):
  - Historial visual de cambios del admin panel.
  - Secciones codificadas por color.

### ♻️ Refactorizado
- Todas las páginas migradas a **React Query** (caching, loading states, invalidación automática).
- Emojis reemplazados por **Lucide React** icons en toda la navegación, tablas, y botones.
- `api.ts` extendido con todos los endpoints (wallet, level, config, achievements CRUD, settings, withdrawals).
- `Tournaments.tsx` y `Withdrawals.tsx` refactorizados con mutaciones React Query.
- `Dashboard.tsx` y `Matches.tsx` ahora usan `useQuery` en vez de `useEffect` manual.

### 🐛 Corregido
- **Proxy Vite** apuntaba al puerto 5555 (web app) en vez de 3000 (backend). Corregido.
- **Path rewrite** eliminado — NestJS usa prefijo `/api` global.

### 📋 Pendiente
- Más configuraciones globales (XP por nivel, comisiones, etc.).

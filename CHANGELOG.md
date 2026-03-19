# Changelog

## [1.0.2-BETA] — 2026-03-19

### 🔄 Reconexión a Partida

- **Reconexión automática** — Si refrescas la página durante una partida, el servidor detecta tu reconexión (30s de gracia) y restaura todo el estado del juego
- El servidor envía matchId, rol, oponente, secreto, historial completo de intentos y tiempos restantes
- El cliente restaura el gameStore y navega automáticamente a `/game`

### ⏰ Auto-Timeout en Turno

- **Timer servidor proactivo** — Cuando un jugador agota su tiempo, el servidor termina la partida automáticamente
- Ya no se queda pegado en "esperando turno del rival" si al oponente se le acaba el tiempo
- Timer se inicia en cada turno y se limpia en guess, surrender, game over o desconexión

### ⏱️ Selector de Tiempo

- **3, 5 o 10 minutos** — Los jugadores eligen el tiempo de partida al buscar match
- Solo emparejas con jugadores que eligieron el mismo tiempo
- Default: 5 minutos

### 🎮 NumPad Móvil

- **Teclado numérico en pantalla** — Reemplaza el teclado del teléfono para ingresar números
- Display visual de 4 dígitos, dígitos usados deshabilitados, no permite 0 como primer dígito
- Integrado en GamePage y PracticePage

### 🎨 UI / Layout

- Layout de Práctica consistente con PvP (game-header-v2, barras de energía)
- Niveles en una sola fila en desktop (7 columnas)
- Play-layout al 100% de ancho en desktop

## [1.0.0-BETA] — 2026-03-17

### 🎮 Gameplay Core

- **Juego 1v1 de deducción numérica** — Famas & Toques (Bulls & Cows) con números de 4 dígitos sin repetir
- **Sistema de niveles** — 7 niveles con dígitos progresivos, apuestas escaladas y tiempos variables
- **Matchmaking por nivel** — Cola de matchmaking con búsqueda por nivel y apuesta
- **Turnos alternados** con timer circular animado por jugador
- **Sistema de revancha** — Post-partida rematch con voto de ambos jugadores
- **Modo Espectador** — Observar partidas en vivo con actualizaciones en tiempo real
- **Modo Práctica** — Jugar contra la CPU sin apuesta
- **Emojis/reacciones** rápidas durante la partida (10 reacciones con cooldown)
- **Revelación del número secreto** — Post-partida ambos jugadores ven los secretos

### 🏆 Sistema Competitivo

- **Rankings ELO** (Glicko-inspired) — 8 rangos desde Novato del Número hasta Supremo Adivinum
- **Ligas / Temporadas semanales** — 8 ligas vinculadas a ELO, promoción (top 10%), descenso (bottom 10%), recompensas por temporada
- **Logros** — Sistema de medallas y progresión
- **Torneos Single Elimination** — Bracket, inscripción con entry fee, distribución de premios
- **Torneos automáticos programados** — 3 templates:
  - 🏃 Torneo Diario Express (8 jugadores, 500 coins, 8PM UTC)
  - 🏆 Copa Semanal AdiviNum (16 jugadores, 1000 coins, sábados 6PM)
  - 🌙 Torneo Nocturno Free (8 jugadores, gratis, 2AM UTC)
- **Bracket visual** — Componente visual con rondas nombradas (Cuartos, Semifinal, Final)

### 👥 Social

- **Sistema de amigos** — Enviar/aceptar/rechazar/eliminar solicitudes, buscar jugadores
- **Retos directos** — Desafiar amigos vía WebSocket, match sin cola
- **Perfil de jugador** — Tabs: Datos Personales, Estadísticas, Billetera, Logros
- **Username editable** desde el perfil

### 💰 Economía

- **Billetera virtual** — Monedas virtuales (10,000 iniciales) y moneda real
- **Sistema de apuestas** — Hold → Settle con comisión del 5%
- **Pagos con MercadoPago** — Depositar/Retirar dinero real
- **Sistema de referidos** — Códigos de referido con bonos

### 🔔 Notificaciones

- **Push notifications via Expo** — Batching de 100, templates para:
  - Partida encontrada, es tu turno, resultado de partida
  - Depósito confirmado, torneo comenzando
  - Solicitud de amistad, amigo aceptado, reto recibido
  - Ascenso/descenso de liga

### 📱 Apps & Plataformas

- **Web App** (React + Vite) — SPA responsive
- **Mobile App** (React Native + Expo) — iOS & Android
- **Admin Panel** (React + Vite) — Dashboard, Users, Matches, Tournaments, Withdrawals

### 🛡️ Seguridad & Infraestructura

- **Autenticación Supabase** — Google Sign-In, JWT verification
- **Rate Limiting** — @nestjs/throttler con 60 req/min global
- **Validación de input** — PATCH /users/me con whitelist de campos
- **Conexión offline graceful** — Banner de estado, auto-reconnect WebSocket
- **WebSocket real-time** — Socket.IO con auth middleware

### 📊 Historial & Onboarding

- **Historial de partidas detallado** — Win rate, duración, digit boxes para secretos, timeline de intentos con turn numbers, tiempo usado por jugador
- **Onboarding tutorial** — 8 pasos guiados cubriendo reglas, Famas/Toques, ejemplo de jugada, turnos, ganar, apuestas
- **Skeleton loading** — Placeholders animados durante carga

### 🌐 Internacionalización

- **i18n con React Context** — `useI18n()` hook, 100+ claves traducidas
- **Idiomas:** Español 🇪🇸, English 🇺🇸
- **Auto-detección** del idioma del navegador
- **Persistencia** en localStorage

### 🏗️ Arquitectura

```
adivinum/                       (npm workspaces monorepo)
├── apps/
│   ├── server/                 NestJS + Prisma + Socket.IO
│   │   └── src/
│   │       ├── auth/           Supabase auth guard
│   │       ├── friends/        Friend requests system
│   │       ├── game/           Game gateway + service
│   │       ├── notification/   Expo push service
│   │       ├── payment/        MercadoPago integration
│   │       ├── prisma/         Database ORM
│   │       ├── ranking/        ELO + leaderboards
│   │       ├── redis/          Cache layer
│   │       ├── referral/       Referral codes
│   │       ├── tournament/     Tournaments + auto-scheduler
│   │       ├── users/          User CRUD + history
│   │       └── wallet/         Virtual & real currency
│   ├── web/                    React + Vite SPA
│   │   └── src/
│   │       ├── components/     Layout, Timer, Skeleton, Bracket, Onboarding
│   │       ├── i18n/           Translation system
│   │       ├── pages/          11 pages
│   │       ├── services/       API client, Socket client
│   │       └── stores/         Zustand (user, game state)
│   ├── admin/                  React + Vite admin panel
│   │   └── src/pages/          Dashboard, Users, Matches, Tournaments, Withdrawals
│   └── mobile/                 React Native + Expo
│       └── src/screens/        Game, Home, Ranking
├── packages/
│   └── shared/                 Types, Levels, Ranks, Leagues, Game Rules
└── docker-compose.yml          PostgreSQL + Redis
```

### Stack Tecnológico

| Layer | Technology |
|-------|-----------|
| Backend | NestJS, Prisma ORM, Socket.IO, PostgreSQL, Redis |
| Web Frontend | React 18, Vite, Zustand, CSS vanilla |
| Mobile | React Native, Expo |
| Admin | React, Vite |
| Auth | Supabase (Google Sign-In) |
| Payments | MercadoPago API |
| Push | Expo Push API |
| Shared | TypeScript package (types, levels, ranks, leagues) |
| Infra | Docker Compose, npm workspaces monorepo |

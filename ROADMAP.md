# AdiviNum — Roadmap de Mejoras

## 🎮 Gameplay & UX

### 1. Temporizador visual en tiempo real
- [ ] Countdown animado que decremente en vivo durante el turno del jugador
- [ ] Barra de progreso circular o lineal que muestre el tiempo restante
- [ ] Cambio de color cuando queda poco tiempo (< 30s → amarillo, < 10s → rojo)

### 2. Animaciones de turno
- [ ] Transición suave al cambiar de turno (slide o fade)
- [ ] Efecto "flip" al revelar resultados de Famas/Toques
- [ ] Animación de victoria/derrota en Game Over (confetti para victoria)

### 3. Sonidos
- [ ] Efecto al encontrar rival
- [ ] Sonido al enviar intento
- [ ] Sonido diferenciado por Famas vs Toques
- [ ] Música/efecto de victoria y derrota
- [ ] Toggle para habilitar/deshabilitar sonidos en perfil

### 4. Chat rápido in-game
- [ ] Panel de emojis predefinidos (👏 😤 🤔 🔥 😂 💪)
- [ ] Envío via WebSocket, visible para ambos jugadores
- [ ] Cooldown para evitar spam

### 5. Rematch (Revancha)
- [ ] Botón "Revancha" en pantalla de Game Over
- [ ] Invitación al rival via WebSocket
- [ ] Aceptar/rechazar revancha

### 6. Modo espectador
- [ ] Ver partidas activas de otros jugadores en vivo
- [ ] Lista de partidas en curso en el lobby
- [ ] Vista de solo lectura del tablero

---

## 📊 Estadísticas & Historial

### 7. Historial detallado
- [ ] Click en una partida del historial → vista detallada
- [ ] Mostrar todos los intentos de ambos jugadores
- [ ] Revelar secretos de ambos jugadores
- [ ] Tiempos usados por cada jugador

### 8. Gráfico de progreso
- [ ] Mini gráfico de ELO en el tiempo (últimas 20 partidas)
- [ ] Win rate acumulado en la página de perfil
- [ ] Estadísticas por nivel

### 9. Logros/Achievements
- [ ] Activar sistema de logros (modelo ya existe en Prisma)
- [ ] "Primera victoria", "Racha de 5", "Adivina en 3 intentos"
- [ ] Badges visibles en el perfil
- [ ] Notificación al desbloquear un logro

---

## 🏆 Competitivo & Social

### 10. Ranking funcional
- [ ] Conectar página de Ranking con endpoint del backend
- [ ] Top 10/50/100 jugadores por ELO
- [ ] Posición del jugador actual en el ranking
- [ ] Filtros por nivel o temporada

### 11. Torneos
- [ ] Flujo de torneos con brackets (modelo Tournament ya existe)
- [ ] Inscripción a torneos
- [ ] Brackets visuales con avance en tiempo real
- [ ] Premios en monedas al ganador

### 12. Sistema de amigos
- [ ] Agregar amigos por username
- [ ] Ver amigos en línea
- [ ] Invitar a partida directa (sin matchmaking)
- [ ] Lista de amigos en sidebar

### 13. Ligas por temporada
- [ ] Temporadas mensuales
- [ ] Rangos por ELO: Bronce, Plata, Oro, Platino, Diamante
- [ ] Icono de rango visible en perfil y partida
- [ ] Recompensas al final de temporada

---

## 💰 Economía

### 14. Tienda de avatares/temas
- [ ] Tienda con items comprables con monedas virtuales
- [ ] Avatares, temas de color, emojis de chat
- [ ] Inventario del jugador

### 15. Recompensa diaria
- [ ] Login bonus diario (monedas virtuales)
- [ ] Streak de días consecutivos → premio mayor
- [ ] UI de "reclamar recompensa" al entrar

### 16. Apuestas con monedas reales
- [ ] Flujo completo de apuesta con saldo FIAT
- [ ] Integración con pasarela de pago
- [ ] Retiro de ganancias

---

## 🔧 Técnico & Infraestructura

### 17. Reconexión a partida activa
- [ ] Detectar partida activa al reconectar WebSocket
- [ ] Restaurar estado del juego desde el servidor
- [ ] UI de "reconectando..." con spinner

### 18. Redis en producción
- [ ] Configurar Redis para matchmaking persistente
- [ ] Cola de matchmaking escalable
- [ ] Cache de sesiones

### 19. Firebase Auth real
- [ ] Conectar autenticación real con Google/email
- [ ] Registro de nuevos usuarios
- [ ] Recuperación de contraseña

### 20. Tests automatizados
- [ ] Tests unitarios para game engine (validateGuess, processGuess, isWinningGuess)
- [ ] Tests E2E para flujo completo de matchmaking
- [ ] CI/CD pipeline

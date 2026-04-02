# Flujo de Entrega de Cartones - Bingo App

## Resumen General

Los cartones se asignan a nivel de **Juego**, no de Ronda. El jugador selecciona sus cartones una vez al unirse al juego y puede cambiarlos entre rondas si lo desea.

---

## Parámetros de Configuración

| Parámetro | Descripción | Valor por defecto |
|-----------|-------------|-------------------|
| Tiempo de selección | Segundos para elegir cartones | 60s |
| Cartones a entregar | Cantidad de cartones que ve el jugador | 5 |
| Cartones a seleccionar | Máximo que puede elegir | 2 |

---

## Pantallas del Jugador

### Lista de Juegos
- Muestra todos los juegos programados
- Indica si el jugador ya está inscrito en cada juego
- El jugador puede estar inscrito en múltiples juegos

### Detalle del Juego
- Información del juego (nombre, fecha, rondas)
- Botón **"Mis Cartones"** (deshabilitado si no está inscrito)
- Botón **"Unirse"** / **"Desinscribirse"**

---

## Flujo Principal

### 1. Jugador se Une al Juego

```
[Lista de Juegos] → Toca "Unirse" → [Pantalla de Selección de Cartones]
```

1. El jugador toca "Unirse" en un juego
2. Se registra como participante
3. **Inmediatamente** va a la pantalla de selección de cartones

### 2. Selección de Cartones (Primera vez)

```
┌─────────────────────────────────┐
│  Selecciona tus cartones        │
│  Tiempo restante: 0:45          │
│  Seleccionados: 2/3             │
├─────────────────────────────────┤
│                                 │
│   [Confirmar Selección]         │
│        (deshabilitado si        │
│         no hay selección)       │
├─────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐│
│ │  1  │ │  2  │ │  3  │ │  4  ││
│ │  ✓  │ │  ✓  │ │     │ │     ││
│ └─────┘ └─────┘ └─────┘ └─────┘│
│       (deslizar horizontal)     │
└─────────────────────────────────┘
```

- **Mínimo**: 1 cartón
- **Máximo**: Según configuración (ej: 3)
- El temporizador corre desde que aparece la pantalla

### 3. Si el Tiempo se Agota

| Situación | Resultado |
|-----------|-----------|
| Primera selección (sin cartones previos) | Sistema asigna automáticamente el máximo permitido |
| Cambiando cartones (ya tenía) | Se mantienen los cartones anteriores |

### 4. Confirmación

```
┌─────────────────────────────────┐
│                                 │
│     ¡Cartones seleccionados!    │
│                                 │
│           [Aceptar]             │
│                                 │
└─────────────────────────────────┘
```

Después de aceptar → Vuelve a la **lista de juegos**

---

## Ver y Cambiar Cartones

### Pantalla "Mis Cartones" (después de seleccionar)

```
┌─────────────────────────────────┐
│  Mis Cartones                   │
├─────────────────────────────────┤
│                                 │
│      [Cambiar Cartones]         │
│   (deshabilitado durante ronda) │
│                                 │
├─────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐        │
│ │  1  │ │  2  │ │  3  │        │
│ └─────┘ └─────┘ └─────┘        │
│       (deslizar horizontal)     │
└─────────────────────────────────┘
```

### Cambiar Cartones

- **Permitido**: Cuando NO hay ronda activa
- Al tocar "Cambiar Cartones":
  1. Se entregan cartones **nuevos** (aleatorios)
  2. Inicia el temporizador nuevamente
  3. Los cartones anteriores se liberan

---

## Durante el Juego

### Cuando Inicia una Ronda

```
[Cualquier pantalla] → Ronda inicia → [Pantalla de Juego automáticamente]
```

- La pantalla cambia **automáticamente** a la pantalla de juego
- El jugador ve sus cartones y puede marcar números
- **"Cambiar Cartones" está deshabilitado** durante la ronda

### Si el Jugador Reabre la App

- Si hay ronda activa → Va **directo a la pantalla de juego**
- Si no hay ronda activa → Va a la lista de juegos

### Jugador Sin Cartones Cuando Inicia Ronda

- El jugador es **excluido de esa ronda**
- Puede seleccionar cartones para la **siguiente ronda**

---

## Fin de Ronda

### Pantalla de Resultados

```
┌─────────────────────────────────┐
│      ¡Ronda Terminada!          │
├─────────────────────────────────┤
│                                 │
│  Ganador: A1B2                  │
│  Patrón: Línea Horizontal       │
│  Números cantados: 23           │
│                                 │
├─────────────────────────────────┤
│         [Continuar]             │
└─────────────────────────────────┘
```

- **Sin ganador**: Muestra "Sin ganador"
- **Múltiples ganadores**: Muestra todos los códigos (ej: "A1B2, C3D4")

Después de "Continuar" → Va al **detalle del juego**

### Entre Rondas

- El jugador está en la pantalla de **detalle del juego**
- Puede ver sus cartones en "Mis Cartones"
- Puede **cambiar cartones** si desea
- Usa los **mismos cartones** para todas las rondas (opcional cambiar)

---

## Fin del Juego

```
┌─────────────────────────────────┐
│      ¡Juego Finalizado!         │
├─────────────────────────────────┤
│                                 │
│   Resumen de todas las rondas   │
│   Ganadores, patrones, etc.     │
│                                 │
├─────────────────────────────────┤
│         [Aceptar]               │
└─────────────────────────────────┘
```

Después de aceptar → Va a la **lista de juegos**

---

## Desinscribirse del Juego

- **Juegos gratuitos**: Puede salirse en cualquier momento
- Los cartones seleccionados se liberan al salirse

---

## Resumen de Estados

| Estado del Jugador | "Mis Cartones" | "Cambiar Cartones" |
|--------------------|----------------|-------------------|
| No inscrito | Deshabilitado | - |
| Inscrito, sin cartones | Abre selección con timer | - |
| Inscrito, con cartones, sin ronda activa | Ver cartones | Habilitado |
| Inscrito, con cartones, ronda activa | En pantalla de juego | Deshabilitado |

---

## Conexión Perdida

- El temporizador **sigue corriendo** en el servidor
- Si reconecta antes del timeout: puede continuar seleccionando
- Si el tiempo expira mientras está desconectado: aplican las reglas de auto-asignación

---

*Documento generado para implementación del flujo de cartones - Bingo App*

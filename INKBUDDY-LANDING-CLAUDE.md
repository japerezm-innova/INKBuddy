# INKBuddy Landing Page — Contexto del Proyecto

> Este archivo provee todo el contexto necesario para construir la landing page de INKBuddy.
> El producto ya existe y está en producción. Esta landing es el escaparate público.

---

## Qué es INKBuddy

**INKBuddy** es un SaaS de gestión para estudios y artistas de tatuajes en Latinoamérica.
Permite a los tatuadores manejar citas, clientes, portafolio, inventario, análisis de negocio,
marketing en redes sociales y cotizaciones profesionales — todo desde un solo lugar.

**Tagline actual:** "Tu estudio, siempre al día"

**App en producción:** https://inkbuddycl.vercel.app

---

## Design System (exacto del producto)

### Colores
```
ink-orange:    #FF6B35   ← color principal, CTAs, accents
ink-coral:     #FF8C61   ← variante clara del naranja
ink-peach:     #FFB088   ← gradientes suaves
ink-pink:      #FF6B8A   ← acento secundario
ink-cream:     #FFF5EE   ← fondos claros
ink-warm-gray: #F7F0EB   ← fondos neutros cálidos
ink-dark:      #1A1A2E   ← texto principal / fondos oscuros
ink-dark-soft: #2D2D44   ← fondos oscuros secundarios
```

### Tipografía
- **Font:** Poppins (Google Fonts)
- Headings: Bold / ExtraBold
- Body: Regular / Medium

### Estilo Visual
- **Glassmorphism:** `bg-white/20 backdrop-blur-xl border border-white/20`
- **Gradientes de fondo:** `from-[#1A1A2E] via-[#2D2D44] to-[#1A1A2E]`
- **Blobs animados:** colores ink-orange y ink-pink, animación `blob 7s infinite`
- **Border radius:** muy redondeado (`rounded-2xl`, `rounded-3xl`, `rounded-4xl`)
- **Sombras:** `shadow-glass` (0 8px 32px rgba(255,107,53,0.1))
- **Tono visual:** Oscuro, premium, audaz — estética industria del tatuaje

### Botón principal (CTA)
```
bg-ink-orange hover:bg-ink-coral text-white font-semibold rounded-2xl px-8 py-4
```

---

## Funcionalidades del Producto

### Plan Gratuito (Free)
- **Dashboard** — resumen del negocio (citas hoy, ingresos, clientes)
- **Citas** — agendar, editar, ver historial de citas
- **Clientes** — base de datos de clientes con historial
- **Portafolio** — galería pública de trabajos realizados
- **Tareas** — to-do list para el estudio
- **Página de reserva pública** — link para que clientes agenden solos

### Plan Pro (de pago)
- **Analytics** — ingresos, tendencias, estilos más populares, clientes frecuentes
- **Inventario** — stock de tintas, agujas, suministros
- **Marketing Intelligence** — planificador de contenido para Instagram y TikTok,
  análisis de hashtags, calendario de publicaciones
- **Cotizaciones profesionales** — genera cotizaciones con número único, PDF imprimible,
  link público para el cliente, estado (pending/accepted/declined)
- **Recordatorios por WhatsApp** — chatbot que avisa al cliente antes de su cita
  (próximamente activo)

### Modelo de Precios
- Plan Free: gratis, sin tarjeta de crédito
- Plan Pro: activación por **código de acceso** (beta/invitación)
  - Acceso desde Configuración → "Activar código Pro"
  - El usuario ingresa el código → se activa instantáneamente
  - Modelo de distribución: códigos enviados directamente a tatuadores seleccionados

---

## Audiencia Objetivo

- **Primario:** Tatuadores independientes y dueños de estudio en Chile / Latinoamérica
- **Secundario:** Estudios con varios artistas (multi-artista)
- **Pain points que resuelve:**
  - "Anoto las citas en papel o en WhatsApp y pierdo información"
  - "No sé cuánto gané este mes ni cuál es mi estilo más vendido"
  - "Mis clientes se olvidan de la cita y no me avisan"
  - "No tengo cotizaciones profesionales, le digo el precio por chat"
  - "No tengo tiempo para planificar mi contenido de Instagram"
- **Tono de comunicación:** Directo, sin floro. Habla como tatuador, no como banco.

---

## Estructura Sugerida de la Landing

### 1. Hero
- Headline impactante + subheadline con beneficio claro
- CTA principal: "Empieza gratis" → enlaza a https://inkbuddycl.vercel.app/login
- CTA secundario: "Ver demo" (puede ser un video o capturas animadas)
- Fondo: gradiente oscuro ink-dark con blobs animados ink-orange/ink-pink

### 2. Social Proof / Credibilidad
- Número de estudios usando INKBuddy (o "Únete a los primeros tatuadores en Chile")
- Logos o badges (Chile, LATAM)

### 3. Problema → Solución
- 3-4 pain points visuales → cómo INKBuddy los resuelve

### 4. Features (Free)
- Cards con ícono + título + descripción breve
- Dashboard, Citas, Clientes, Portafolio, Reservas en línea

### 5. Features Pro (Upgrade)
- Sección diferenciada (fondo naranja o efecto premium)
- Analytics, Inventario, Marketing, Cotizaciones, WhatsApp

### 6. Pricing
- Free: $0 — lista de features free
- Pro: Por código de acceso (beta) — "Solicitar acceso"
- Botón CTA a https://inkbuddycl.vercel.app/login

### 7. Demo / Screenshots
- Capturas del dashboard, cotizaciones, analytics
- Puede ser un mockup en dispositivo (MacBook + iPhone)

### 8. FAQ
- ¿Es gratis? ¿Necesito tarjeta? ¿Funciona en celular? ¿Hay app?

### 9. Footer
- Link a la app, contacto, redes sociales

---

## Stack Tecnológico Recomendado para la Landing

```
Next.js 15 + TypeScript + Tailwind CSS 3.4
```

- Mismo stack que el producto → consistencia visual y de código
- Puedes copiar el `tailwind.config.ts` del app principal (colores ink-*)
- Puedes copiar la fuente Poppins del `layout.tsx`
- Deploy en Vercel (mismo equipo, mismo flujo)

**Alternativa más simple:** Astro + Tailwind (si se quiere más velocidad de desarrollo, sin JS complejo)

---

## Assets Disponibles

En el repo del app (`d:\ProyectosAntigravity\INKBuddy\`):
- `mobile-dashboard.png` — screenshot del dashboard en mobile
- `mobile-appointments.png` — vista de citas en mobile
- `mobile-marketing.png` — sección marketing en mobile
- `mobile-portfolio.png` — portafolio en mobile
- `mobile-tasks.png` — tareas en mobile
- `mobile-settings.png` — ajustes en mobile
- `vercel-live.png` — captura en producción
- `vercel-mobile-dashboard.png` — dashboard mobile en Vercel
- `vercel-mobile-marketing.png` — marketing mobile en Vercel

---

## URLs Importantes

| Recurso | URL |
|---------|-----|
| App en producción | https://inkbuddycl.vercel.app |
| Login / Registro | https://inkbuddycl.vercel.app/login |
| Dashboard | https://inkbuddycl.vercel.app/dashboard |

---

## Notas para el Asistente IA

- El logo de INKBuddy es el texto "INKBuddy" con "INK" en ink-orange y "Buddy" en blanco
- El producto está en español (Latinoamérica)
- NO hay app nativa todavía — es PWA (Progressive Web App) con soporte mobile muy bueno
- El producto está en **beta** — el modelo de precios Pro es por código de invitación
- El tatuador típico accede desde el celular → la landing debe ser mobile-first
- La competencia directa no existe claramente en LATAM → posicionarse como "el primero para tatuadores latinos"

---

## Comandos para Iniciar el Nuevo Proyecto

```bash
# Crear proyecto
npx create-next-app@15 inkbuddy-landing --typescript --tailwind --app --src-dir

# Configurar Tailwind con los colores de INKBuddy
# Copiar tailwind.config.ts del repo principal

# Instalar fuente Poppins
npm install next/font  # ya viene con Next.js

# Deploy
vercel --prod
```

---

*Generado desde el repo INKBuddy App el 2026-03-12*

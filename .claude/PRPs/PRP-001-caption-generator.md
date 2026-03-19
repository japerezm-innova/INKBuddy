# PRP-001: Caption Generator con IA para Tatuajes

> **Estado**: PENDIENTE
> **Fecha**: 2026-03-18
> **Proyecto**: INKBuddy

---

## Objetivo

Un generador de captions/copy con IA que analice la imagen de un tatuaje y produzca texto listo para copiar y publicar en Instagram/TikTok, incluyendo hashtags optimizados y recomendacion de mejor horario para publicar.

## Por Que

| Problema | Solucion |
|----------|----------|
| El tatuador pierde 15-30 min pensando que escribir en cada post | La IA genera el caption en 5 segundos |
| No sabe que hashtags usar ni cuales son trending | Hashtags inteligentes por estilo + colecciones existentes |
| Publica a cualquier hora sin estrategia | Recomendacion de horario basada en datos de engagement |

**Valor de negocio**: Mas publicaciones = mas visibilidad = mas reservas. El tatuador recupera 2-4 horas semanales en gestion de redes.

## Que

### Criterios de Exito
- [ ] Usuario sube/pega URL de imagen de tatuaje y recibe caption generado en <10 segundos
- [ ] Caption incluye: texto descriptivo + hashtags relevantes + emoji apropiado
- [ ] Usuario puede elegir tono (profesional, casual, artistico)
- [ ] Boton de copiar al clipboard funciona en mobile y desktop
- [ ] Recomendacion de mejor horario para publicar visible junto al caption
- [ ] Se integra con el PostPlanner existente del modulo Marketing

### Comportamiento Esperado (Happy Path)

1. Tatuador va a Marketing > Post Planner (o crea nuevo post)
2. Ingresa la URL de la imagen del tatuaje (o selecciona de su portfolio)
3. Selecciona tono: Profesional / Casual / Artistico
4. Click en "Generar Caption"
5. La IA analiza la imagen (vision) y genera:
   - Caption descriptivo (2-3 oraciones)
   - 15-20 hashtags relevantes (mezcla de trending + nicho)
   - Mejor horario para publicar (basado en constantes de marketing)
6. Tatuador puede:
   - Copiar todo al clipboard
   - Copiar solo caption
   - Copiar solo hashtags
   - Regenerar con otro tono
   - Editar manualmente antes de copiar
7. Tatuador pega en Instagram/TikTok manualmente

---

## Contexto

### Referencias
- `src/features/marketing/` - Modulo de marketing existente (PostPlanner, HashtagManager)
- `src/features/portfolio/` - Portfolio con imagenes de tatuajes
- `.claude/ai_templates/_index.md` - Templates de Vercel AI SDK + OpenRouter
- `.claude/ai_templates/00-setup.md` - Setup inicial de AI
- `.claude/ai_templates/standalone/single-call.md` - Patron para llamadas one-shot
- `src/features/marketing/constants/tattoo-marketing.ts` - Horarios optimos y estrategias de contenido

### Stack AI
```
Vercel AI SDK v5 + OpenRouter
Modelo vision: google/gemini-2.0-flash-exp:free (analisis de imagen)
Modelo texto: google/gemini-2.0-flash-exp:free (generacion de caption)
```

### Arquitectura Propuesta

No se crea un feature nuevo. Se integra dentro del modulo Marketing existente:

```
src/features/marketing/
├── components/
│   ├── caption-generator.tsx          # NUEVO - UI principal del generador
│   ├── caption-result.tsx             # NUEVO - Resultado con copy buttons
│   ├── post-planner.tsx               # EXISTENTE - Agregar boton "Generar Caption"
│   └── ...
├── services/
│   ├── caption-service.ts             # NUEVO - Server action que llama a la IA
│   └── marketing-service.ts           # EXISTENTE - Sin cambios
├── types/
│   └── marketing.ts                   # EXISTENTE - Agregar tipos de caption
└── constants/
    └── tattoo-marketing.ts            # EXISTENTE - Ya tiene horarios optimos

src/app/api/
└── ai/
    └── caption/
        └── route.ts                   # NUEVO - API Route para streaming de caption

src/shared/lib/
└── ai.ts                              # NUEVO - Config de OpenRouter provider
```

### Modelo de Datos

No se necesitan tablas nuevas. Los captions generados son efimeros (el usuario los copia y pega). Opcionalmente se pueden guardar en el campo `caption` de `social_posts` que ya existe.

---

## Blueprint (Assembly Line)

### Fase 1: Setup AI Engine
**Objetivo**: Instalar dependencias de Vercel AI SDK + OpenRouter y crear configuracion base
**Validacion**: `npm run typecheck` pasa con las nuevas dependencias importadas

### Fase 2: API Route + Caption Service
**Objetivo**: Crear el endpoint `/api/ai/caption` que reciba URL de imagen + tono y devuelva caption generado via streaming
**Validacion**: `curl` al endpoint retorna caption valido con hashtags

### Fase 3: UI del Caption Generator
**Objetivo**: Crear componentes `CaptionGenerator` y `CaptionResult` con selector de tono, boton generar, area de resultado editable, y botones de copiar
**Validacion**: Screenshot de Playwright muestra la UI completa y funcional

### Fase 4: Integracion con PostPlanner + Horarios
**Objetivo**: Agregar boton "Generar Caption" en PostPlanner existente, incluir recomendacion de mejor horario usando datos de `tattoo-marketing.ts`
**Validacion**: Flujo completo funciona: seleccionar imagen → generar → copiar

### Fase 5: Validacion Final
**Objetivo**: Sistema funcionando end-to-end en mobile y desktop
**Validacion**:
- [ ] `npm run typecheck` pasa
- [ ] `npm run build` exitoso
- [ ] Caption se genera correctamente con imagen real de tatuaje
- [ ] Copiar al clipboard funciona en mobile (Chrome Android)
- [ ] Tono cambia el estilo del caption generado
- [ ] Horario recomendado se muestra correctamente

---

## Gotchas

- [ ] OpenRouter API key necesita estar en `.env.local` como `OPENROUTER_API_KEY`
- [ ] Vision models necesitan la imagen como URL publica (no base64 para URLs externas)
- [ ] `navigator.clipboard.writeText()` requiere contexto seguro (HTTPS) - funciona en Vercel prod
- [ ] El modelo gratuito de Gemini tiene rate limits - considerar fallback
- [ ] El caption debe generarse en espanol (Chile) por defecto
- [ ] Streaming via API Route (no server action) para mejor UX con respuesta progresiva

## Anti-Patrones

- NO crear nuevos patrones si los existentes funcionan
- NO ignorar errores de TypeScript
- NO hardcodear valores (usar constantes)
- NO omitir validacion Zod en inputs de usuario
- NO guardar la API key en el codigo

---

*PRP pendiente aprobacion. No se ha modificado codigo.*

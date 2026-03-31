---
title: "Postmortem sin culpables: cómo hacer que tu equipo aprenda en lugar de esconderse"
date: 2025-01-08
tags: ["sre", "postmortem", "cultura", "incidentes"]
description: "Un postmortem bien hecho no busca al culpable. Busca el sistema que lo permitió. La diferencia entre los dos determina si tu equipo crece o se paraliza."
author: "Óscar Sánchez Pérez"
---

A las 2:47am del martes, la plataforma de pagos dejó de procesar transacciones. Cuarenta y dos minutos de caída. 380.000€ en transacciones fallidas. El equipo estaba despierto y asustado.

Lo que pasó después de esa noche es lo que importa.

## Por qué los postmortems fallan

La mayoría de postmortems terminan en uno de dos sitios:

1. **El informe de cinco páginas que nadie lee.** Se sube a Confluence, se cierra el ticket, se olvida.
2. **La reunión donde alguien sale señalado.** Puede que no se diga explícitamente, pero todo el mundo sabe a quién se mira.

Ambos son un fracaso. El primero porque no produce cambio. El segundo porque produce el cambio equivocado: la gente empieza a ocultar errores, a no escalar a tiempo, a protegerse en lugar de aprender.

> Los sistemas complejos no fallan por una sola causa. Fallan por la combinación de condiciones que nadie diseñó para que coexistieran.
>
> — Charles Perrow, *Normal Accidents*

---

## La anatomía de un postmortem que funciona

### 1. La línea de tiempo sin juicios

Reconstruye qué pasó, en orden, con timestamps. Solo hechos.

```
02:47  Primera alerta: latencia p99 > 30s en /api/payments
02:51  On-call despierto, empieza investigación
02:58  Identifica spike en conexiones a base de datos
03:04  Escala a DBA
03:11  Se detecta query sin índice ejecutándose 400 veces/minuto
03:29  Deploy de hotfix en staging
03:41  Deploy en producción, latencia vuelve a normal
```

Nada de "el desarrollador *olvidó* añadir el índice". Solo: "la query se ejecutaba sin índice".

### 2. Las cinco preguntas que sí importan

No "quién lo hizo". Sino:

- ¿Por qué el sistema permitió que llegara a producción?
- ¿Por qué las alertas no detectaron el problema antes?
- ¿Por qué el proceso de revisión no lo capturó?
- ¿Qué haría falta para que esto no pudiera pasar?
- ¿Qué habríamos necesitado saber para resolverlo en la mitad de tiempo?

### 3. Los action items con dueño y fecha

Un postmortem sin acción es un ejercicio de escritura creativa.

| Acción | Dueño | Fecha límite | Estado |
|--------|-------|--------------|--------|
| Añadir índice en tabla `transactions` | Equipo backend | 2025-01-10 | ✅ |
| Alert para queries > 5s de duración | Equipo SRE | 2025-01-15 | 🔄 |
| Runbook de degradación de base de datos | Óscar | 2025-01-20 | ⬜ |
| Review de queries en staging pre-deploy | Todo el equipo | 2025-01-31 | ⬜ |

---

## Lo que el equipo necesita escuchar

Hay una frase que cambia el tono de toda la reunión. Úsala al principio:

> "Asumimos que todos los que estuvieron involucrados tomaron las mejores decisiones que podían tomar, con la información que tenían, bajo la presión que tenían."

No es una frase vacía. Es un compromiso. Si lo dices, tienes que respaldarlo cuando alguien en la sala se ponga a la defensiva.

---

## El error más común

Confundir **causa raíz** con **causa próxima**.

La causa próxima es lo último que pasó antes del fallo. La query sin índice. El certificado expirado. El deploy que nadie revisó.

La causa raíz es el sistema que lo permitió. No hay process gate para queries en producción. Los certificados no tienen rotación automática. El proceso de review tiene un paso que todo el mundo se salta porque lleva 20 minutos.

Arregla la causa próxima o vuelves a tener el mismo incidente con distintos actores.

---

## Recursos

- [Google SRE Book — Chapter 15: Postmortem Culture](https://sre.google/sre-book/postmortem-culture/)
- [PagerDuty Postmortem Template](https://postmortems.pagerduty.com/)
- [Etsy's Debriefing Facilitation Guide](https://extfiles.etsy.com/DebriefingFacilitationGuide.pdf)

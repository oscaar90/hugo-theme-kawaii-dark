---
title: "On-call no es heroísmo: es ingeniería de guardia"
date: 2025-02-27
tags: ["oncall", "sre", "cultura", "incidentes", "burnout"]
description: "Si tu equipo tiene miedo de la guardia, el problema no es la guardia. Es el sistema que hace que sea aterradora."
author: "Óscar Sánchez Pérez"
---

He conocido ingenieros que pedían vacaciones para no coincidir con su semana de guardia. Ingenieros que no dormían bien el domingo antes de empezar. Ingenieros que llevaban el portátil a bodas, cumpleaños, comidas familiares, *por si acaso*.

Eso no es guardia. Es ansiedad laboral disfrazada de responsabilidad.

---

## La guardia debería ser aburrida

El objetivo de un buen sistema de on-call no es tener héroes disponibles 24/7 para apagar fuegos. Es construir sistemas que generen tan pocos fuegos que la guardia sea, la mayoría de las noches, silenciosa.

Si tu ingeniero de guardia recibe más de 2-3 alertas semanales fuera de horario laboral, el problema no es el ingeniero. Es el sistema.

> Una alerta que despierta a alguien a las 2am debería ser suficientemente importante como para que ese alguien necesite tomar una decisión ahora. Si puede esperar hasta mañana, no era una alerta. Era un email con mal timing.

---

## Qué hace que la guardia sea insostenible

### Alertas que no requieren acción

La causa número uno de burnout en on-call. Recibes una alerta, miras los dashboards, todo está bien. La alerta se resolvió sola. Vuelves a dormir.

A la semana siguiente ignoras esa alerta porque "siempre se resuelve sola". Hasta el día que no se resuelve.

**Solución:** cada alerta que se resuelve sola sin acción humana es una alerta que hay que eliminar o convertir en ticket.

### Runbooks inexistentes o inútiles

```markdown
# Runbook: Alta latencia en el servicio de pagos

## Síntomas
- Alerta: `payments_latency_p99 > 2s` durante más de 5 minutos

## Diagnóstico
1. Abrir dashboard: https://grafana.interno/d/payments
2. Revisar panel "Database connection pool" — si > 90% de uso, ir a paso 3
3. Ejecutar: `kubectl top pods -n production | grep payments`
4. Si algún pod supera 800Mi de memoria, reiniciarlo:
   `kubectl delete pod <nombre-pod> -n production`

## Escalado
- Si la latencia no baja en 10 minutos: escalar a @equipo-backend en #incidencias
- Si hay pérdida de transacciones: escalar a @oncall-datos INMEDIATAMENTE

## Recuperación esperada
- Tiempo normal de resolución: 5-15 minutos
- Si supera 30 minutos: abrir incidente P1
```

Un runbook bueno lo puede seguir alguien que lleva tres meses en el equipo, a las 3am, con medio cerebro dormido.

### Rotaciones demasiado cortas o demasiado largas

| Duración | Problema |
|----------|----------|
| < 1 semana | No da tiempo a entrar en contexto antes de salir |
| > 2 semanas | Agota psicológicamente, especialmente si hay alertas nocturnas |
| 1-2 semanas | El equilibrio habitual |

Y siempre: descanso compensatorio. Si te despiertan a las 3am, no entras a las 9am como si nada.

---

## Las métricas de una guardia sana

Mide esto por rotación:

- **Alertas totales recibidas** — tendencia debería ser decreciente
- **Alertas fuera de horario** — las que despiertan a alguien
- **Tiempo medio de resolución** — ¿se resuelve más rápido con el tiempo?
- **Alertas que no requirieron acción** — estas son las que eliminar

Si estas métricas no mejoran mes a mes, la guardia no está mejorando. El equipo solo se está acostumbrando al dolor.

---

## Lo que cambia cuando la guardia funciona bien

Los ingenieros dejan de temer la semana de guardia. No porque sea fácil, sino porque es manejable. Hay runbooks que funcionan. Las alertas significan algo. Cuando termina la semana, hay un handoff real con lo que pasó y lo que quedó pendiente.

Y sobre todo: los incidentes de guardia se usan para mejorar el sistema, no para encontrar culpables.

---

La guardia no debería ser el precio de trabajar en infraestructura. Debería ser una función más del trabajo, con sus herramientas, sus procesos y su reconocimiento.

Si en tu equipo la guardia es una carga que todos intentan evitar, algo está mal. Y ese algo raramente es la persona de guardia.

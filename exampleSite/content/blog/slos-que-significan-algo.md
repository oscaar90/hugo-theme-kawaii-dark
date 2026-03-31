---
title: "SLOs que significan algo: de los números en un dashboard a acuerdos reales"
date: 2025-03-12
tags: ["sre", "slo", "sla", "fiabilidad", "monitoring"]
description: "Un SLO del 99.9% que nadie usa para tomar decisiones es solo un número en Grafana. Un SLO real cambia cómo priorizas trabajo, cómo gestionas incidentes y cómo hablas con el negocio."
author: "Óscar Sánchez Pérez"
---

La primera vez que un equipo define SLOs, suele pasar lo mismo: eligen números que suenan bien (99.9%, 99.95%), los meten en Grafana y siguen trabajando exactamente igual que antes.

Eso no son SLOs. Son decoración con nomenclatura de Google.

---

## Qué hace que un SLO sea real

Un SLO real cambia el comportamiento del equipo. Específicamente:

- **Cuando el error budget está sano**, el equipo puede hacer deploys frecuentes, experimentos, cambios de arquitectura.
- **Cuando el error budget está bajo**, el equipo para, investiga y prioriza fiabilidad sobre features.
- **Cuando el error budget se agota**, hay una conversación estructurada con el negocio sobre qué hacer.

Si tu SLO no produce ninguno de estos comportamientos, es un número en un dashboard.

---

## El error budget: el concepto que lo une todo

```
SLO: 99.9% de disponibilidad en 30 días
Ventana: 30 días = 43.200 minutos
Error budget: 0.1% × 43.200 = 43,2 minutos de downtime permitido
```

Esos 43 minutos son tu margen para operar. Cada minuto de incidente los consume. Cada deploy que sale mal los consume. Cada cambio de configuración que rompe algo los consume.

Cuando los consumes todos, el negocio recibe peor servicio del que acordó. Eso tiene consecuencias reales: clientes insatisfechos, SLAs incumplidos, reputación dañada.

---

## Cómo elegir el SLI correcto

El SLI (*Service Level Indicator*) es la métrica que mide. Tienes que elegir algo que el usuario percibe directamente.

| Tipo de servicio | SLI recomendado |
|------------------|-----------------|
| API HTTP | % de peticiones con status 2xx o 3xx |
| API de baja latencia | % de peticiones completadas en < 200ms |
| Procesamiento batch | % de jobs completados sin error |
| Base de datos | % de queries completadas en < 100ms |
| Cola de mensajes | % de mensajes procesados en < X segundos |

Lo que *no* es un buen SLI directamente: CPU, memoria, disco. Esas son señales de capacidad, no de experiencia de usuario.

---

## La implementación en Prometheus

```promql
# SLI: peticiones exitosas / peticiones totales
# "Buenas" peticiones: status 2xx o 3xx
# "Malas": cualquier 5xx

# Tasa de peticiones buenas
sum(rate(http_requests_total{
  job="mi-api",
  status!~"5.."
}[5m]))

# Tasa total
sum(rate(http_requests_total{
  job="mi-api"
}[5m]))

# SLI actual (últimas 24h)
sum(rate(http_requests_total{job="mi-api", status!~"5.."}[24h]))
/
sum(rate(http_requests_total{job="mi-api"}[24h]))
```

---

## Las alertas basadas en burn rate

El burn rate es cuánto más rápido estás consumiendo el error budget comparado con lo que deberías.

*Burn rate 1* = estás consumiendo el budget exactamente al ritmo que te permite el SLO.
*Burn rate 14* = a este ritmo, agotarás el budget mensual en 2 horas.

```yaml
# Alerta cuando el burn rate es alto — requiere acción inmediata
- alert: ErrorBudgetBurnRateFast
  expr: |
    (
      sum(rate(http_requests_total{status=~"5.."}[1h]))
      /
      sum(rate(http_requests_total[1h]))
    ) > (14 * 0.001)  # 14x burn rate para SLO 99.9%
  for: 2m
  labels:
    severity: page
  annotations:
    summary: "Error budget agotándose rápido (burn rate 14x)"

# Alerta de burn rate moderado — requiere acción hoy
- alert: ErrorBudgetBurnRateSlow
  expr: |
    (
      sum(rate(http_requests_total{status=~"5.."}[6h]))
      /
      sum(rate(http_requests_total[6h]))
    ) > (6 * 0.001)  # 6x burn rate
  for: 15m
  labels:
    severity: ticket
```

---

## La conversación con el negocio

El error budget crea un lenguaje común entre ingeniería y negocio.

> "Llevamos el 60% del error budget del mes consumido en 15 días. Si seguimos lanzando features a este ritmo sin reducir los incidentes, vamos a incumplir el SLO. Necesitamos una semana de fiabilidad."

Esa conversación, con datos, es mucho más fácil que "creemos que deberíamos hacer menos deploys esta semana".

---

## Lo que cambia cuando los SLOs funcionan de verdad

- Los ingenieros dejan de hacer features sin fin y empiezan a ver fiabilidad como parte del trabajo.
- El negocio entiende el coste real de pedir velocidad de desarrollo.
- Los incidentes tienen contexto: ¿consumió mucho error budget? ¿Poco?
- Las decisiones de priorización tienen datos, no solo intuición.

---

> Un SLO es un acuerdo. No con los usuarios, sino contigo mismo sobre qué significa hacer bien tu trabajo. Todo lo demás — alertas, postmortems, decisiones de priorización — debería fluir de ese acuerdo.

---
title: "Observabilidad que se usa: la diferencia entre dashboards bonitos y alertas que importan"
date: 2025-02-01
tags: ["observabilidad", "grafana", "sre", "monitoring", "alertas"]
description: "Tienes Grafana, Prometheus y Loki. Tienes 47 dashboards. Nadie los mira hasta que algo explota. Eso no es observabilidad, es decoración."
author: "Óscar Sánchez Pérez"
---

{{< figure src="https://picsum.photos/seed/grafana-dash/900/350" caption="Un dashboard bonito que nadie mira en tiempo real no es observabilidad." >}}

Conozco equipos con Grafana lleno de dashboards espectaculares. Tienen el USE method implementado, tienen el RED method, tienen traces de Jaeger, tienen logs en Loki. Todo el stack.

Y cuando algo falla en producción, la primera pregunta sigue siendo: *¿dónde miro?*

## El problema no es la herramienta

Prometheus, Grafana, Loki, Jaeger, Datadog, lo que sea — ninguna herramienta resuelve el problema de no saber qué preguntas hacerle a tus sistemas.

La observabilidad no es instalar software. Es diseñar tus sistemas para que puedan responder preguntas que todavía no has formulado.

---

## Las tres señales que importan

Antes de hablar de herramientas, habla de señales. El modelo **RED** para servicios:

- **Rate** — cuántas peticiones por segundo recibe el servicio
- **Errors** — qué porcentaje falla
- **Duration** — cuánto tardan (especialmente p95 y p99, no la media)

```promql
# Rate de peticiones por servicio
sum(rate(http_requests_total[5m])) by (service)

# Tasa de error
sum(rate(http_requests_total{status=~"5.."}[5m])) by (service)
/ sum(rate(http_requests_total[5m])) by (service)

# Latencia p99
histogram_quantile(0.99,
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service)
)
```

Si solo tienes estas tres métricas por servicio, ya sabes dónde mirar cuando algo falla.

---

## SLOs: la métrica que obliga a tomar decisiones

Un SLO (*Service Level Objective*) es un acuerdo contigo mismo sobre qué significa que el servicio funciona bien.

```yaml
# Ejemplo de SLO para un servicio de pagos
slo:
  nombre: "Disponibilidad servicio de pagos"
  objetivo: 99.9%          # 8.7 horas de downtime al año
  ventana: 30d

  indicador:
    metrica: "http_requests_total"
    filtro: 'job="payments"'
    buenos: 'status!~"5.."'
    totales: "todas las peticiones"

  alertas:
    - nombre: "Burn rate alto"
      burn_rate: 14.4       # Agota el error budget en 2 horas
      ventana: 1h
      severidad: page
    - nombre: "Burn rate moderado"
      burn_rate: 6
      ventana: 6h
      severidad: ticket
```

Lo que hace el SLO que no hace una alerta de CPU al 90%: te dice si el *usuario* está sufriendo, no si una máquina está caliente.

---

## Alertas que despiertan a alguien vs alertas que nadie lee

Regla simple: si una alerta no requiere acción inmediata de un humano, no debería despertar a nadie.

| Tipo de alerta | Destino correcto | Ejemplo |
|----------------|------------------|---------|
| Requiere acción ahora | PagerDuty / oncall | SLO burn rate alto, servicio caído |
| Requiere acción hoy | Ticket / Slack | Disco al 80%, certificado expira en 14 días |
| Informativa | Dashboard / log | Deploy completado, backup terminado |

El error más común: poner todo en PagerDuty. Resultado: el oncall ignora las alertas porque la mitad son ruido. Cuando llega la alerta real, tarda más en reaccionar.

---

## El dashboard que sí funciona

Un buen dashboard de guardia tiene tres secciones y cabe en una pantalla:

1. **Estado global** — ¿está todo verde? Semáforos, no gráficas.
2. **SLOs activos** — ¿estamos dentro del error budget? Un número por SLO.
3. **Últimos eventos** — deploys, cambios de configuración, incidentes activos.

Si necesitas más de 30 segundos para saber si hay un problema, el dashboard no sirve para guardia.

---

> La observabilidad no es para cuando algo falla. Es para saber qué está pasando *antes* de que algo falle, y para reducir el tiempo desde "algo va mal" hasta "sé exactamente qué va mal".

El stack importa menos de lo que crees. Las preguntas que le haces a ese stack importan todo.

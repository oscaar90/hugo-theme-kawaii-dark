---
title: "Kubernetes en producción: lo que nadie te cuenta en los tutoriales"
date: 2025-01-15
tags: ["kubernetes", "sre", "infraestructura", "produccion"]
description: "Los tutoriales te enseñan a desplegar un nginx. La producción te enseña resource limits, PodDisruptionBudgets y por qué tu cluster se quedó sin nodos a las 3am."
author: "Óscar Sánchez Pérez"
---

![Cluster de Kubernetes con nodos distribuidos](https://picsum.photos/seed/k8s-prod/900/400)

Llevas tres semanas con Kubernetes en local. Todo funciona. Los pods levantan, los servicios resuelven, el ingress enruta. Te sientes preparado.

Entonces lo despliegas en producción.

## El primer año en producción

El primer año con Kubernetes en producción es una colección de lecciones que ningún tutorial incluye. No porque sean secretas, sino porque son aburridas de explicar y devastadoras de descubrir.

Aquí van las principales.

---

### Resource requests y limits no son opcionales

```yaml
resources:
  requests:
    memory: "128Mi"
    cpu: "250m"
  limits:
    memory: "256Mi"
    cpu: "500m"
```

Sin `requests`, el scheduler no sabe dónde colocar tu pod. Sin `limits`, un pod con memory leak se come el nodo entero.

Aprenderás esto cuando un pod en OOMKilled reinicie en bucle a las 2am y tardes 40 minutos en entender qué pasó.

---

### Liveness vs Readiness: no son lo mismo

| Probe | Pregunta | Consecuencia si falla |
|-------|----------|----------------------|
| `livenessProbe` | ¿Está vivo el proceso? | Kubernetes mata y reinicia el pod |
| `readinessProbe` | ¿Puede recibir tráfico? | Kubernetes lo saca del Service |
| `startupProbe` | ¿Ha terminado de arrancar? | Evita kills prematuros durante el inicio |

El error clásico: usar `livenessProbe` para algo que debería ser `readinessProbe`. Tu pod empieza a fallar en liveness durante un pico de carga, Kubernetes lo mata, el nuevo pod tiene que arrancar desde cero, el pico empeora. Loop.

---

### PodDisruptionBudget: protege tu disponibilidad

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: mi-app-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: mi-app
```

Sin esto, un `kubectl drain` durante mantenimiento puede llevarse todos tus pods de golpe. Con esto, Kubernetes garantiza que siempre quedan al menos 2 réplicas activas.

---

## La trampa del HorizontalPodAutoscaler

El HPA escala en función de CPU o memoria. Suena bien. El problema es que escala *después* de que el problema ya existe.

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: mi-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: mi-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

Si tu app tarda 60 segundos en arrancar y el HPA tarda 30 segundos en detectar el problema y otros 60 en que los pods nuevos estén ready, tienes 2 minutos de degradación garantizada antes de que el escalado ayude.

La solución no es el HPA. Es tener siempre más réplicas de las que crees necesitar.

---

## Lo que sí te recomiendo hacer desde el día uno

1. **Namespaces por entorno**, no por equipo. `production`, `staging`, `dev` — con RBAC que separe quién puede hacer qué en cada uno.
2. **Network Policies** desde el principio. Bloquear todo por defecto y abrir solo lo necesario es mucho más fácil al principio que intentar cerrar después.
3. **GitOps** para los manifests. Nada de `kubectl apply` directo en producción. Cada cambio pasa por un PR.
4. **Logging estructurado** en JSON. Cuando tengas 50 pods generando logs, vas a agradecer poder filtrar por `{"level":"error","service":"payments"}`.

---

> Si tu cluster no te ha dado ningún susto en el primer mes, no estás mirando las métricas correctas.

El objetivo no es tener un cluster sin incidentes. Es tener un cluster del que aprendes rápido cuando algo falla.

---

## Lecturas que valen la pena

- [Kubernetes Failure Stories](https://k8s.af/) — casos reales de gente contando qué salió mal
- [Production Kubernetes](https://www.oreilly.com/library/view/production-kubernetes/9781492092292/) — el libro que ojalá hubiera existido antes
- [Kubernetes Best Practices](https://cloud.google.com/blog/products/containers-kubernetes/kubernetes-best-practices-how-and-why-to-build-small-container-images) — Google Cloud Blog

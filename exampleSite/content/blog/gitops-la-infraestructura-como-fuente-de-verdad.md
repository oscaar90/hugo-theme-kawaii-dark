---
title: "GitOps: cuando Git se convierte en la fuente de verdad de tu infraestructura"
date: 2025-02-20
tags: ["gitops", "kubernetes", "automatizacion", "infraestructura", "argocd"]
description: "GitOps no es otra moda. Es el principio de que el estado deseado de tu infraestructura vive en Git, y cualquier desviación se corrige automáticamente."
author: "Óscar Sánchez Pérez"
---

Hay un momento en la vida de cualquier equipo de infraestructura en el que alguien pregunta: *¿cuál es el estado actual de producción?*

Y nadie sabe exactamente. Hay cambios hechos por consola hace tres semanas. Hay un script que alguien ejecutó "para arreglar algo rápido". Hay una configuración que se cambió durante un incidente y que nunca se documentó.

GitOps resuelve exactamente ese problema.

---

## El principio es simple

**Todo lo que corre en producción está descrito en un repositorio Git. Si no está en Git, no debería estar en producción.**

Cuando hay una desviación entre lo que dice Git y lo que hay desplegado, un operador automático la corrige. No un humano. Un proceso.

```
Git (estado deseado)
       ↓
  ArgoCD / Flux (reconciliación continua)
       ↓
Kubernetes (estado real)
       ↓
  Si difieren → ArgoCD corrige automáticamente
```

---

## La estructura de repositorios

Hay dos modelos principales:

### Monorepo

```
infraestructura/
├── apps/
│   ├── frontend/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── ingress.yaml
│   └── backend/
│       ├── deployment.yaml
│       └── service.yaml
├── base/
│   ├── namespaces.yaml
│   └── rbac.yaml
└── envs/
    ├── staging/
    │   └── kustomization.yaml
    └── production/
        └── kustomization.yaml
```

### Repos separados (app repo + config repo)

El código de la aplicación vive en un repositorio. Los manifests de Kubernetes viven en otro. El pipeline de CI actualiza el config repo cuando hay un nuevo build.

```yaml
# En el pipeline de CI de la app
- name: Update image tag in config repo
  run: |
    git clone https://github.com/mi-org/k8s-config
    cd k8s-config
    sed -i "s|image: mi-app:.*|image: mi-app:${{ github.sha }}|" \
      apps/backend/deployment.yaml
    git commit -am "ci: update backend to ${{ github.sha }}"
    git push
```

---

## ArgoCD: el operador de reconciliación

```yaml
# aplicacion.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: backend
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/mi-org/k8s-config
    targetRevision: main
    path: apps/backend
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true       # Borra recursos que ya no están en Git
      selfHeal: true    # Corrige cambios manuales en el cluster
    syncOptions:
      - CreateNamespace=true
```

Con `selfHeal: true`, si alguien hace `kubectl edit deployment backend` directamente en producción, ArgoCD lo revierte en segundos. El cluster siempre refleja lo que dice Git.

---

## Lo que cambia en el día a día

| Antes (sin GitOps) | Con GitOps |
|--------------------|------------|
| `kubectl apply -f deployment.yaml` en producción | PR al config repo, merge, ArgoCD despliega |
| "¿Quién cambió esto?" | `git log` — está todo |
| Rollback manual con kubectl | `git revert` + merge |
| Estado real desconocido | ArgoCD muestra el diff exacto |
| Acceso a producción para toda la infraestructura | Solo ArgoCD tiene acceso al cluster |

---

## La parte que nadie menciona

GitOps no elimina los incidentes. Elimina una categoría entera de incidentes: los causados por cambios manuales no documentados.

Los que quedan son los más interesantes: fallos en el código, problemas de capacidad, incidentes de terceros. Los que realmente necesitan ingeniería para resolver.

> GitOps es el principio de que la auditoría, el rollback y la colaboración no deberían ser procesos separados de cómo despliegas. Deberían ser consecuencias naturales de cómo trabaja tu equipo.

---

## Para empezar

- [ArgoCD Getting Started](https://argo-cd.readthedocs.io/en/stable/getting_started/)
- [Flux Documentation](https://fluxcd.io/flux/)
- [OpenGitOps Principles](https://opengitops.dev/)
- [GitOps Days — charlas grabadas](https://www.gitopsdays.com/)

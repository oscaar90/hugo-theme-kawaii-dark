---
title: "CI/CD que no necesita babysitter"
date: 2025-02-08
tags: ["cicd", "automatizacion", "github-actions", "devops"]
description: "Si tu pipeline de CI/CD necesita que alguien lo vigile, no es un pipeline. Es un script con interfaz gráfica."
author: "Óscar Sánchez Pérez"
---

Hay una señal clara de que un pipeline no está bien diseñado: la gente deja una pestaña del navegador abierta con el estado del build mientras trabaja en otra cosa.

Eso no es automatización. Es automatización con supervisor humano.

## Qué debería hacer un pipeline por ti

Un pipeline bien diseñado es autónomo. Cuando entra un commit:

1. Compila y verifica que el código es correcto
2. Ejecuta los tests — todos, sin excepciones
3. Analiza calidad y seguridad
4. Despliega en entornos de validación automáticamente
5. Notifica solo cuando algo requiere atención humana
6. Despliega en producción (manual o automático, según el acuerdo del equipo)

Si en alguno de esos pasos alguien tiene que intervenir manualmente para que continúe, ese paso no está automatizado.

---

## La estructura que funciona

```yaml
# .github/workflows/pipeline.yml
name: Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Install dependencies
        run: pip install -e ".[dev]"

      - name: Run tests
        run: pytest --cov=src --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v4

  security:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4

      - name: Secret scanning
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}

      - name: SAST
        uses: github/codeql-action/analyze@v3

  deploy-staging:
    runs-on: ubuntu-latest
    needs: [test, security]
    if: github.ref == 'refs/heads/main'
    environment: staging
    steps:
      - name: Deploy to staging
        run: ./scripts/deploy.sh staging

  deploy-production:
    runs-on: ubuntu-latest
    needs: deploy-staging
    environment:
      name: production
      url: https://mi-app.com
    steps:
      - name: Deploy to production
        run: ./scripts/deploy.sh production
```

---

## Los fallos más comunes

### Tests que tardan demasiado

Si los tests tardan más de 10 minutos, la gente deja de esperarlos y empieza a mergear sin verlos verdes. La solución no es quitar tests: es paralelizarlos.

```yaml
strategy:
  matrix:
    test-group: [unit, integration, e2e]
steps:
  - name: Run ${{ matrix.test-group }} tests
    run: pytest tests/${{ matrix.test-group }}/
```

### Secretos hardcodeados en el pipeline

```yaml
# ❌ Nunca esto
- name: Deploy
  run: aws s3 sync . s3://mi-bucket
  env:
    AWS_ACCESS_KEY_ID: AKIAIOSFODNN7EXAMPLE
    AWS_SECRET_ACCESS_KEY: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# ✅ Siempre esto
- name: Deploy
  run: aws s3 sync . s3://mi-bucket
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

### Deploys sin validación post-deploy

```bash
#!/bin/bash
# scripts/deploy.sh

ENVIRONMENT=$1
VERSION=$(git rev-parse --short HEAD)

echo "Desplegando $VERSION en $ENVIRONMENT..."
kubectl set image deployment/mi-app mi-app=mi-imagen:$VERSION -n $ENVIRONMENT

# Esperar a que el rollout termine
kubectl rollout status deployment/mi-app -n $ENVIRONMENT --timeout=300s

# Smoke test básico
ENDPOINT=$(kubectl get svc mi-app -n $ENVIRONMENT -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$ENDPOINT/health)

if [ "$HTTP_CODE" != "200" ]; then
  echo "Health check falló ($HTTP_CODE). Haciendo rollback..."
  kubectl rollout undo deployment/mi-app -n $ENVIRONMENT
  exit 1
fi

echo "Deploy completado. Health check: OK"
```

---

## La métrica que importa

**DORA metrics** — las cuatro métricas que predicen el rendimiento de un equipo de ingeniería:

| Métrica | Elite | Alta | Media | Baja |
|---------|-------|------|-------|------|
| Frecuencia de deploy | Múltiple/día | Semanal-mensual | Mensual-cada 6 meses | < 6 meses |
| Lead time para cambios | < 1 hora | 1 día - 1 semana | 1 semana - 1 mes | > 1 mes |
| Tiempo de restauración | < 1 hora | < 1 día | 1 día - 1 semana | > 1 semana |
| Tasa de fallos en cambios | 0-15% | 16-30% | 16-30% | 16-30% |

Si tu pipeline tiene más de 30 minutos de lead time desde commit hasta producción, ahí está la primera cosa a mejorar.

---

Un buen pipeline es invisible cuando funciona y ruidoso solo cuando algo requiere atención. Si estás pendiente de él, no está haciendo su trabajo.

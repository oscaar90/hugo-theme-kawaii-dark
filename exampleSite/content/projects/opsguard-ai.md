---
title: "OpsGuard-AI"
description: "GitHub Action con doble barrera de seguridad para detectar secretos y vulnerabilidades en Pull Requests antes de que lleguen a producción."
date: 2025-01-15
tools: ["Python", "OpenRouter", "GitHub Actions", "Docker", "Regex"]
repo: "https://github.com/tuusuario/opsguard-ai"
---

## El problema

Los secretos se cuelan en el código. No por negligencia, sino porque los flujos de revisión manual no escalan. Un token de API en un commit, una clave hardcodeada en un script de configuración: el daño está hecho antes de que nadie lo vea.

Las soluciones existentes son o demasiado ruidosas (falsos positivos que nadie lee) o demasiado caras para un equipo pequeño.

## La solución

OpsGuard-AI implementa dos barreras en secuencia:

**Gate 1 — Gatekeeper local (regex):** Analiza el diff del PR con reglas deterministas. Rápido, sin coste, sin enviar nada a ninguna API. Si encuentra algo, bloquea en el acto.

**Gate 2 — AI Brain (LLM):** Solo si el Gate 1 no bloquea, el diff se envía a un modelo de lenguaje vía OpenRouter para análisis semántico. Detecta vulnerabilidades de lógica que el regex no puede ver.

El diff se trunca a 30KB para controlar el coste. Si el análisis falla por cualquier motivo, el resultado es BLOCK — fallo cerrado, nunca permisivo.

## Arquitectura

```
Git Diff → Gate 1 (regex) → Gate 2 (LLM) → Veredicto
```

- `src/ingest.py` — extrae el diff del contexto de GitHub Actions o git local
- `src/security.py` — detección determinista con reglas cargadas desde `opsguard.yml`
- `src/ai.py` — análisis semántico vía OpenRouter, devuelve JSON estructurado
- `src/main.py` — orquestador CLI, exit code 1 en violaciones
- `src/console_ui.py` — UI de terminal con Rich

## Uso

```yaml
- uses: tuusuario/opsguard-ai@v1
  with:
    api_key: ${{ secrets.OPENROUTER_API_KEY }}
    risk_threshold: medium
```

## Estado

Funcional. En uso como proyecto de TFM convertido en herramienta open source.

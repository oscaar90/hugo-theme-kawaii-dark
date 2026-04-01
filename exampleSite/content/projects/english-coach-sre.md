---
title: "English Coach SRE"
description: "CLI de aprendizaje de inglés técnico para profesionales de infraestructura. Sesiones estructuradas, vocabulario SRE, repetición espaciada y simulación de entrevistas."
date: 2025-02-01
tools: ["Python", "OpenRouter", "SQLite", "Typer", "SM-2"]
repo: "https://github.com/tuusuario/english-coach-sre"
---

## El problema

Los ingenieros de infraestructura necesitan inglés técnico específico: incidentes, postmortems, entrevistas con hiring managers de otros países. Los métodos genéricos de aprendizaje no enseñan a explicar un RCA ni a defender una decisión de arquitectura en inglés.

## La solución

CLI con sesiones de 60-90 minutos estructuradas en bloques pedagógicos. Tres niveles de modelo LLM según la complejidad de la tarea — no se usa el modelo más caro para todo.

El vocabulario es específico de SRE: SLOs, runbooks, blast radius, on-call, postmortem sin culpables.

## Arquitectura

```
CLI → Router (tier selection) → OpenRouter API
                ↓
          SQLite (~/.english-coach)
```

- `router.py` — tres tiers: CHEAP (Llama 3.1 8B), STRONG (Claude 3.5 Sonnet), BRUTE (Claude 3 Opus)
- `storage.py` — esquema SQLite con 6 tablas: sessions, vocab, reviews, interview attempts
- `planner.py` — sesiones estructuradas con 7 bloques pedagógicos
- `srs.py` — algoritmo SM-2 para revisión espaciada de vocabulario
- `anti_cheat.py` — detecta uso de traductores, fuerza respuestas en inglés
- `interview_simulator.py` — 5 modos: presentación, rol técnico, incidente, herramientas, RRHH

## Estado

En uso activo para preparación de entrevistas técnicas en inglés.

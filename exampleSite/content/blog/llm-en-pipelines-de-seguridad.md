---
title: "LLMs en pipelines de seguridad: cómo no construir un teatro de seguridad con IA"
date: 2025-03-05
tags: ["ia", "seguridad", "llm", "cicd", "opsguard"]
description: "Poner un LLM en tu pipeline no te da seguridad. Te da la apariencia de seguridad con el coste añadido de un modelo. Aquí cómo hacerlo bien."
author: "Óscar Sánchez Pérez"
---

{{< figure src="https://picsum.photos/seed/llm-security/900/360" caption="Un LLM analizando código no reemplaza a un SAST. Lo complementa en lo que el regex no puede capturar." >}}

Desde que los LLMs se volvieron accesibles por API, he visto tres patrones de adopción en pipelines de seguridad:

1. **El entusiasta sin criterio.** Manda todo el código al modelo y confía en lo que le dice.
2. **El escéptico total.** "Los modelos alucinan, no me fío."
3. **El que entiende cuándo usar cada herramienta.** Usa regex para lo determinista, LLM para lo semántico.

El tercero es el único que construye algo útil.

---

## Por qué el regex solo no es suficiente

Los patrones deterministas son buenos detectando lo que sabes que buscas:

```python
# Detecta claves de AWS con formato exacto
AWS_KEY_PATTERN = re.compile(r'AKIA[0-9A-Z]{16}')

# Detecta tokens JWT
JWT_PATTERN = re.compile(r'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+')
```

Pero no detectan esto:

```python
# El regex no sabe que esto es una contraseña hardcodeada
db_config = {
    "host": "produccion.interno",
    "password": "Verano2024!"
}

# Ni esto
API_ENDPOINT = "https://api.servicio.com/v1?token=" + TOKEN_PRODUCCION
```

El LLM entiende el contexto. Sabe que `"Verano2024!"` en un dict de configuración de base de datos es una contraseña. El regex no, a menos que lo hayas anticipado.

---

## El problema de mandar todo al modelo

### Coste

Un diff grande de un PR real puede tener 5.000-15.000 tokens. A precios actuales de Claude o GPT-4, eso es €0.05-€0.15 por análisis. En un equipo con 100 PRs al día, estás gastando €5-15 diarios solo en análisis de seguridad.

### Privacidad

Si mandas el diff completo al modelo, estás mandando código propietario a una API externa. Para muchos entornos regulados, eso no es aceptable.

### Latencia

Una llamada a un LLM añade 2-8 segundos al pipeline. Multiplicado por todos los PRs, suma.

---

## La arquitectura de dos puertas

```
Diff del PR
     │
     ▼
┌─────────────────────────┐
│  Gate 1: Regex local    │  ← Nunca sale de tu máquina
│  - Patrones de secretos │
│  - Blocklist de reglas  │
│  - Sin latencia         │
└────────────┬────────────┘
             │ Solo pasa si Gate 1 es OK
             ▼
┌─────────────────────────┐
│  Gate 2: LLM            │  ← Solo lo que el regex no puede ver
│  - Análisis semántico   │
│  - Contexto del código  │
│  - Diff truncado 30KB   │
└────────────┬────────────┘
             │
             ▼
         Veredicto
     PASS / BLOCK / WARN
```

El orden importa. Si el diff contiene un secreto y lo mandas al modelo, ya has enviado el secreto a una API externa. Gate 1 primero, siempre.

---

## El prompt que funciona

```
Analiza el siguiente diff de código buscando problemas de seguridad que NO sean
secretos hardcodeados (eso ya lo ha revisado otro sistema).

Busca específicamente:
- Inyección SQL o de comandos
- Deserialización insegura
- Permisos excesivos
- Lógica de autenticación defectuosa
- Exposición de datos sensibles en logs

Responde SOLO en JSON con este esquema:
{
  "verdict": "PASS|BLOCK|WARN",
  "findings": [
    {
      "severity": "HIGH|MEDIUM|LOW",
      "description": "descripción concisa del problema",
      "line_hint": "fragmento de código relevante"
    }
  ],
  "reasoning": "explicación breve del veredicto"
}
```

La respuesta en JSON estructurado es crítica. Si el modelo responde en prosa y el parser falla, el sistema debería bloquear — no aprobar.

---

## Fail-closed: el principio que no es negociable

```python
def analyze_diff(diff: str) -> Verdict:
    try:
        response = call_llm(diff)
        return parse_verdict(response)
    except LLMTimeout:
        return Verdict.BLOCK  # Timeout → bloquear
    except JSONParseError:
        return Verdict.BLOCK  # Respuesta malformada → bloquear
    except APIError:
        return Verdict.BLOCK  # Error de API → bloquear
```

Si el análisis falla por cualquier motivo, el PR no pasa. Un sistema de seguridad que falla abierto no es un sistema de seguridad.

---

## Lo que el LLM no puede reemplazar

- Code review humano para lógica de negocio
- SAST estático con reglas específicas del dominio
- Pruebas de penetración
- Revisión de arquitectura de seguridad

El LLM en el pipeline es una capa más, no la última. Complementa, no reemplaza.

---

> Poner un LLM en tu pipeline de seguridad es fácil. Hacerlo de forma que aporte valor real sin convertirse en un punto de fallo o en un gasto injustificado — eso requiere pensar antes de implementar.

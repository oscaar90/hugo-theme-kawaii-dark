---
title: "Lo que aprendí migrando bases de datos en la fusión bancaria más grande de España"
date: 2025-03-25
tags: ["sql-server", "migracion", "produccion", "fiabilidad", "grafana"]
description: "2021. Bankia y CaixaBank. 200+ instancias de SQL Server. SLA al milímetro. Lo que aprendes cuando el margen de error es cero."
author: "Óscar Sánchez Pérez"
---

{{< figure src="https://picsum.photos/seed/bank-migration/900/400" caption="Monitorización en tiempo real durante la ventana de migración. Cada punto en el dashboard representaba una decisión." >}}

Hay proyectos que te cambian la forma de entender la fiabilidad. Este fue uno de ellos.

2021. Bankia y CaixaBank se fusionan. Es la fusión bancaria más grande de la historia de España. Logicalis era el proveedor de infraestructura de Bankia. Nuestro equipo era responsable de que todas las bases de datos de Bankia migraran correctamente a la infraestructura de CaixaBank.

No estábamos en las decisiones de negocio. Estábamos en la ejecución técnica. Y en ese tipo de proyectos, la ejecución es todo.

---

## El contexto técnico

- **200+ instancias SQL Server** en distintos entornos y versiones
- **SQL Server Always On** para alta disponibilidad — clusters de dos o tres nodos
- **Flujo de migración**: TEST → validación compliance → PRE → validación compliance → ventana de producción
- **Ventana de producción**: fuera de horario laboral, con el cliente en línea, sin margen para errores no planificados

Cada paso del flujo requería validación de compliance antes de avanzar al siguiente. Cero fallos tolerados en esa validación.

---

## El problema de tener información desincronizada

Antes de la monitorización centralizada, cada miembro del equipo tenía su propia visión del estado de las migraciones. Uno miraba un servidor. Otro miraba otro. Las discusiones sobre el estado real consumían tiempo que no teníamos.

La solución fue construir un dashboard en **Grafana + InfluxDB** que mostrara en tiempo real el estado de cada clúster:

```sql
-- Query para estado de los nodos Always On
SELECT
    ag.name AS availability_group,
    ar.replica_server_name,
    ars.role_desc,
    ars.operational_state_desc,
    ars.synchronization_health_desc,
    ars.connected_state_desc
FROM sys.availability_groups ag
JOIN sys.availability_replicas ar ON ag.group_id = ar.group_id
JOIN sys.dm_hadr_availability_replica_states ars ON ar.replica_id = ars.replica_id
```

El dashboard mostraba:
- **Nodo primario de cada clúster** — quién tiene el rol principal en cada momento
- **Estado de sincronización** — si los secundarios están al día
- **Espacio disponible** — alertas si algún volumen superaba el 80% de uso
- **Estado por entorno** — TEST, PRE, PROD agrupados visualmente

Cuando la información es la misma para todos, las discusiones sobre el estado desaparecen. Solo quedan las decisiones.

---

## Lo que aprendí sobre las ventanas de mantenimiento

### El plan escrito es el plan que se ejecuta

Cada ventana de producción tenía un runbook detallado, validado antes de empezar:

1. Verificación de estado de todos los nodos (pre-checks)
2. Procedimiento paso a paso con responsables asignados
3. Criterios de éxito explícitos para cada paso
4. Procedimiento de rollback con tiempo estimado
5. Criterios para decidir abortar la migración

La última parte es la más importante. Antes de empezar, todo el mundo sabía cuándo parar. No durante el incidente, cuando la presión nubla el juicio.

### Comunicación estructurada durante la ventana

```
Canal de Slack dedicado durante la ventana:
- Updates de estado cada 15 minutos aunque no haya novedades
- Formato fijo: [HORA] [ENTORNO] Estado: OK/PENDIENTE/INCIDENCIA
- Sin debates en el canal principal — para eso hay un canal de coordinación separado
```

### El post-migración importa tanto como la migración

Verificar que la migración terminó bien no es suficiente. Tienes que verificar que los sistemas dependientes funcionan correctamente con el nuevo entorno:

- Aplicaciones conectando a las nuevas instancias
- Jobs nocturnos con las nuevas cadenas de conexión
- Backups apuntando a los nuevos volúmenes
- Alertas monitorizando los nuevos hosts

---

## Lo que cambiaría si lo hiciera hoy

**Automatización de pre-checks.** Los verificábamos manualmente antes de cada ventana. Con un script de validación ejecutado en CI, el proceso sería más rápido y consistente.

**Smoke tests automatizados post-migración.** La verificación manual funciona, pero un conjunto de queries de validación ejecutadas automáticamente da más confianza y libera atención para lo que realmente necesita criterio humano.

**Dashboards de comparación antes/después.** Tener métricas históricas de las instancias de origen y compararlas con las de destino en tiempo real habría acelerado la validación.

---

## La lección que me quedó

En proyectos con SLA al milímetro, la fiabilidad no viene de ser el mejor técnico en la sala. Viene de tener procesos claros, información compartida en tiempo real y acuerdos explícitos sobre cuándo parar.

Los héroes que "arreglan todo" en el último momento son el síntoma de que el proceso falló. El objetivo es no necesitar héroes.

---

> La diferencia entre una migración que sale bien y una que se convierte en incidente no suele ser técnica. Es la diferencia entre haber planificado los escenarios de fallo y no haberlos planificado.

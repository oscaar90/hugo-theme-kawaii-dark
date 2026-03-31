---
title: "Terraform no es documentación: es infraestructura real con consecuencias reales"
date: 2025-01-22
tags: ["terraform", "iac", "automatizacion", "devops"]
description: "Demasiados equipos tratan Terraform como si fuera un README glorificado. Es código que borra bases de datos en producción si se lo pides mal."
author: "Óscar Sánchez Pérez"
---

Hay una línea en cualquier proyecto de Terraform que me hace detenerme siempre:

```hcl
resource "aws_db_instance" "main" {
  ...
  skip_final_snapshot = true
  deletion_protection = false
}
```

Alguien, en algún momento, tomó la decisión de escribir eso. Probablemente porque era más rápido. Probablemente en un entorno de dev. Probablemente sin pensar que ese bloque iba a terminar en producción.

## El problema no es Terraform

Terraform hace exactamente lo que le pides. Si le pides que borre una base de datos sin snapshot, la borra. Sin preguntar. Sin dudar.

El problema es que tratamos la infraestructura como código pero no le damos las mismas garantías que al código de aplicación.

---

## Lo mínimo que no es negociable

### `terraform plan` en CI, siempre

```yaml
# .github/workflows/terraform.yml
- name: Terraform Plan
  run: terraform plan -out=tfplan

- name: Upload Plan
  uses: actions/upload-artifact@v3
  with:
    name: tfplan
    path: tfplan
```

Nadie hace `terraform apply` sin haber revisado el plan. El plan va al PR como artefacto. El `apply` solo ocurre después del merge, con el plan aprobado.

### State en remote, con locking

```hcl
terraform {
  backend "s3" {
    bucket         = "mi-empresa-terraform-state"
    key            = "produccion/terraform.tfstate"
    region         = "eu-west-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}
```

State local es una bomba de tiempo. Cuando dos personas hacen `apply` a la vez sin locking, el state se corrompe y pasas el resto del día reconstruyendo qué hay realmente desplegado.

### Workspaces o directorios por entorno

Nunca un mismo state para dev y producción. Nunca.

```
infraestructura/
├── envs/
│   ├── dev/
│   │   ├── main.tf
│   │   └── terraform.tfvars
│   ├── staging/
│   │   ├── main.tf
│   │   └── terraform.tfvars
│   └── produccion/
│       ├── main.tf
│       └── terraform.tfvars
└── modules/
    ├── rds/
    ├── eks/
    └── networking/
```

---

## Los recursos que más duele destruir accidentalmente

| Recurso | Consecuencia de un `destroy` accidental | Tiempo de recuperación |
|---------|-----------------------------------------|------------------------|
| `aws_db_instance` | Pérdida de datos si no hay snapshot | Horas o días |
| `aws_s3_bucket` | Pérdida de objetos si versioning off | Irreversible |
| `aws_vpc` | Caída de toda la red | 30-60 minutos |
| `kubernetes_namespace` | Baja de todos los workloads del namespace | 5-20 minutos |

Para los tres primeros: `lifecycle { prevent_destroy = true }`. Sin excepciones en producción.

```hcl
resource "aws_db_instance" "main" {
  # ...

  lifecycle {
    prevent_destroy = true
  }
}
```

---

## El drift silencioso

El problema que no ves hasta que es tarde: alguien fue a la consola de AWS a "arreglar algo rápido" y no lo metió en Terraform. Ahora el estado real difiere del estado declarado.

```bash
# Detectar drift
terraform plan -detailed-exitcode
# Exit code 0: sin cambios
# Exit code 1: error
# Exit code 2: hay cambios (drift)
```

Ejecuta esto en CI de forma periódica. Si hay drift, falla el pipeline y alguien tiene que reconciliarlo.

---

> La infraestructura como código no significa que escribas código sobre tu infraestructura. Significa que tu infraestructura *es* el código, con todo lo que eso implica: revisiones, tests, historial, reversión.

Si tu pipeline de Terraform no tiene las mismas garantías que tu pipeline de aplicación, no tienes IaC. Tienes scripts glorificados con HCL.

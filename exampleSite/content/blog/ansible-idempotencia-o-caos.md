---
title: "Ansible: idempotencia o caos"
date: 2025-03-18
tags: ["ansible", "automatizacion", "infraestructura", "iac"]
description: "Un playbook de Ansible que no es idempotente no es automatización. Es un script bash con YAML y esperanza."
author: "Óscar Sánchez Pérez"
---

![Servidores siendo configurados con Ansible](https://picsum.photos/seed/ansible-config/900/350)

El concepto central de Ansible es la idempotencia: ejecutar el playbook una vez o diez veces debería producir exactamente el mismo resultado. Si no es así, tienes un problema que se manifestará en el peor momento posible.

---

## Qué significa idempotencia en la práctica

```yaml
# ❌ No idempotente — añade la línea cada vez que se ejecuta
- name: Añadir entrada a crontab
  shell: echo "0 2 * * * /usr/local/bin/backup.sh" >> /etc/crontab

# ✅ Idempotente — solo añade si no existe
- name: Añadir tarea de backup al cron
  cron:
    name: "backup diario"
    minute: "0"
    hour: "2"
    job: "/usr/local/bin/backup.sh"
    user: root
```

La diferencia: si ejecutas el primero 10 veces, tendrás 10 líneas en el crontab. Si ejecutas el segundo 10 veces, tendrás exactamente una.

---

## Los módulos que debes usar siempre que puedas

| En lugar de `shell`/`command` | Usa este módulo |
|-------------------------------|-----------------|
| `apt-get install nginx` | `ansible.builtin.apt` |
| `systemctl enable nginx` | `ansible.builtin.service` |
| `useradd deploy` | `ansible.builtin.user` |
| `mkdir -p /opt/app` | `ansible.builtin.file` |
| `echo "..." >> /etc/hosts` | `ansible.builtin.lineinfile` |
| `scp config.j2 server:/etc/app/` | `ansible.builtin.template` |

Los módulos de Ansible verifican el estado actual antes de actuar. El módulo `apt` no instala si el paquete ya está instalado. El módulo `user` no crea el usuario si ya existe.

---

## La estructura que escala

```
ansible/
├── inventories/
│   ├── produccion/
│   │   ├── hosts.yml
│   │   └── group_vars/
│   │       ├── all.yml
│   │       └── webservers.yml
│   └── staging/
│       ├── hosts.yml
│       └── group_vars/
│           └── all.yml
├── roles/
│   ├── common/
│   │   ├── tasks/
│   │   │   └── main.yml
│   │   ├── handlers/
│   │   │   └── main.yml
│   │   └── templates/
│   │       └── sshd_config.j2
│   ├── nginx/
│   └── postgresql/
└── playbooks/
    ├── site.yml
    ├── webservers.yml
    └── databases.yml
```

Un rol por responsabilidad. Nunca un playbook de 500 líneas que hace todo.

---

## Variables y secretos

```yaml
# group_vars/all.yml — variables no sensibles
app_user: deploy
app_dir: /opt/mi-app
app_port: 8080

# Secretos: NUNCA en texto plano en el repositorio
# Usar Ansible Vault
ansible-vault encrypt_string 'mi-password-secreto' --name 'db_password'
```

```yaml
# group_vars/produccion/vault.yml — cifrado con Ansible Vault
$ANSIBLE_VAULT;1.1;AES256
62333136303930326463326639323764303862613365316238623237626232...
```

```bash
# Ejecutar con la clave del vault
ansible-playbook playbooks/site.yml --vault-password-file ~/.vault_pass
```

---

## Handlers: solo recarga cuando algo cambió

```yaml
# roles/nginx/tasks/main.yml
- name: Copiar configuración de nginx
  template:
    src: nginx.conf.j2
    dest: /etc/nginx/nginx.conf
  notify: reload nginx   # Solo se ejecuta si la tarea cambió algo

# roles/nginx/handlers/main.yml
- name: reload nginx
  service:
    name: nginx
    state: reloaded
```

Si la configuración no cambió, el handler no se ejecuta. Si cambió, nginx se recarga una sola vez al final del play — no en cada tarea que lo notifique.

---

## El check mode: tu red de seguridad

```bash
# Ver qué haría el playbook sin ejecutarlo
ansible-playbook site.yml --check --diff

# Limitar a un host específico
ansible-playbook site.yml --limit servidor-prod-01 --check --diff
```

El `--diff` muestra exactamente qué ficheros cambiarían y cómo. Úsalo antes de aplicar cambios en producción. Siempre.

---

## Lo que distingue un playbook profesional

- **Tags** para ejecutar partes específicas: `ansible-playbook site.yml --tags nginx`
- **`when`** para condicionales explícitas, no lógica oculta
- **`block`/`rescue`/`always`** para manejo de errores
- **Testeo con Molecule** antes de desplegar en producción

```yaml
- block:
    - name: Instalar dependencias
      apt:
        name: "{{ packages }}"
        state: present

    - name: Arrancar servicio
      service:
        name: mi-app
        state: started

  rescue:
    - name: Notificar fallo
      slack:
        token: "{{ slack_token }}"
        msg: "Deploy fallido en {{ inventory_hostname }}"

  always:
    - name: Limpiar ficheros temporales
      file:
        path: /tmp/deploy
        state: absent
```

---

> Ansible es tan bueno como los que escriben los playbooks. La herramienta te deja escribir código terrible o código sólido. La diferencia está en entender la idempotencia no como una característica del tool, sino como una disciplina de quien lo usa.

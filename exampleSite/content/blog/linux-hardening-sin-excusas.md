---
title: "Linux hardening sin excusas: lo básico que muchos equipos ignoran"
date: 2025-02-14
tags: ["linux", "seguridad", "hardening", "sre"]
description: "El 80% de los compromisos de seguridad en servidores Linux vienen de configuraciones por defecto que nadie cambió. Aquí lo que hay que hacer antes de exponer un servidor."
author: "Óscar Sánchez Pérez"
---

![Servidor Linux con terminal](https://picsum.photos/seed/linux-security/900/380)

Hay servidores en producción con SSH abierto en el puerto 22 y acceso por contraseña habilitado. Hay servidores con usuarios sin expiración de contraseña. Hay servidores donde root puede entrar directamente por SSH.

No porque el equipo no sepa que es un problema. Sino porque "cuando tengamos tiempo lo arreglamos".

El tiempo nunca llega. El compromiso, a veces, sí.

---

## SSH: el primer punto de entrada

```bash
# /etc/ssh/sshd_config

# Deshabilitar login con contraseña — solo claves
PasswordAuthentication no
ChallengeResponseAuthentication no

# No permitir login directo como root
PermitRootLogin no

# Limitar usuarios con acceso SSH
AllowUsers deploy ansible

# Cambiar el puerto (oscuridad, no seguridad, pero reduce ruido en logs)
Port 2222

# Tiempo máximo de autenticación
LoginGraceTime 30

# Máximo de intentos antes de desconectar
MaxAuthTries 3

# Deshabilitar forwarding si no se necesita
X11Forwarding no
AllowAgentForwarding no
```

Después de cambiar:

```bash
systemctl reload sshd
# Verifica que puedes entrar ANTES de cerrar la sesión actual
```

---

## Fail2ban: bloquear fuerza bruta automáticamente

```bash
apt install fail2ban

# /etc/fail2ban/jail.local
[DEFAULT]
bantime  = 3600     # 1 hora bloqueado
findtime = 600      # ventana de 10 minutos
maxretry = 5        # intentos antes de ban

[sshd]
enabled = true
port    = 2222      # el puerto que configuraste
```

```bash
systemctl enable --now fail2ban

# Verificar estado
fail2ban-client status sshd
```

---

## Firewall: principio de mínimo privilegio

```bash
# UFW — simple y efectivo para la mayoría de casos
ufw default deny incoming
ufw default allow outgoing

# Solo abrir lo necesario
ufw allow 2222/tcp   # SSH
ufw allow 443/tcp    # HTTPS
ufw allow 80/tcp     # HTTP (solo si necesitas redirect)

ufw enable
ufw status verbose
```

Si tienes más servicios, ábelos explícitamente. Si no sabes para qué sirve un puerto abierto, ciérralo.

---

## Actualizaciones automáticas de seguridad

```bash
apt install unattended-upgrades

# /etc/apt/apt.conf.d/50unattended-upgrades
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
};

Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";  # Decide tú cuándo reiniciar
Unattended-Upgrade::Mail "sre@tuempresa.com";
```

Solo parches de seguridad, no actualizaciones generales. Los reinicios, manuales — no quieres que tu servidor de producción se reinicie solo.

---

## Auditoría: saber quién hizo qué

```bash
apt install auditd

# Reglas básicas de auditoría
# /etc/audit/rules.d/audit.rules

# Cambios en archivos de autenticación
-w /etc/passwd -p wa -k identity
-w /etc/shadow -p wa -k identity
-w /etc/sudoers -p wa -k sudoers

# Comandos ejecutados como root
-a always,exit -F arch=b64 -F euid=0 -S execve -k root_commands

# Conexiones de red
-a always,exit -F arch=b64 -S connect -k network_connect
```

```bash
systemctl enable --now auditd

# Ver eventos
ausearch -k identity --start today
```

---

## El checklist mínimo antes de exponer un servidor

- [ ] SSH por clave, no contraseña
- [ ] Root SSH deshabilitado
- [ ] Fail2ban activo
- [ ] Firewall configurado con mínimos puertos
- [ ] Actualizaciones de seguridad automáticas
- [ ] Auditd activo
- [ ] Sin usuarios con contraseña vacía (`awk -F: '($2 == "") {print $1}' /etc/shadow`)
- [ ] SUID/SGID revisados (`find / -perm /6000 -type f 2>/dev/null`)

---

> La seguridad no es un proyecto. Es una configuración que haces una vez bien, automatizas para que no se pierda, y monitorizas para saber si alguien intentó saltársela.

El hardening básico no es difícil. Lo que es difícil es acordarse de hacerlo antes de que alguien lo explote.

---
name: Git Sync Workflow
description: Automates pulling from git.
trigger: always_on
---
# Sincronización Automática
Como el usuario trabaja en dos computadoras, siempre que inicie una sesión, pregunte por dónde nos quedamos, o pida empezar a trabajar:
1. Ejecuta inmediatamente 'git pull origin main --rebase'.
2. Ejecuta 'git log -1' para decirle cuál fue el último cambio registrado.

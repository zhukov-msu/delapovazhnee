#!/usr/bin/env bash
# Запускается НА VDS из каталога приложения (после rsync в deploy.yml).
# Обновляет venv/зависимости и перезапускает сервис. Идемпотентно.
set -euo pipefail

# venv на системном python3 (Ubuntu 26.04) либо python3.12, если он установлен отдельно.
# Приложению нужен Python >= 3.10. См. deploy/DEPLOY.md.
if [ ! -d .venv ]; then
  PY="$(command -v python3.12 || command -v python3)"
  "$PY" -m venv .venv
fi
./.venv/bin/pip install --upgrade pip >/dev/null
./.venv/bin/pip install -r requirements.txt

# Каталоги под загруженные вручную бинарники (исключены из rsync) и БД — создаём, если их нет.
mkdir -p static/assets static/sprites/characters static/sprites/items db

# Перезапуск сервиса (systemd). Настраивается один раз — см. deploy/DEPLOY.md.
# Требуется passwordless sudo на эту конкретную команду (sudoers-правило в DEPLOY.md).
sudo systemctl restart delapovazhnee.service
sudo systemctl --no-pager --lines=0 status delapovazhnee.service || true
echo "deploy: done"

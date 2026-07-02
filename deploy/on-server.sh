#!/usr/bin/env bash
# Запускается НА VDS из каталога приложения (после rsync в deploy.yml).
# Обновляет venv/зависимости и перезапускает сервис. Идемпотентно.
set -euo pipefail

# venv на python3.12 (см. deploy/DEPLOY.md по установке интерпретатора на сервере).
if [ ! -d .venv ]; then
  python3.12 -m venv .venv
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

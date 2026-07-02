#!/usr/bin/env bash
# Разовая настройка VDS под Docker-деплой (Ubuntu 26.04). Запустить ОДИН РАЗ под root/sudo:
#   sudo bash bootstrap-vds.sh
# После — впиши /opt/delapovazhnee/.env, добавь публичный деплой-ключ, задай GitHub secrets,
# и пушь тег v* — остальное сделает CI (build -> GHCR -> сервер pull + up).
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/delapovazhnee}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"

echo ">> 1/5 Docker + compose plugin"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi

echo ">> 2/5 Пользователь '$DEPLOY_USER' (вход по ssh-ключу) + группа docker"
if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" "$DEPLOY_USER"
fi
usermod -aG docker "$DEPLOY_USER"
install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"

echo ">> 3/5 Каталог приложения + подкаталоги под ассеты (bind-mount, read-only в контейнере)"
mkdir -p "$APP_DIR"/static/assets \
         "$APP_DIR"/static/sprites/characters \
         "$APP_DIR"/static/sprites/items
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR"

echo ">> 4/5 .env (секреты приложения) — если ещё нет"
if [ ! -f "$APP_DIR/.env" ]; then
  cat > "$APP_DIR/.env" <<'ENV'
PRESAVE_URL=https://ЗАМЕНИ-на-ссылку-пресейва
ADMIN_USER=admin
ADMIN_PASS=ЗАМЕНИ-на-надёжный-пароль
SECRET_KEY=ЗАМЕНИ-на-длинную-случайную-строку
# PUBLIC_BASE_URL=http://ТВОЙ_IP   # для QR; при HTTPS-домене поставь https://домен
ENV
  chown "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR/.env"
  chmod 600 "$APP_DIR/.env"
fi

echo ">> 5/5 (опц.) swap 2G для спокойствия на 2 ГБ RAM"
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

cat <<DONE

Готово. Осталось:
  1) Добавь ПУБЛИЧНЫЙ деплой-ключ в /home/$DEPLOY_USER/.ssh/authorized_keys
     (chmod 600; владелец $DEPLOY_USER).
  2) Впиши реальные значения в $APP_DIR/.env
  3) GitHub secrets: VDS_HOST, VDS_USER=$DEPLOY_USER, VDS_PATH=$APP_DIR,
     VDS_SSH_KEY (приватный), опц. VDS_SSH_PORT, и GHCR_PAT (classic PAT с read:packages).
  4) git tag v1.0.0 && git push origin v1.0.0  — деплой поедет сам.
DONE

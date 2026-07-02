# Деплой на VDS (GitHub Actions по тэгу `v*`)

Пуш тэга вида `v*` (напр. `v1.0.0`, `v0.3`, `v2`) → GitHub Actions прогоняет тесты и деплоит на VDS
по SSH (`.github/workflows/deploy.yml`): `rsync` кода + `deploy/on-server.sh` (venv, зависимости,
перезапуск systemd-сервиса). Обычные push/PR — только тесты (`.github/workflows/ci.yml`).

## 1. GitHub Secrets

Repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Что |
|---|---|
| `VDS_HOST` | IP или домен сервера |
| `VDS_USER` | ssh-пользователь для деплоя (напр. `deploy`) |
| `VDS_PATH` | каталог приложения на сервере, напр. `/opt/delapovazhnee` |
| `VDS_SSH_KEY` | **приватный** ssh-ключ (весь файл, включая `-----BEGIN…END-----`) |
| `VDS_SSH_PORT` | (опц.) порт ssh, если не 22 |

Публичный ключ от `VDS_SSH_KEY` должен лежать в `~/.ssh/authorized_keys` пользователя `VDS_USER` на VDS.
Сгенерировать пару (если нужна отдельная деплой-пара): `ssh-keygen -t ed25519 -f deploy_key -C github-deploy`
— приватный `deploy_key` → в секрет `VDS_SSH_KEY`, `deploy_key.pub` → в `authorized_keys` на сервере.

## 2. Разовая настройка сервера (Ubuntu/Debian; поправь под свой дистрибутив)

```bash
# 2.1 Python 3.12 (Ubuntu 24.04 — уже есть; на 22.04 через deadsnakes)
sudo add-apt-repository -y ppa:deadsnakes/ppa && sudo apt update
sudo apt install -y python3.12 python3.12-venv rsync

# 2.2 Пользователь и каталог
sudo adduser --disabled-password --gecos "" deploy      # если ещё нет
sudo mkdir -p /opt/delapovazhnee && sudo chown deploy:deploy /opt/delapovazhnee
sudo -u deploy mkdir -p /home/deploy/.ssh
# добавить публичный деплой-ключ:
echo 'ssh-ed25519 AAAA... github-deploy' | sudo -u deploy tee -a /home/deploy/.ssh/authorized_keys
sudo -u deploy chmod 600 /home/deploy/.ssh/authorized_keys

# 2.3 Прод-.env (НЕ в git; rsync его не трогает)
sudo -u deploy tee /opt/delapovazhnee/.env >/dev/null <<'ENV'
PRESAVE_URL=https://твоя-ссылка-пресейва
ADMIN_USER=admin
ADMIN_PASS=надёжный-пароль
SECRET_KEY=длинная-случайная-строка
# PUBLIC_BASE_URL=https://delapovazhnee.ru
ENV

# 2.4 systemd-сервис
sudo cp /opt/delapovazhnee/deploy/delapovazhnee.service /etc/systemd/system/delapovazhnee.service
sudo sed -i 's/REPLACE_WITH_DEPLOY_USER/deploy/' /etc/systemd/system/delapovazhnee.service
# (в юните проверь WorkingDirectory/EnvironmentFile/ExecStart — они под /opt/delapovazhnee)
sudo systemctl daemon-reload && sudo systemctl enable delapovazhnee

# 2.5 Разрешить деплой-юзеру перезапуск сервиса без пароля (нужно для on-server.sh)
echo 'deploy ALL=(root) NOPASSWD: /bin/systemctl restart delapovazhnee.service, /bin/systemctl status delapovazhnee.service' \
  | sudo tee /etc/sudoers.d/delapovazhnee-deploy
sudo chmod 440 /etc/sudoers.d/delapovazhnee-deploy
```

Первый код на сервер можно доставить как обычно — пушем тэга `v0.0.1` (Actions сделает rsync + запустит
`on-server.sh`, который создаст venv, поставит зависимости и стартанёт сервис). Либо разово вручную:
`rsync … && cd /opt/delapovazhnee && bash deploy/on-server.sh`.

## 3. Reverse proxy + TLS (рекомендуется)

uvicorn слушает `127.0.0.1:8000`. Перед ним — nginx + Let's Encrypt:

```nginx
server {
    server_name delapovazhnee.ru;
    location / { proxy_pass http://127.0.0.1:8000; proxy_set_header Host $host;
                 proxy_set_header X-Forwarded-For $remote_addr;
                 proxy_set_header X-Forwarded-Proto $scheme; }
}
```
`sudo certbot --nginx -d delapovazhnee.ru` — выпустит и пропишет TLS. (Готов дать полный конфиг —
скажи домен.)

## 4. Ассеты на сервере (переживают деплой)

`rsync --delete` в деплое **исключает** пользовательские бинарники, чтобы не стирать их при выкатке:
`static/assets/` (music.mp3), `static/sprites/characters/`, `static/sprites/items/`, `static/home/cover.*`,
а также `.env` и `db/`. Клади эти файлы прямо на VDS в соответствующие каталоги — они не в git.
(Хочешь возить ассеты через git — скажи, уберу исключения из `deploy.yml`.)

## 5. Выкатка новой версии

```bash
git tag v1.0.0 && git push origin v1.0.0
```
Actions прогонит тесты и задеплоит. Откат — тэг предыдущей версии на нужном коммите (или `git revert`).

## Открытые вопросы
См. корневой `TODO.md` (раздел «деплой / VDS / CI»): дистрибутив VDS, домен/nginx, первый деплой vs
существующий сервис, порт ssh.

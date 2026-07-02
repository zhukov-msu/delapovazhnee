# TODO / открытые вопросы

Живой список недоделок и вопросов по проекту (раннер + пресейв A/B). Обновляется по ходу.

## Недоделанные задачи

- [ ] **Лендинг — редизайн (Задача 15B)** в стиле обложки прошлого сингла (полуночно-синий,
      рваная бумага, рукопись). **Блокер:** нужен файл обложки в `static/home/` (напр. `cover.jpg`).
      Дизайн-направление: `docs/superpowers/specs/2026-07-01-visual-directions.md` §2.
- [ ] **Залить реальные ассеты** (сейчас всё на псевдографике/без звука):
  - [ ] `static/assets/music.mp3` — фоновая музыка (loop, 0.5, есть mute).
  - [ ] `static/sprites/characters/char1.png … char4.png` — 4 персонажа (выбор на старте).
  - [ ] `static/sprites/items/item1.png … item3.png` — ловимые предметы.
  - [ ] `static/home/cover.jpg` — обложка для лендинга.
  - *Подхватываются автоматически при перезагрузке; если файла нет — рисуется псевдографика.*
- [ ] **Финальный code-review всей ветки `game`** (whole-branch) + завершение (мерж в `main` / PR).
- [ ] **Прод-`.env` на сервере:** `PRESAVE_URL` (реальная ссылка), `ADMIN_USER`/`ADMIN_PASS`,
      `SECRET_KEY` (длинная случайная строка), при необходимости `PUBLIC_BASE_URL`.

## Мелочи из ревью (не блокеры — решить при желании)

- [ ] Шрифты игры сейчас с Google Fonts CDN. Хочешь оффлайн/приватность — self-host (положить в `static/`).
- [ ] SFX прыжка/game-over реализованы в `audio.js`, но `sfxJump`/`sfxGameOver` не подключены к событиям
      (в игре сейчас только «блип» на ловле предмета). Подключить при желании.
- [ ] `admin.css` на моноширинном шрифте (админка намеренно простая) — ок, но можно системный.

## Деплой / VDS / CI — решено: Docker + Caddy, по IP (HTTP), приватный образ в GHCR

GitHub Actions настроен (`deploy/DEPLOY.md`): тэг `v*` → тесты → сборка образа → push в GHCR →
сервер `docker compose pull && up -d`. Сборка на раннере GitHub, VDS только тянет (1–2 ГБ хватает).
Твои шаги, чтобы заработало:

- [ ] На VDS (Ubuntu 26.04) один раз: `sudo bash deploy/bootstrap-vds.sh` (ставит Docker, юзера `deploy`,
      каталоги, заготовку `.env`, swap 2G).
- [ ] Публичный деплой-ключ → `authorized_keys` юзера `deploy`: `ssh-copy-id -i ~/.ssh/dp-deploy.pub deploy@IP`.
- [ ] Прод-значения в `/opt/delapovazhnee/.env`: `PRESAVE_URL`, `ADMIN_USER`/`ADMIN_PASS`, `SECRET_KEY`,
      опц. `PUBLIC_BASE_URL=http://IP` (для QR).
- [ ] GitHub Secrets: `VDS_HOST`, `VDS_USER=deploy`, `VDS_PATH=/opt/delapovazhnee`, `VDS_SSH_KEY` (приватный),
      опц. `VDS_SSH_PORT`, и **`GHCR_PAT`** (classic PAT с `read:packages` — сервер тянет приватный образ).
- [ ] Ассеты на VDS: музыку в `static/assets/`, спрайты в `static/sprites/characters|items/` (переживают деплой).
- [ ] Выкатка: `git tag v1.0.0 && git push origin v1.0.0`.

Отложено (когда будет домен):
- [ ] Домен + HTTPS: A-запись → IP, заменить блок `:80` в `deploy/Caddyfile` на домен,
      `PUBLIC_BASE_URL=https://домен` — Caddy сам выпустит и продлит TLS.

## Вопросы по продукту

- [ ] Реальная `PRESAVE_URL` (ссылка пресейва).
- [ ] Фидбек по новым фичам вживую (ловля предметов, рекорд, выбор персонажа).

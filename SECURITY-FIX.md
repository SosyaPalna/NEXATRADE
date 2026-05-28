# 🔒 Инструкция по устранению критических уязвимостей

## Что было подготовлено

| Файл | Назначение |
|------|-----------|
| `nginx.conf` | Обновлённая конфигурация nginx с блокировкой опасных путей и security-заголовками |
| `fix-server.sh` | Скрипт для запуска на сервере (бэкап, установка, перезагрузка) |
| `backend/index.js` | Добавлен rate limiting + cache-control + COEP |
| `backend/middleware/rateLimit.js` | Middleware для ограничения запросов |
| `backend/package.json` | Добавлен `express-rate-limit` |

---

## ⚡ Быстрый старт (3 команды)

### 1. Загрузите изменения на сервер

С локальной машины (где этот репозиторий):

```bash
# Подставьте свой IP сервера
SERVER_IP="YOUR_SERVER_IP"

# Копируем обновлённые файлы
scp nginx.conf root@$SERVER_IP:/var/www/nexatrade/nginx.conf
scp fix-server.sh root@$SERVER_IP:/var/www/nexatrade/fix-server.sh
scp backend/middleware/rateLimit.js root@$SERVER_IP:/var/www/nexatrade/backend/middleware/rateLimit.js
scp backend/index.js root@$SERVER_IP:/var/www/nexatrade/backend/index.js
scp backend/package.json root@$SERVER_IP:/var/www/nexatrade/backend/package.json
```

### 2. Запустите скрипт исправлений на сервере

```bash
ssh root@$SERVER_IP "cd /var/www/nexatrade && chmod +x fix-server.sh && bash fix-server.sh"
```

### 3. Проверьте

```bash
# Проверьте, что .git недоступен (должно быть 404)
curl -I https://nexatrade.ru/.git/config

# Проверьте, что .env недоступен (должно быть 404)
curl -I https://nexatrade.ru/.env

# Проверьте заголовки
curl -I https://nexatrade.ru/health
```

---

## 🔍 Что именно исправлено

### Nginx
- ✅ `server_tokens off;` — скрыта версия nginx
- ✅ `location ~ /\.` — блокировка скрытых файлов (.env, .git, и т.д.)
- ✅ `location ~* \.(bak|sql|log|...)` — блокировка бэкапов и логов
- ✅ Блокировка 30+ опасных путей (`/phpinfo.php`, `/backup.sql`, `/console` и др.)
- ✅ `Permissions-Policy` + `Cross-Origin-Embedder-Policy` заголовки
- ✅ HTTP → HTTPS редирект

### Backend
- ✅ Rate limiting: max 5 попыток логина за 15 минут с одного IP
- ✅ Rate limiting: max 100 API-запросов за 15 минут с одного IP
- ✅ `Cache-Control: no-store` для всех `/api/*` ответов
- ✅ `crossOriginEmbedderPolicy: true` в Helmet

---

## ⚠️ Важно

1. **`.git` на сервере** — скрипт спросит, удалить ли папку `.git`. Рекомендуется удалить, если на сервере не нужен git. Если нужен — nginx уже блокирует доступ к ней.

2. **`.env` в корне** — проверьте, нет ли `.env*` файлов в `/var/www/nexatrade/` (не в `backend/`!). Если есть — удалите.

3. **CSP `unsafe-inline`** — оставлен для совместимости с текущим фронтендом. Полное удаление потребует рефакторинга inline-скриптов.

4. **CAPTCHA** — не добавлена в этом фиксе (требует регистрации reCAPTCHA/hCaptcha ключей).

---

## 🔄 Альтернатива: git pull + ручной запуск

Если вы обновляете через git:

```bash
ssh root@YOUR_SERVER_IP
cd /var/www/nexatrade
git pull origin main
bash fix-server.sh
```

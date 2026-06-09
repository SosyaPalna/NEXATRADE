# 🚀 Пошаговая инструкция по деплою NexaTrade на VPS

> **Для чего эта инструкция:** чтобы развернуть проект NexaTrade на собственном сервере (VPS) с доменом и SSL.
>
> **Время:** ~30–40 минут первый раз, последующие обновления — 2 минуты.

---

## 📋 Что понадобится

| Что | Где взять | Примерная цена |
|-----|-----------|----------------|
| VPS (сервер) | [Timeweb](https://timeweb.cloud), [Selectel](https://selectel.ru), [Hetzner](https://hetzner.com), [Beget](https://beget.com) | 300–500 ₽/мес |
| Домен | [Reg.ru](https://reg.ru), [Beget](https://beget.com) | 200–500 ₽/год |
| SSH-клиент | Встроен в macOS/Linux, [PuTTY](https://putty.org) для Windows | бесплатно |

**Минимальные требования к VPS:**
- 1 CPU ядро
- 1–2 GB RAM
- 15–20 GB SSD
- Ubuntu 22.04 LTS (рекомендуется)

---

## Шаг 1. Подключение к серверу

После покупки VPS хостер пришлёт данные для подключения: IP-адрес, логин (обычно `root`) и пароль.

**macOS / Linux:**
```bash
ssh root@YOUR_SERVER_IP
```

**Windows (PowerShell):**
```powershell
ssh root@YOUR_SERVER_IP
```

Введите пароль. Если спросит `Are you sure you want to continue connecting?` — напишите `yes`.

---

## Шаг 2. Обновление системы и установка зависимостей

Выполняйте команды по очереди.

```bash
# Обновление пакетов
apt update && apt upgrade -y

# Установка базовых утилит
apt install -y curl git nginx certbot python3-certbot-nginx ufw

# Установка Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Проверка версий
node -v    # должно быть v20.x.x
npm -v     # должно быть 10.x.x

# Установка PM2 (менеджер процессов)
npm install -g pm2
```

---

## Шаг 3. Установка и настройка PostgreSQL

```bash
apt install -y postgresql postgresql-contrib

# Переключаемся на пользователя postgres
su - postgres

# Заходим в консоль PostgreSQL
psql
```

Внутри консоли PostgreSQL выполни:

```sql
CREATE USER nexatrade WITH PASSWORD '908319abc';
CREATE DATABASE nexatrade_db OWNER nexatrade;
GRANT ALL PRIVILEGES ON DATABASE nexatrade_db TO nexatrade;
\q
```

Выйди из пользователя postgres:
```bash
exit
```

Проверь, что БД работает:
```bash
sudo -u postgres psql -c "\l"
```

---

## Шаг 4. Настройка фаервола

```bash
# Разрешить SSH, HTTP и HTTPS
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable

# Проверь статус
ufw status
```

Должно быть что-то вроде:
```
Status: active
To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere
Nginx Full                 ALLOW       Anywhere
```

---

## Шаг 5. Клонирование проекта

```bash
# Создаём папку для проекта
mkdir -p /var/www
cd /var/www

# Клонируем репозиторий (замени на свой URL)
git clone https://github.com/SosyaPalna/NEXATRADE.git

cd nexatrade
```

---

## Шаг 6. Настройка переменных окружения (.env)

```bash
cp .env.example backend/.env
nano backend/.env
```

Откроется текстовый редактор. Заполни файл:

```env
# PostgreSQL (из шага 3)
DATABASE_URL="postgresql://nexatrade:придумай_сложный_пароль@localhost:5432/nexatrade_db?schema=public"

# JWT Secret — сгенерируй командой:
# openssl rand -base64 32
JWT_SECRET="здесь_должен_быть_длинный_случайный_ключ"

# Сервер
PORT=8000
NODE_ENV=production

# Твой домен (с https://)
FRONTEND_URL="https://твой-домен.ru"
```

**Как сгенерировать JWT_SECRET:**
```bash
sOUbEZUVqPX+z6Xo7ahVD/QYaxNyXwYmUJp1yLHZ6jw=
```

Сохрани файл в nano: `Ctrl+O`, затем `Enter`, затем `Ctrl+X`.

---

## Шаг 7. Настройка Prerender.io (SEO)

Для того чтобы поисковые системы (Яндекс, Google) видели отрендеренный HTML вместо пустого SPA-shell, подключим [Prerender.io](https://prerender.io):

### 7.1 Регистрация и получение токена

1. Зарегистрируйся бесплатно на https://prerender.io
2. Добавь свой домен
3. Скопируй **Prerender Token** из личного кабинета

### 7.2 Добавление токена в .env

Открой `backend/.env` и добавь строку:

```env
PRERENDER_TOKEN="your-prerender-token-here"
```

### 7.3 Как это работает

Когда поисковый робот (Googlebot, YandexBot и др.) заходит на сайт:
1. Бэкенд определяет User-Agent бота
2. Отправляет URL на сервера Prerender.io
3. Prerender.io рендерит страницу в статический HTML (включая все meta-теги и микроразметку)
4. Отдаёт HTML роботу

Обычные пользователи продолжают получать обычный SPA.

### 7.4 Проверка работы Prerender

После деплоя проверь, что бот получает отрендеренный HTML:

```bash
# Эмулируем Googlebot
curl -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" \
  https://твой-домен.ru/products

# В ответе должен быть полный HTML со всеми <meta>, <h1> и текстом,
# а не пустой <div id="root"></div>
```

Также можно проверить через онлайн-сервис:
- https://prerender.io/tools/seo-inspector/
- Яндекс.Вебмастер → «Проверка ответа сервера»

---

## Шаг 8. Сборка и запуск проекта

### 7.1 Установка зависимостей и сборка фронтенда

```bash
# Установка зависимостей фронтенда
cd /var/www/nexatrade/frontend
npm ci

# Сборка production-бандла
npm run build
```

Должно появиться сообщение `built in ...ms` и папка `frontend/dist`.

### 7.2 Установка зависимостей бэкенда

```bash
cd /var/www/nexatrade/backend
npm ci --production
```

### 7.3 Применение миграций базы данных

```bash
cd /var/www/nexatrade/backend
npx prisma generate
npx prisma migrate deploy
```

Если миграций ещё нет (первый деплой), используй:
```bash
npx prisma db push
```

### 7.4 Запуск через PM2

```bash
cd /var/www/nexatrade
pm2 start ecosystem.config.js --env production

# Сохранить конфигурацию PM2
pm2 save

# Настроить автозапуск при перезагрузке сервера
pm2 startup systemd
```

Последняя команда выведет что-то вроде:
```bash
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root
```

**Скопируй и выполни эту команду тоже.**

Проверь, что приложение работает:
```bash
curl http://localhost:8000/health
```

Должно вернуть: `{"status":"ok","service":"nexatrade-backend"}`

---

## Шаг 9. Настройка Nginx

### 8.1 Подготовка конфига

```bash
cd /var/www/nexatrade

# Замени your-domain.com на свой домен
sed -i 's/your-domain.com/твой-домен.ru/g' nginx.conf
sed -i 's/www.your-domain.com/www.твой-домен.ru/g' nginx.conf

# Копируем конфиг в nginx
cp nginx.conf /etc/nginx/sites-available/nexatrade
ln -sf /etc/nginx/sites-available/nexatrade /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Проверяем синтаксис
nginx -t
```

Если всё ок, перезагружаем nginx:
```bash
systemctl reload nginx
```

### 8.2 Получение SSL-сертификата (HTTPS)

```bash
certbot --nginx -d твой-домен.ru -d www.твой-домен.ru
```

Certbot спросит:
1. Email — введи свой
2. Согласие с Terms of Service — `Y`
3. Хочешь получать рассылку — `N`
4. Перенаправлять HTTP на HTTPS — выбери `2` (Redirect)

Проверь автопродление сертификата:
```bash
certbot renew --dry-run
```

---

## Шаг 10. Проверка работы

Открой в браузере: `https://твой-домен.ru`

Должна открыться главная страница приложения.

### Что проверить:

| Проверка | Как |
|----------|-----|
| Backend работает | `curl https://твой-домен.ru/health` |
| API работает | `curl https://твой-домен.ru/api/categories` |
| WebSocket | Открой консоль браузера (F12 → Console), ошибок WebSocket быть не должно |
| Prerender.io (SEO) | `curl -A "Googlebot" https://твой-домен.ru/products` — в ответе должен быть полный HTML |
| Регистрация | Попробуй создать аккаунт |
| Логин | Войди под созданным аккаунтом |

---

## Шаг 11. Создание первого администратора

После регистрации первого пользователя, назначь его админом:

```bash
sudo -u postgres psql -d nexatrade_db -c "UPDATE \"User\" SET \"isAdmin\" = true WHERE email = 'твой-email@пример.ru';"
```

Выйди и зайди снова — у тебя появится доступ к `/admin`.

---

## 📂 Структура файлов на сервере

```
/var/www/nexatrade/
├── backend/
│   ├── .env                  # ← Секреты (никому не показывай!)
│   ├── index.js
│   ├── prisma/
│   └── node_modules/
├── frontend/
│   └── dist/                 # ← Собранный фронтенд
├── logs/                     # ← Логи PM2
├── ecosystem.config.js       # ← Конфиг PM2
├── deploy.sh                 # ← Скрипт обновления
└── nginx.conf                # ← Конфиг nginx
```

---

## 🔄 Как обновить проект (последующие деплои)

Когда ты внесёшь изменения в код и запушишь в GitHub:

```bash
ssh root@YOUR_SERVER_IP
cd /var/www/nexatrade
git pull origin main
./deploy.sh
```

Или вручную:
```bash
cd /var/www/nexatrade

# Обновить код
git pull

# Пересобрать фронтенд
cd frontend && npm ci && npm run build

# Обновить бэкенд
cd ../backend && npm ci --production

# Применить миграции
npx prisma migrate deploy

# Перезапустить
pm2 reload nexatrade-backend
```

---

## 🛠️ Полезные команды

```bash
# Статус приложения
pm2 status

# Логи в реальном времени
pm2 logs nexatrade-backend

# Последние 100 строк логов
pm2 logs nexatrade-backend --lines 100

# Мониторинг ресурсов
pm2 monit

# Перезапуск
pm2 restart nexatrade-backend

# Остановка
pm2 stop nexatrade-backend

# Логи nginx
journalctl -u nginx -f

# Логи ошибок nginx
tail -f /var/log/nginx/error.log
```

---

## ❌ Возможные проблемы

### Порт 8000 занят
```bash
lsof -i :8000
kill -9 <PID>
pm2 restart nexatrade-backend
```

### Ошибка подключения к БД
```bash
# Проверь, что PostgreSQL запущен
systemctl status postgresql

# Проверь логин/пароль в backend/.env
# Попробуй подключиться вручную:
sudo -u postgres psql -d nexatrade_db -U nexatrade -W
```

### 502 Bad Gateway от Nginx
```bash
# Проверь, что backend запущен
curl http://localhost:8000/health

# Если не работает — смотри логи
pm2 logs

# Проверь nginx
nginx -t
systemctl status nginx
```

### SSL не обновляется
```bash
# Проверь автопродление
certbot renew --dry-run

# Пересоздай сертификат вручную
certbot delete --cert-name твой-домен.ru
certbot --nginx -d твой-домен.ru
```

---

## 🐳 Альтернатива: деплой через Docker

Если хочешь использовать Docker вместо PM2:

```bash
cd /var/www/nexatrade

# Создать .env
cp .env.example backend/.env
nano backend/.env

# Запустить
docker-compose up -d --build
```

PostgreSQL и приложение поднимутся в контейнерах. Nginx всё равно нужен на хосте для SSL и проксирования.

---

Если что-то не получается — пиши, помогу разобраться! 🚀

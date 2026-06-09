// backend/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http'); // ← Важно для Socket.io
const prisma = require('./utils/db');
const { loginLimiter, apiLimiter } = require('./middleware/rateLimit');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const rfqRoutes = require('./routes/rfq');
const initSocket = require('./socket');

const app = express();
const PORT = process.env.PORT || 8000;

// Trust proxy (nginx)
app.set('trust proxy', 1);

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://mc.yandex.ru", "https://mc.yandex.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "https://mc.yandex.ru", "https://mc.yandex.com"],
      connectSrc: ["'self'", "https://mc.yandex.ru", "wss://mc.yandex.ru", "https://mc.yandex.com", "wss://mc.yandex.com"],
      frameSrc: ["'self'", "https://mc.yandex.ru", "https://mc.yandex.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: true,
}));

// Cache-Control for API: prevent caching authenticated responses
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// General API rate limiting
app.use('/api', apiLimiter);
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Роуты
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/rfq', rfqRoutes);

// Health checks
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'nexatrade-backend' }));

app.get('/db/ping', async (req, res) => {
  try {
    const result = await prisma.$queryRaw`SELECT version()`;
    res.json({ database: 'PostgreSQL', version: result[0].version });
  } catch (err) {
    console.error('DB ping error:', err.message);
    res.status(503).json({ error: 'DB connection failed', details: err.message });
  }
});

// Создаём HTTP-сервер (не app.listen, а http.createServer)
const server = http.createServer(app);

// Инициализация Socket.io (после создания server, но до prisma.$connect)
const io = initSocket(server);

const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

const profileRoutes = require('./routes/profile');
app.use('/api/profile', profileRoutes);

const companyRoutes = require('./routes/company');
app.use('/api/company', companyRoutes);

const categoryRoutes = require('./routes/categories');
app.use('/api/categories', categoryRoutes);

const reportRoutes = require('./routes/reports');
app.use('/api/reports', reportRoutes);

const notificationRoutes = require('./routes/notifications');
app.use('/api/notifications', notificationRoutes);

// Отдача статики фронтенда (для production деплоя)
const path = require('path');
const fs = require('fs');

const possibleStaticPaths = [
  path.join(__dirname, '../frontend/dist'),  // mono-repo (dev / VPS)
  path.join(__dirname, 'dist'),              // Docker (dist copied into /app)
  path.join(__dirname, '../dist'),           // alternative layout
];

const staticPath = possibleStaticPaths.find(p => fs.existsSync(p));

if (staticPath) {
  app.use(express.static(staticPath));
  console.log(`📁 Serving static files from: ${staticPath}`);
} else {
  console.log('⚠️  Static files not found. Frontend will not be served.');
}

// SPA fallback — отдаём index.html для всех остальных маршрутов
if (staticPath) {
  app.get(/^\/(?!api\/)/, (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

// Глобальный обработчик ошибок Express
app.use((err, req, res, next) => {
  console.error(`[Express Error] ${req.method} ${req.path}:`, err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    path: req.path
  });
});

// Graceful error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

// Запуск сервера только после подключения к БД
prisma.$connect()
  .then(() => {
    console.log('✅ PostgreSQL подключён');

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Backend: http://localhost:${PORT}`);
      console.log(`📡 Socket.io: ws://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch(err => {
    console.error('❌ Ошибка подключения к БД:', err.message);
    process.exit(1);
  });


process.on('SIGINT', async () => {
  console.log('\n Завершение работы...');
  await prisma.$disconnect();
  server.close(() => {
    console.log(' Сервер остановлен');
    process.exit(0);
  });
});


module.exports = { app, server, io, prisma };
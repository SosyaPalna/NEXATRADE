// backend/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const http = require('http'); // ← Важно для Socket.io
const path = require('path');
const fs = require('fs');
const prisma = require('./lib/prisma');
const { setIo } = require('./utils/socket');
const { loginLimiter, publicLimiter, authLimiter, apiLimiter } = require('./middleware/rateLimit');
const auditLog = require('./middleware/auditLog');
const authenticate = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const rfqRoutes = require('./routes/rfq');
const citiesRoutes = require('./routes/cities');
const uploadRoutes = require('./routes/uploads');
const reviewRoutes = require('./routes/reviews');
const analyticsRoutes = require('./routes/analytics');
const initSocket = require('./socket');

const app = express();
const PORT = process.env.PORT || 8000;

// Trust proxy (nginx)
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);

// Middleware
app.use(helmet({
  hsts: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      scriptSrc: ["'self'", "https://mc.yandex.ru", "https://mc.yandex.com", "https://yastatic.net", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "https://mc.yandex.ru", "https://mc.yandex.com"],
      connectSrc: ["'self'", "wss:", "ws:", "https://mc.yandex.ru", "wss://mc.yandex.ru", "https://mc.yandex.com", "wss://mc.yandex.com"],
      frameSrc: ["'self'", "https://mc.yandex.ru", "https://mc.yandex.com"],
      fontSrc: ["'self'"],
      manifestSrc: ["'self'"],
      workerSrc: ["'self'", "blob:"],
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

// Global API fallback rate limit
app.use('/api', apiLimiter);

// Public API rate limiting
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', publicLimiter);
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Token-Expired'],
}));
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Роуты
app.use('/api/auth', authRoutes);
app.use('/api/cities', publicLimiter);
app.use('/api/cities', citiesRoutes); // публичный endpoint городов

// Все последующие /api/* требуют авторизации и rate limit по пользователю
app.use('/api', authenticate, auditLog, authLimiter);

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
setIo(io);

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
app.use('/api/reviews', reviewRoutes);
app.use('/api/analytics', analyticsRoutes);

const verificationRoutes = require('./routes/verification');
app.use('/api/verification', verificationRoutes);

const chatRoutes = require('./routes/chat');
app.use('/api/chat', chatRoutes);

app.use('/api/uploads', uploadRoutes);

// Отдача загруженных файлов (для dev; в production — nginx)
// Chat attachments are served only through authorized /api/chat/files
app.use('/uploads', (req, res, next) => {
  if (req.path.startsWith('/chat/')) {
    return res.status(403).json({ error: 'Access denied. Use /api/chat/files.' });
  }
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Отдача статики фронтенда (для production деплоя)

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
// backend/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http'); // ← Важно для Socket.io
const { PrismaClient } = require('@prisma/client');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const rfqRoutes = require('./routes/rfq');
const initSocket = require('./socket');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Роуты
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

// Запуск сервера только после подключения к БД
prisma.$connect()
  .then(() => {
    console.log(' PostgreSQL подключён');
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(` Backend: http://localhost:${PORT}`);
      console.log(` Socket.io: ws://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error(' Ошибка подключения к БД:', err.message);
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
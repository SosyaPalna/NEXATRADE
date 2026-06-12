// Обратная совместимость: единый PrismaClient теперь живёт в lib/prisma.js
const prisma = require('../lib/prisma');

module.exports = prisma;

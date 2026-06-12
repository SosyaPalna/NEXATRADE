const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

const SOFT_DELETE_MODELS = ['Product', 'Rfq', 'Quote'];

/**
 * Prisma middleware для автоматической реализации soft deletes.
 * - findMany/findFirst/findUnique исключают удалённые записи по умолчанию
 * - delete превращается в update с deletedAt = now
 * - deleteMany превращается в updateMany
 */
prisma.$use(async (params, next) => {
  if (SOFT_DELETE_MODELS.includes(params.model)) {
    // Soft delete: заменяем delete на update
    if (params.action === 'delete') {
      params.action = 'update';
      params.args.data = { deletedAt: new Date() };
    }

    if (params.action === 'deleteMany') {
      params.action = 'updateMany';
      if (!params.args.data) params.args.data = {};
      params.args.data.deletedAt = new Date();
    }

    // Фильтруем удалённые записи во всех find-запросах
    if (['findMany', 'findFirst', 'findFirstOrThrow', 'findUnique', 'findUniqueOrThrow'].includes(params.action)) {
      if (!params.args) params.args = {};
      if (!params.args.where) params.args.where = {};
      if (params.args.where.deletedAt === undefined) {
        params.args.where.deletedAt = null;
      }
    }

    // Для count тоже фильтруем удалённые
    if (params.action === 'count') {
      if (!params.args) params.args = {};
      if (!params.args.where) params.args.where = {};
      if (params.args.where.deletedAt === undefined) {
        params.args.where.deletedAt = null;
      }
    }
  }

  return next(params);
});

module.exports = prisma;

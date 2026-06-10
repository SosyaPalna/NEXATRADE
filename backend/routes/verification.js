const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authenticate = require('../middleware/auth');
const { findPartyByInn } = require('../services/dadata');
const { getIo } = require('../utils/socket');

const router = express.Router();
const prisma = new PrismaClient();

// 🔍 Проверить ИНН через DaData (предварительная проверка)
router.post('/check-inn', authenticate, async (req, res) => {
  try {
    const { inn } = req.body;
    if (!inn || !/^\d{10}$|^\d{12}$/.test(inn)) {
      return res.status(400).json({ error: 'Введите корректный ИНН (10 или 12 цифр)' });
    }

    const party = await findPartyByInn(inn);
    if (!party) {
      return res.status(404).json({ error: 'Компания или ИП с таким ИНН не найдены' });
    }

    if (party.status === 'LIQUIDATED') {
      return res.status(400).json({ error: 'Компания ликвидирована' });
    }

    // Проверяем, не занят ли ИНН другим пользователем
    const existing = await prisma.tenant.findUnique({
      where: { inn },
      select: { id: true, name: true, verificationStatus: true },
    });

    if (existing && existing.id !== req.tenantId) {
      return res.status(409).json({ error: 'Этот ИНН уже привязан к другой компании' });
    }

    res.json({
      success: true,
      data: party,
      message: 'Данные найдены. Подтвердите, что это ваша компания.',
    });
  } catch (err) {
    console.error('[Verification] check-inn error:', err);
    res.status(500).json({ error: err.message || 'Ошибка проверки ИНН' });
  }
});

// 📤 Подать заявку на верификацию
router.post('/submit', authenticate, async (req, res) => {
  try {
    const { inn, ogrn, kpp, companyType, legalAddress, directorName, verificationDocs } = req.body;

    if (!inn || !ogrn || !verificationDocs || verificationDocs.length === 0) {
      return res.status(400).json({ error: 'Заполните ИНН, ОГРН и загрузите документы' });
    }

    // Обновляем данные компании
    const tenant = await prisma.tenant.update({
      where: { id: req.tenantId },
      data: {
        inn,
        ogrn,
        kpp,
        companyType,
        legalAddress,
        directorName,
        verificationDocs,
        verificationStatus: 'pending',
        submittedAt: new Date(),
        // Сбрасываем дату подтверждения и причину отклонения
        verifiedAt: null,
        rejectedReason: null,
      },
    });

    res.json({
      success: true,
      message: 'Заявка на верификацию отправлена. Ожидайте проверки администратора.',
      status: tenant.verificationStatus,
    });
  } catch (err) {
    console.error('[Verification] submit error:', err);
    res.status(500).json({ error: 'Ошибка отправки заявки' });
  }
});

// 📊 Получить статус верификации текущего пользователя
router.get('/status', authenticate, async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId },
      select: {
        inn: true,
        ogrn: true,
        kpp: true,
        companyType: true,
        legalAddress: true,
        directorName: true,
        verificationStatus: true,
        verificationDocs: true,
        verificationData: true,
        submittedAt: true,
        verifiedAt: true,
        rejectedReason: true,
      },
    });

    res.json(tenant);
  } catch (err) {
    console.error('[Verification] status error:', err);
    res.status(500).json({ error: 'Ошибка получения статуса' });
  }
});

// ── АДМИНКА ──

// 📋 Получить все заявки на верификацию (только для админа)
router.get('/admin/list', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return res.status(403).json({ error: 'Нет доступа' });
    }

    const requests = await prisma.tenant.findMany({
      where: {
        verificationStatus: { in: ['pending', 'verified', 'rejected'] },
      },
      orderBy: { submittedAt: 'desc' },
      select: {
        id: true,
        name: true,
        inn: true,
        ogrn: true,
        companyType: true,
        legalAddress: true,
        directorName: true,
        verificationStatus: true,
        verificationDocs: true,
        submittedAt: true,
        verifiedAt: true,
        rejectedReason: true,
      },
    });

    res.json(requests);
  } catch (err) {
    console.error('[Verification] admin list error:', err);
    res.status(500).json({ error: 'Ошибка получения списка' });
  }
});

// ✅ Одобрить заявку
router.patch('/admin/:id/approve', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return res.status(403).json({ error: 'Нет доступа' });
    }

    const tenant = await prisma.tenant.update({
      where: { id: req.params.id },
      data: {
        verificationStatus: 'verified',
        isVerified: true,
        verifiedAt: new Date(),
        rejectedReason: null,
      },
    });

    // Создаём уведомление для владельца компании
    const notification = await prisma.notification.create({
      data: {
        title: 'Верификация подтверждена',
        message: `Ваша компания "${tenant.name}" успешно прошла верификацию. Теперь вы имеете статус подтверждённого участника.`,
        type: 'verification',
        link: '/profile',
        recipientId: tenant.id,
      },
    });

    // Отправляем через Socket.io в реальном времени
    const io = getIo();
    if (io) {
      io.to(`tenant:${tenant.id}`).emit('notification:new', notification);
    }

    res.json({ success: true, message: 'Верификация подтверждена', tenant });
  } catch (err) {
    console.error('[Verification] approve error:', err);
    res.status(500).json({ error: 'Ошибка подтверждения' });
  }
});

// ❌ Отклонить заявку
router.patch('/admin/:id/reject', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return res.status(403).json({ error: 'Нет доступа' });
    }

    const { reason } = req.body;
    const tenant = await prisma.tenant.update({
      where: { id: req.params.id },
      data: {
        verificationStatus: 'rejected',
        isVerified: false,
        verifiedAt: null,
        rejectedReason: reason || 'Документы не соответствуют требованиям',
      },
    });

    // Создаём уведомление для владельца компании
    const notification = await prisma.notification.create({
      data: {
        title: 'Верификация отклонена',
        message: `Заявка на верификацию компании "${tenant.name}" была отклонена.${reason ? ` Причина: ${reason}` : ''}`,
        type: 'verification',
        link: '/profile',
        recipientId: tenant.id,
      },
    });

    // Отправляем через Socket.io в реальном времени
    const io = getIo();
    if (io) {
      io.to(`tenant:${tenant.id}`).emit('notification:new', notification);
    }

    res.json({ success: true, message: 'Верификация отклонена', tenant });
  } catch (err) {
    console.error('[Verification] reject error:', err);
    res.status(500).json({ error: 'Ошибка отклонения' });
  }
});

module.exports = router;

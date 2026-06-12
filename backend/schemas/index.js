const { z } = require('zod');

const emailSchema = z.string().email('Некорректный email').max(255);
const passwordSchema = z.string()
  .min(8, 'Минимум 8 символов')
  .regex(/[a-z]/, 'Хотя бы одна строчная латинская буква')
  .regex(/[A-Z]/, 'Хотя бы одна заглавная латинская буква')
  .regex(/\d/, 'Хотя бы одна цифра')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Хотя бы один спецсимвол');

const registerSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
    tenant: z.object({
      name: z.string().min(1, 'Название компании обязательно').max(255),
      role: z.enum(['buyer', 'seller']).optional(),
    }),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, 'Пароль обязателен'),
  }),
});

const productBodySchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(255),
  description: z.string().max(5000).optional().nullable(),
  price: z.union([z.string(), z.number()]).transform(v => parseFloat(v)).refine(v => !isNaN(v) && v >= 0, 'Цена должна быть неотрицательным числом'),
  unit: z.string().max(50).optional(),
  stock: z.union([z.string(), z.number()]).transform(v => parseInt(v)).refine(v => !isNaN(v) && v >= 0, 'Остаток должен быть неотрицательным числом').optional(),
  isOpt: z.boolean().optional(),
  isRetail: z.boolean().optional(),
  categoryId: z.string().uuid().optional().nullable(),
  images: z.array(z.string().max(500)).max(10, 'Максимум 10 изображений').optional(),
});

const productSchema = z.object({ body: productBodySchema });
const productUpdateSchema = z.object({ body: productBodySchema.partial() });

const companyUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(5000).optional().nullable(),
    website: z.union([z.string().url().max(500), z.literal(''), z.literal(null)]).optional().nullable(),
    phone: z.string().max(50).optional().nullable(),
    city: z.string().max(100).optional().nullable(),
    avatarUrl: z.string().max(500).optional().nullable(),
    coverUrl: z.string().max(500).optional().nullable(),
    socialLinks: z.record(z.string().max(500)).optional().nullable(),
    deliveryMethods: z.array(z.string().max(100)).max(20).optional(),
    paymentMethods: z.array(z.string().max(100)).max(20).optional(),
  }),
});

const rfqSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Название обязательно').max(255),
    description: z.string().max(5000).optional(),
    quantity: z.union([z.string(), z.number()]).transform(v => parseInt(v)).refine(v => !isNaN(v) && v > 0, 'Количество должно быть положительным числом'),
    budget: z.union([z.string(), z.number()]).transform(v => parseFloat(v)).refine(v => !isNaN(v) && v > 0, 'Бюджет должен быть положительным числом').optional().nullable(),
    deadline: z.string().datetime().optional().nullable(),
    categoryId: z.string().uuid().optional().nullable(),
    unit: z.string().max(50).optional(),
  }),
});

const quoteSchema = z.object({
  body: z.object({
    price: z.union([z.string(), z.number()]).transform(v => parseFloat(v)).refine(v => !isNaN(v) && v >= 0, 'Цена должна быть неотрицательным числом'),
    deliveryTime: z.string().max(255).optional().nullable(),
    message: z.string().max(5000).optional().nullable(),
  }),
});

const reportSchema = z.object({
  body: z.object({
    type: z.enum(['message', 'product', 'user', 'company', 'rfq']),
    targetId: z.string().min(1),
    targetName: z.string().max(255).optional().nullable(),
    targetLink: z.string().max(500).optional().nullable(),
    reason: z.string().min(1, 'Причина обязательна').max(255),
    description: z.string().max(5000).optional().nullable(),
    screenshots: z.array(z.string().max(500)).max(5).optional(),
  }),
});

const paginationSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(v => parseInt(v)).optional(),
    limit: z.string().regex(/^\d+$/).transform(v => parseInt(v)).refine(v => v <= 100, 'limit должен быть не более 100').optional(),
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  productSchema,
  productUpdateSchema,
  companyUpdateSchema,
  rfqSchema,
  quoteSchema,
  reportSchema,
  paginationSchema,
};

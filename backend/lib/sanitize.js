const sanitizeHtml = require('sanitize-html');

/**
 * Очищает строку от HTML-тегов. Подходит для названий, заголовков.
 */
function sanitizeText(input) {
  if (typeof input !== 'string') return input;
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
}

/**
 * Очищает HTML, оставляя безопасные теги форматирования.
 * Подходит для описаний товаров, RFQ, профилей.
 */
function sanitizeHtmlContent(input) {
  if (typeof input !== 'string') return input;
  return sanitizeHtml(input, {
    allowedTags: ['p', 'br', 'b', 'i', 'em', 'strong', 'ul', 'ol', 'li', 'a'],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
  }).trim();
}

/**
 * Рекурсивно очищает поля объекта.
 */
function sanitizeObject(obj, fields) {
  const result = { ...obj };
  for (const [key, mode] of Object.entries(fields)) {
    if (result[key] !== undefined) {
      result[key] = mode === 'html' ? sanitizeHtmlContent(result[key]) : sanitizeText(result[key]);
    }
  }
  return result;
}

module.exports = {
  sanitizeText,
  sanitizeHtmlContent,
  sanitizeObject,
};

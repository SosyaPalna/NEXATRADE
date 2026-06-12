/**
 * Возвращает URL превью изображения.
 * Ожидает, что backend сохраняет варианты с суффиксами -preview и -thumbnail.
 */
export function getPreviewUrl(url) {
  if (!url) return null;
  if (url.endsWith('.webp')) return url.replace(/\.webp$/, '-preview.webp');
  return url;
}

export function getThumbnailUrl(url) {
  if (!url) return null;
  if (url.endsWith('.webp')) return url.replace(/\.webp$/, '-thumbnail.webp');
  return url;
}

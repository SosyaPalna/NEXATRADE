import { Helmet } from 'react-helmet-async'

const DEFAULT = {
  title: 'NexaTrade — B2B маркетплейс',
  description:
    'NexaTrade — современная B2B-платформа для оптовых закупок. Находите поставщиков, публикуйте заявки на закупку, управляйте торговыми процессами.',
  keywords:
    'B2B маркетплейс, оптовые закупки, поставщики, заявки на закупку, RFQ, торговая площадка, B2B платформа',
  image: '/og-image.png',
  url: 'https://nexatrade.ru',
  type: 'website',
  locale: 'ru_RU',
  siteName: 'NexaTrade',
  twitterCard: 'summary_large_image',
}

/**
 * SEO-компонент для управления meta-тегами на каждой странице.
 *
 * Примеры:
 *   <SEO />
 *   <SEO title="Профиль" description="Личный кабинет" />
 *   <SEO title={product.name} description={product.description} type="product" />
 */
export default function SEO({
  title,
  description,
  keywords,
  image,
  url,
  type = DEFAULT.type,
  noindex = false,
  nofollow = false,
  canonical,
  jsonLd,
}) {
  const fullTitle = title ? `${title} — NexaTrade` : DEFAULT.title
  const metaDesc = description || DEFAULT.description
  const metaKeywords = keywords || DEFAULT.keywords
  const ogImage = image || DEFAULT.image
  const ogUrl = url || DEFAULT.url
  const canonicalUrl = canonical || ogUrl

  const robots = []
  if (noindex) robots.push('noindex')
  if (nofollow) robots.push('nofollow')
  const robotsContent = robots.length > 0 ? robots.join(',') : 'index, follow'

  return (
    <Helmet>
      {/* Основные */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDesc} />
      <meta name="keywords" content={metaKeywords} />
      <meta name="robots" content={robotsContent} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={ogUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content={DEFAULT.locale} />
      <meta property="og:site_name" content={DEFAULT.siteName} />

      {/* Twitter Cards */}
      <meta name="twitter:card" content={DEFAULT.twitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDesc} />
      <meta name="twitter:image" content={ogImage} />

      {/* JSON-LD */}
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  )
}

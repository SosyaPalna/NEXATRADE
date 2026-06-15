import { Link } from 'react-router-dom'
import { MessageCircle, Mail } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card py-10 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-sm">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 text-foreground font-bold text-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                N
              </div>
              NexaTrade
            </Link>
            <p className="text-muted-foreground leading-relaxed">
              B2B-платформа для оптовых закупок и продаж. Находите поставщиков, публикуйте заявки и ведите переговоры в одном месте.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://t.me/nexatrade"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
              <a
                href="mailto:support@nexatrade.ru"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Mail className="h-4 w-4" />
              </a>
              <a
                href="https://github.com/SosyaPalna/NEXATRADE"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground uppercase tracking-wide">Продукт</h3>
            <ul className="space-y-2">
              <li><Link to="/products" className="text-muted-foreground hover:text-foreground transition-colors">Каталог</Link></li>
              <li><Link to="/rfq" className="text-muted-foreground hover:text-foreground transition-colors">Заявки</Link></li>
              <li><Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors">Вход</Link></li>
              <li><Link to="/register" className="text-muted-foreground hover:text-foreground transition-colors">Регистрация</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground uppercase tracking-wide">Компания</h3>
            <ul className="space-y-2">
              <li><Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Политика конфиденциальности</Link></li>
              <li><Link to="/chats" className="text-muted-foreground hover:text-foreground transition-colors">Связаться с нами</Link></li>
            </ul>
          </div>

          {/* Contacts */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground uppercase tracking-wide">Контакты</h3>
            <ul className="space-y-3">
              <li>
                <a href="https://t.me/nexatrade" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                  <MessageCircle className="h-4 w-4" />
                  Telegram: @nexatrade
                </a>
              </li>
              <li>
                <a href="mailto:support@nexatrade.ru" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Mail className="h-4 w-4" />
                  support@nexatrade.ru
                </a>
              </li>
              <li>
                <a href="https://github.com/SosyaPalna/NEXATRADE" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} NexaTrade. Все права защищены.
        </div>
      </div>
    </footer>
  )
}

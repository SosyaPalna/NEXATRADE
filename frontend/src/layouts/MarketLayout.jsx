import { useState, useEffect } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { api } from '../api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { ChevronDown, ChevronRight, FolderOpen, Search, X } from 'lucide-react'

export default function MarketLayout() {
  const location = useLocation()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    api.get('/categories')
      .then(res => setCategories(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filteredCategories = query.trim()
    ? categories.map(cat => {
        const q = query.toLowerCase()
        const parentMatch = cat.name.toLowerCase().includes(q)
        const matchedChildren = cat.children?.filter(child => child.name.toLowerCase().includes(q)) || []
        if (parentMatch) return cat
        if (matchedChildren.length) return { ...cat, children: matchedChildren }
        return null
      }).filter(Boolean)
    : categories

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 shrink-0">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-primary" />
            Категории товаров
          </h3>
          <Separator className="mb-3" />
          {loading ? (
            <div className="text-sm text-muted-foreground py-4 text-center">Загрузка...</div>
          ) : categories.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center">Категорий пока нет</div>
          ) : (
            <>
              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9 pr-8 border-border"
                  placeholder="Поиск по категориям"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <ScrollArea className="h-[calc(100vh-340px)]">
                <nav className="space-y-1">
                  {filteredCategories.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-4 text-center">Ничего не найдено</div>
                  ) : (
                    filteredCategories.map(cat => (
                      <CategoryItem key={cat.id} category={cat} currentPath={location.pathname} forceOpen={!!query.trim()} />
                    ))
                  )}
                </nav>
              </ScrollArea>
            </>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  )
}

function CategoryItem({ category, currentPath, forceOpen = false }) {
  const [isOpen, setIsOpen] = useState(currentPath.includes(category.slug) || forceOpen)
  const isActive = currentPath.includes(category.slug)
  const hasChildren = category.children?.length > 0

  useEffect(() => {
    if (forceOpen) setIsOpen(true)
  }, [forceOpen])

  return (
    <div>
      <div className="flex items-center">
        {hasChildren && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 mr-1"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </Button>
        )}
        {!hasChildren && <div className="w-7 shrink-0" />}
        <Link
          to={`/category/${category.slug}`}
          className={`flex-1 text-sm py-1.5 px-2 rounded-md transition-colors truncate ${
            isActive
              ? 'bg-primary text-primary-foreground font-medium'
              : 'text-foreground hover:bg-muted'
          }`}
        >
          {category.name}
          <span className="text-xs opacity-70 ml-1">({category._count?.products || 0})</span>
        </Link>
      </div>

      {isOpen && hasChildren && (
        <div className="ml-6 border-l border-border pl-2 space-y-1 mt-1">
          {category.children.map(child => (
            <Link
              key={child.id}
              to={`/category/${child.slug}`}
              className={`block text-sm py-1.5 px-2 rounded-md transition-colors truncate ${
                currentPath.includes(child.slug)
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {child.name}
              <span className="text-xs opacity-60 ml-1">({child._count?.products || 0})</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { api } from '../api'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { ChevronDown, ChevronRight, FolderOpen } from 'lucide-react'

export default function MarketLayout() {
  const location = useLocation()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/categories')
      .then(res => setCategories(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

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
            <ScrollArea className="h-[calc(100vh-280px)]">
              <nav className="space-y-1">
                {categories.map(cat => (
                  <CategoryItem key={cat.id} category={cat} currentPath={location.pathname} />
                ))}
              </nav>
            </ScrollArea>
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

function CategoryItem({ category, currentPath }) {
  const [isOpen, setIsOpen] = useState(currentPath.includes(category.slug))
  const isActive = currentPath.includes(category.slug)
  const hasChildren = category.children?.length > 0

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

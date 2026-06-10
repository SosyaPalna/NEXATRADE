import { useState } from 'react'
import { useNavigate, Outlet, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, Users, FileText, ArrowLeft, LogOut, Shield, BarChart3, Flag, FolderTree, Building2, Package, Send } from 'lucide-react'

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('isAdmin')
    navigate('/login')
  }

  const navItems = [
    { path: '/admin/dashboard', label: 'Дашборд', icon: BarChart3 },
    { path: '/admin/users', label: 'Пользователи', icon: Users },
    { path: '/admin/rfqs', label: 'Заявки', icon: FileText },
    { path: '/admin/categories', label: 'Категории', icon: FolderTree },
    { path: '/admin/verifications', label: 'Верификации', icon: Building2 },
    { path: '/admin/reports', label: 'Жалобы', icon: Flag },
    { path: '/admin/products', label: 'Товары', icon: Package },
    { path: '/admin/broadcast', label: 'Рассылка', icon: Send },
  ]

  const isActive = (path) => location.pathname === path

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-4">
        <Shield className="h-5 w-5 text-primary" />
        <span className="font-bold text-foreground">Админ-панель</span>
      </div>
      <Separator className="bg-border" />
      <nav className="flex-1 px-2 py-3 space-y-1">
        {navItems.map(item => (
          <Button
            key={item.path}
            variant={isActive(item.path) ? 'default' : 'ghost'}
            className={`w-full justify-start ${isActive(item.path) ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            onClick={() => {
              navigate(item.path)
              setMobileOpen(false)
            }}
          >
            <item.icon className="h-4 w-4 mr-2" />
            {item.label}
          </Button>
        ))}
        <Separator className="my-2 bg-border" />
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={() => {
            navigate('/dashboard')
            setMobileOpen(false)
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          На сайт
        </Button>
      </nav>
      <div className="p-2">
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Выйти
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-background">
        <ScrollArea className="flex-1">
          <SidebarContent />
        </ScrollArea>
      </aside>

      <div className="md:hidden absolute top-16 left-2 z-40">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger className="inline-flex items-center justify-center rounded-md border border-border bg-background h-9 w-9 hover:bg-muted hover:text-foreground cursor-pointer">
            <Menu className="h-5 w-5 text-foreground" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-background border-r border-border">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  )
}

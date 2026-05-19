import { useState } from 'react'
import { useNavigate, Outlet, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, Users, FileText, ArrowLeft, LogOut, Shield, BarChart3, Flag, FolderTree } from 'lucide-react'

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
    { path: '/admin/reports', label: 'Жалобы', icon: Flag },
  ]

  const isActive = (path) => location.pathname === path

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-4">
        <Shield className="h-5 w-5 text-[#005BAC]" />
        <span className="font-bold text-[#0f172a]">Админ-панель</span>
      </div>
      <Separator className="bg-[#e2e8f0]" />
      <nav className="flex-1 px-2 py-3 space-y-1">
        {navItems.map(item => (
          <Button
            key={item.path}
            variant={isActive(item.path) ? 'default' : 'ghost'}
            className={`w-full justify-start ${isActive(item.path) ? 'bg-[#005BAC] text-white hover:bg-[#004a8d]' : 'text-[#64748b] hover:bg-[#f8fafc] hover:text-[#0f172a]'}`}
            onClick={() => {
              navigate(item.path)
              setMobileOpen(false)
            }}
          >
            <item.icon className="h-4 w-4 mr-2" />
            {item.label}
          </Button>
        ))}
        <Separator className="my-2 bg-[#e2e8f0]" />
        <Button
          variant="ghost"
          className="w-full justify-start text-[#64748b] hover:bg-[#f8fafc] hover:text-[#0f172a]"
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
          className="w-full justify-start text-[#ef4444] hover:text-[#ef4444] hover:bg-[#fee2e2]"
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
      <aside className="hidden md:flex w-64 flex-col border-r border-[#e2e8f0] bg-white">
        <ScrollArea className="flex-1">
          <SidebarContent />
        </ScrollArea>
      </aside>

      <div className="md:hidden absolute top-16 left-2 z-40">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger className="inline-flex items-center justify-center rounded-md border border-[#e2e8f0] bg-white h-9 w-9 hover:bg-[#f8fafc] hover:text-[#0f172a] cursor-pointer">
            <Menu className="h-5 w-5 text-[#0f172a]" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-white border-r border-[#e2e8f0]">
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

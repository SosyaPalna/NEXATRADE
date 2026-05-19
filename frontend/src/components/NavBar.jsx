import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, User, LogOut, Building2, LayoutDashboard, Package, FileText } from 'lucide-react'

export default function NavBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    api.get('/auth/me')
      .then(res => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('isAdmin')
      })
      .finally(() => setLoading(false))
  }, [location.pathname])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('isAdmin')
    navigate('/login')
  }

  const navItems = [
    { path: '/dashboard', label: 'Главная', icon: LayoutDashboard },
    { path: '/products', label: 'Каталог', icon: Package },
    { path: '/requests', label: 'Заявки', icon: FileText },
  ]

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Лого слева */}
          <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#005BAC] text-white font-bold text-lg">
              N
            </div>
            <span className="text-xl font-bold tracking-tight text-[#0f172a]">
              NexaTrade
            </span>
          </Link>

          {/* Навигация по центру — десктоп */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant={isActive(item.path) ? 'default' : 'ghost'}
                size="sm"
                className={isActive(item.path) ? 'bg-[#005BAC] text-white hover:bg-[#004a8d]' : 'text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9]'}
                asChild
              >
                <Link to={item.path} className="flex items-center gap-1.5">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            ))}
          </nav>

          {/* Правая часть */}
          <div className="flex items-center gap-2">
            {loading ? (
              <span className="text-sm text-[#64748b]">Загрузка...</span>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none">
                  <div className="flex items-center gap-2 rounded-full hover:bg-[#f1f5f9] transition-colors cursor-pointer px-2 py-1">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.tenant?.avatarUrl} alt={user.tenant?.name} />
                      <AvatarFallback className="bg-[#005BAC] text-white text-xs">
                        {user.tenant?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline text-sm font-medium max-w-[120px] truncate text-[#0f172a]">
                      {user.tenant?.name || user.email}
                    </span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.tenant?.name || 'Компания'}</p>
                      <p className="text-xs leading-none text-[#64748b]">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Личный кабинет
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={`/company/${user.tenant?.id || user.tenantId}`} className="cursor-pointer flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Моя компания
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-[#ef4444] focus:text-[#ef4444] flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" className="bg-[#005BAC] text-white hover:bg-[#004a8d]" asChild>
                <Link to="/login">Войти</Link>
              </Button>
            )}

            {/* Мобильное меню */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger className="md:hidden inline-flex items-center justify-center rounded-md h-8 w-8 hover:bg-[#f1f5f9] cursor-pointer">
                <Menu className="h-5 w-5 text-[#0f172a]" />
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="flex flex-col gap-4 mt-4">
                  <Link to="/dashboard" className="flex items-center gap-2 text-lg font-bold text-[#0f172a]" onClick={() => setMobileOpen(false)}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#005BAC] text-white">N</div>
                    NexaTrade
                  </Link>
                  <div className="flex flex-col gap-1">
                    {navItems.map((item) => (
                      <Button
                        key={item.path}
                        variant={isActive(item.path) ? 'default' : 'ghost'}
                        className={isActive(item.path) ? 'bg-[#005BAC] text-white justify-start' : 'text-[#64748b] hover:text-[#0f172a] justify-start'}
                        asChild
                        onClick={() => setMobileOpen(false)}
                      >
                        <Link to={item.path} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      </Button>
                    ))}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}

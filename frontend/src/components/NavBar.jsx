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
import { Menu, User, LogOut, Building2, LayoutDashboard, Package, FileText, Sun, Moon, Bell, Check, Trash2, MessageSquare, Gavel, ShieldCheck, MapPin, Shield } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import { useNotification } from '../context/NotificationContext'
import { io } from 'socket.io-client'

export default function NavBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifOpen, setNotifOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { addNotification } = useNotification()
  const [selectedCity, setSelectedCity] = useState(() => localStorage.getItem('selectedCity') || 'Все города')

  const cities = [
    'Все города', 'Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург',
    'Казань', 'Нижний Новгород', 'Челябинск', 'Самара', 'Омск',
    'Ростов-на-Дону', 'Уфа', 'Красноярск', 'Воронеж', 'Пермь', 'Волгоград'
  ]

  const handleCityChange = (city) => {
    setSelectedCity(city)
    localStorage.setItem('selectedCity', city)
    window.dispatchEvent(new StorageEvent('storage', { key: 'selectedCity', newValue: city }))
  }

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

  useEffect(() => {
    if (!user) return
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000)

    // Socket.io для real-time уведомлений
    const token = localStorage.getItem('token')
    const socketUrl = window.location.origin
    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    socket.on('connect', () => {
      console.log('[NavBar] Socket connected')
    })

    socket.on('notification:new', (notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 20))
      setUnreadCount(c => c + 1)
      addNotification(notification.title, 'info')
    })

    return () => {
      clearInterval(interval)
      socket.disconnect()
    }
  }, [user, addNotification])

  const loadNotifications = async () => {
    try {
      const [res, countRes] = await Promise.all([
        api.get('/notifications', { params: { limit: 10 } }),
        api.get('/notifications/unread-count')
      ])
      setNotifications(res.data.notifications || [])
      setUnreadCount(countRes.data.count || 0)
    } catch {
      // silent fail
    }
  }

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all')
      setUnreadCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch {}
  }

  const deleteNotification = async (id, e) => {
    e.stopPropagation()
    try {
      await api.delete(`/notifications/${id}`)
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch {}
  }

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
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Лого слева */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-lg">
              N
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
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
                className={isActive(item.path) ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}
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
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* Выбор города */}
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none">
                <div className="inline-flex items-center gap-1.5 rounded-md h-8 px-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline max-w-25 truncate">{selectedCity}</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-52 max-h-80 overflow-y-auto" align="end">
                <DropdownMenuLabel>Выберите город</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {cities.map(city => (
                  <DropdownMenuItem
                    key={city}
                    className="cursor-pointer"
                    onClick={() => handleCityChange(city)}
                  >
                    <span className={selectedCity === city ? 'font-medium text-primary' : ''}>{city}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {user && (
              <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
                <DropdownMenuTrigger className="outline-none relative">
                  <div className="inline-flex items-center justify-center rounded-md h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer relative">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white font-medium">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80" align="end">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Уведомления</span>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={markAllRead}>
                        <Check className="h-3 w-3" />
                        Все прочитаны
                      </Button>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? (
                    <div className="px-2 py-4 text-sm text-muted-foreground text-center">Нет уведомлений</div>
                  ) : (
                    notifications.map(n => {
                      const NotifIcon = n.type === 'chat' ? MessageSquare : n.type === 'rfq' ? Gavel : n.type === 'verification' ? ShieldCheck : Bell
                      return (
                        <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 cursor-pointer p-2" asChild>
                          <Link to={n.link || '#'} onClick={() => !n.isRead && api.patch(`/notifications/${n.id}/read`).then(() => { setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x)); setUnreadCount(c => Math.max(0, c - 1)) })}>
                            <div className="flex items-start justify-between w-full gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <NotifIcon className={`h-4 w-4 shrink-0 ${n.isRead ? 'text-muted-foreground' : 'text-primary'}`} />
                                <span className={`text-sm truncate ${n.isRead ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
                                  {n.title}
                                </span>
                              </div>
                              <div
                                className="inline-flex items-center justify-center rounded-md h-5 w-5 shrink-0 hover:bg-muted cursor-pointer text-muted-foreground"
                                onClick={(e) => deleteNotification(n.id, e)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 pl-6">{n.message}</p>
                            <span className="text-[10px] text-muted-foreground pl-6">
                              {new Date(n.createdAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </Link>
                        </DropdownMenuItem>
                      )
                    })
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {loading ? (
              <span className="text-sm text-muted-foreground">Загрузка...</span>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none">
                  <div className="flex items-center gap-2 rounded-full hover:bg-muted transition-colors cursor-pointer px-2 py-1">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.tenant?.avatarUrl} alt={user.tenant?.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {user.tenant?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline text-sm font-medium max-w-30 truncate text-foreground">
                      {user.tenant?.name || user.email}
                    </span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.tenant?.name || 'Компания'}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
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
                  {user.isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin/dashboard" className="cursor-pointer flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Админ-панель
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                <Link to="/login">Войти</Link>
              </Button>
            )}

            {/* Мобильное меню */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger className="md:hidden inline-flex items-center justify-center rounded-md h-8 w-8 hover:bg-muted cursor-pointer">
                <Menu className="h-5 w-5 text-foreground" />
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="flex flex-col gap-4 mt-4">
                  <Link to="/" className="flex items-center gap-2 text-lg font-bold text-foreground" onClick={() => setMobileOpen(false)}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">N</div>
                    NexaTrade
                  </Link>
                  <div className="flex flex-col gap-1">
                    {navItems.map((item) => (
                      <Button
                        key={item.path}
                        variant={isActive(item.path) ? 'default' : 'ghost'}
                        className={isActive(item.path) ? 'bg-primary text-primary-foreground justify-start' : 'text-muted-foreground hover:text-foreground justify-start'}
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

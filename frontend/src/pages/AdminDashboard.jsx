import { useEffect, useState } from 'react'
import { api } from '../api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Users, FileText, Package, MessageSquare, TrendingUp } from 'lucide-react'

const COLORS = ['#005BAC', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/stats')
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[#64748b]">
        Загрузка статистики...
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64 text-[#64748b]">
        Не удалось загрузить статистику
      </div>
    )
  }

  const { counts, usersByDay, rfqsByDay, quotesByDay, rfqsByStatus, topSellers } = stats

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#0f172a]">Админ-панель</h2>
        <Badge className="bg-[#005BAC] text-white hover:bg-[#005BAC]">Администратор</Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <Card className="border-[#e2e8f0] shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748b]">Пользователей</p>
                <p className="text-2xl font-bold text-[#0f172a]">{counts.users}</p>
              </div>
              <div className="p-2 rounded-lg bg-[#005BAC]/10">
                <Users className="h-5 w-5 text-[#005BAC]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#e2e8f0] shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748b]">Компаний</p>
                <p className="text-2xl font-bold text-[#0f172a]">{counts.tenants}</p>
              </div>
              <div className="p-2 rounded-lg bg-[#22c55e]/10">
                <TrendingUp className="h-5 w-5 text-[#22c55e]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#e2e8f0] shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748b]">Заявок</p>
                <p className="text-2xl font-bold text-[#0f172a]">{counts.rfqs}</p>
              </div>
              <div className="p-2 rounded-lg bg-[#f59e0b]/10">
                <FileText className="h-5 w-5 text-[#f59e0b]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#e2e8f0] shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748b]">Товаров</p>
                <p className="text-2xl font-bold text-[#0f172a]">{counts.products}</p>
              </div>
              <div className="p-2 rounded-lg bg-[#8b5cf6]/10">
                <Package className="h-5 w-5 text-[#8b5cf6]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#e2e8f0] shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748b]">Предложений</p>
                <p className="text-2xl font-bold text-[#0f172a]">{counts.quotes}</p>
              </div>
              <div className="p-2 rounded-lg bg-[#ef4444]/10">
                <MessageSquare className="h-5 w-5 text-[#ef4444]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-[#e2e8f0] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Заявки за 30 дней</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={rfqsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#005BAC" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-[#e2e8f0] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Регистрации за 30 дней</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={usersByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="count" fill="#005BAC" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-[#e2e8f0] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Статусы заявок</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={rfqsByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="status"
                >
                  {rfqsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {rfqsByStatus.map((s, i) => (
                <div key={s.status} className="flex items-center gap-1.5 text-xs">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-[#64748b]">{s.status}</span>
                  <span className="font-medium text-[#0f172a]">{s.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#e2e8f0] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Топ поставщиков по предложениям</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topSellers.map((seller, i) => (
                <div key={seller.id} className="flex items-center justify-between p-2 rounded-lg bg-[#f8fafc]">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#005BAC] text-white text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-[#0f172a]">{seller.name}</span>
                  </div>
                  <span className="text-sm font-bold text-[#005BAC]">{seller._count.quotes} предложений</span>
                </div>
              ))}
              {topSellers.length === 0 && (
                <p className="text-sm text-[#64748b] text-center py-4">Пока нет данных</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

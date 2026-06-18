import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, MessageSquare, ArrowRight } from 'lucide-react'

export default function RfqFeed({ limit = 5 }) {
  const [rfqs, setRfqs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/rfq')
      .then(res => {
        const openRfqs = res.data
          .filter(r => r.status === 'open')
          .slice(0, limit)
        setRfqs(openRfqs)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [limit])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
        Загрузка предложений...
      </div>
    )
  }

  if (rfqs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-24 text-sm text-muted-foreground gap-2">
        <FileText className="h-8 w-8 opacity-50" />
        <span>Активных предложений пока нет</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {rfqs.map(rfq => (
        <Link to={`/rfq/${rfq.id}`} key={rfq.id} className="block">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground truncate">{rfq.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {rfq.buyer?.name} • {new Date(rfq.createdAt).toLocaleDateString('ru-RU')}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {rfq.description}
                  </p>
                </div>
                <div className="text-right shrink-0 max-w-[45%] sm:max-w-none">
                  <div className="font-bold text-primary break-words">
                    {rfq.budget ? `${Number(rfq.budget).toLocaleString('ru-RU')} ₽` : 'Договорная'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {rfq.quantity} {rfq.unit || 'шт.'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="default">Открыт</Badge>
                {rfq._count?.quotes > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {rfq._count.quotes} предложений
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
      <Button variant="ghost" size="sm" className="w-full" asChild>
        <Link to="/requests" className="flex items-center justify-center gap-1">
          Все заявки <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  )
}

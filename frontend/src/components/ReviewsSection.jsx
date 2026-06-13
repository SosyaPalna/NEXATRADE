import { useEffect, useState, useCallback } from 'react';
import { api } from '../api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ReviewsSection({ tenantId, currentTenantId, isOwn }) {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ average: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = useCallback(async () => {
    try {
      const res = await api.get(`/reviews/tenant/${tenantId}`);
      setReviews(res.data.reviews);
      setSummary(res.data.summary);
    } catch {
      toast.error('Не удалось загрузить отзывы');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return toast.error('Выберите оценку');
    setSubmitting(true);
    try {
      await api.post('/reviews', { tenantId, rating, text });
      toast.success('Отзыв сохранён');
      setRating(0);
      setText('');
      loadReviews();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ошибка сохранения отзыва');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить отзыв?')) return;
    try {
      await api.delete(`/reviews/${id}`);
      toast.success('Отзыв удалён');
      loadReviews();
    } catch {
      toast.error('Ошибка удаления отзыва');
    }
  };

  if (loading) {
    return <div className="text-center text-muted-foreground py-8">Загрузка отзывов...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-foreground">
            <Star className="h-4 w-4 text-primary" />
            Рейтинг {summary.average > 0 ? summary.average.toFixed(1) : '—'} / 5
            <span className="text-muted-foreground text-sm font-normal">
              ({summary.count} {summary.count === 1 ? 'отзыв' : summary.count < 5 ? 'отзыва' : 'отзывов'})
            </span>
          </CardTitle>
        </CardHeader>
      </Card>

      {!isOwn && currentTenantId && (
        <Card className="border-border">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Ваша оценка</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1"
                    >
                      <Star
                        className={`h-6 w-6 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Отзыв</label>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Расскажите о своём опыте работы с компанией"
                  rows={4}
                  maxLength={5000}
                />
              </div>
              <Button type="submit" disabled={submitting || rating === 0}>
                {submitting ? 'Сохранение...' : 'Оставить отзыв'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Пока нет отзывов. Будьте первым!
          </div>
        ) : (
          reviews.map((review) => (
            <Card key={review.id} className="border-border">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-foreground">{review.author?.name || 'Аноним'}</span>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    {review.text && (
                      <p className="text-sm text-foreground whitespace-pre-line">{review.text}</p>
                    )}
                  </div>
                  {(review.authorId === currentTenantId) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(review.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

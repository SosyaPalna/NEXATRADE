import { useState, useCallback, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

export default function ImageLightbox({ images, children }) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)

  const current = images[index]

  const goNext = useCallback(() => {
    setIndex(i => (i + 1) % images.length)
  }, [images.length])

  const goPrev = useCallback(() => {
    setIndex(i => (i - 1 + images.length) % images.length)
  }, [images.length])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, goNext, goPrev])

  return (
    <>
      <div onClick={() => setOpen(true)} className="cursor-zoom-in">
        {children}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 border-none bg-black/90 overflow-hidden">
          <DialogTitle className="sr-only">Просмотр изображения</DialogTitle>

          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 z-50 text-white/80 hover:text-white hover:bg-white/10"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 text-white/80 text-sm bg-black/40 px-3 py-1 rounded-full">
              {index + 1} / {images.length}
            </div>
          )}

          {/* Main image */}
          <div className="flex items-center justify-center w-full h-full min-h-50">
            {current && (
              <img
                src={current}
                alt={`Изображение ${index + 1}`}
                className="max-w-full max-h-[85vh] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-3 top-1/2 -translate-y-1/2 z-50 text-white/80 hover:text-white hover:bg-white/10"
                onClick={(e) => { e.stopPropagation(); goPrev() }}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-3 top-1/2 -translate-y-1/2 z-50 text-white/80 hover:text-white hover:bg-white/10"
                onClick={(e) => { e.stopPropagation(); goNext() }}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-50 flex gap-2 bg-black/40 p-2 rounded-lg max-w-[90vw] overflow-x-auto">
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setIndex(i) }}
                  className={`shrink-0 rounded-md overflow-hidden border-2 transition-colors ${
                    i === index ? 'border-primary' : 'border-transparent hover:border-white/40'
                  }`}
                >
                  <img src={src} alt="" className="h-12 w-12 object-cover" />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

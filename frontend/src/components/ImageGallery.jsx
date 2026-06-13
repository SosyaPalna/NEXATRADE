import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getThumbnailUrl } from '../lib/images';

export default function ImageGallery({ images = [], alt = 'Изображение' }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
        Нет изображений
      </div>
    );
  }

  const openLightbox = (index) => {
    setSelectedIndex(index);
    setLightboxOpen(true);
  };

  const prev = () => {
    setSelectedIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  };

  const next = () => {
    setSelectedIndex((i) => (i === images.length - 1 ? 0 : i + 1));
  };

  return (
    <div className="space-y-4">
      {/* Главное изображение */}
      <div
        className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer border border-border hover:border-primary transition-colors"
        onClick={() => openLightbox(selectedIndex)}
      >
        <img
          src={images[selectedIndex]}
          alt={`${alt} ${selectedIndex + 1}`}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Миниатюры */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((src, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors ${
                index === selectedIndex ? 'border-primary' : 'border-border hover:border-primary/50'
              }`}
            >
              <img
                src={getThumbnailUrl(src) || src}
                alt={`${alt} миниатюра ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl w-full h-[90vh] p-0 bg-black/95 border-none flex items-center justify-center">
          <DialogTitle className="sr-only">Просмотр изображения</DialogTitle>

          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white z-50"
          >
            <X className="h-8 w-8" />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white z-50"
              >
                <ChevronLeft className="h-10 w-10" />
              </button>
              <button
                onClick={next}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white z-50"
              >
                <ChevronRight className="h-10 w-10" />
              </button>
            </>
          )}

          <img
            src={images[selectedIndex]}
            alt={`${alt} ${selectedIndex + 1}`}
            className="max-w-full max-h-full object-contain"
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
            {selectedIndex + 1} / {images.length}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

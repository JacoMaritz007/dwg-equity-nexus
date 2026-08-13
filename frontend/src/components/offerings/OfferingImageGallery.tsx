import React, { useMemo, useState } from 'react';
import { Building } from 'lucide-react';
import { OfferingMedia } from '@/types/investment';

interface OfferingImageGalleryProps {
  media: OfferingMedia[] | undefined;
  title: string;
}

// Main image up top, small clickable thumbnail strip below it — the
// featured_image (if present) leads, followed by gallery_images in
// display_order. Clicking a thumbnail swaps the main image; it never
// navigates away or opens a lightbox, keeping this a lightweight in-page
// carousel rather than a full gallery viewer.
export const OfferingImageGallery: React.FC<OfferingImageGalleryProps> = ({ media, title }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [erroredIds, setErroredIds] = useState<Record<string, boolean>>({});

  const images = useMemo(() => {
    const featured = (media ?? []).filter((m) => m.media_type === 'featured_image');
    const gallery = (media ?? [])
      .filter((m) => m.media_type === 'gallery_image')
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    return [...featured, ...gallery].filter((m) => m.url);
  }, [media]);

  const markErrored = (id: string) => setErroredIds((prev) => ({ ...prev, [id]: true }));

  const usableImages = images.filter((m) => !erroredIds[m.id]);
  const current = usableImages[Math.min(selectedIndex, usableImages.length - 1)];

  if (usableImages.length === 0) {
    return (
      <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden flex items-center justify-center">
        <Building className="h-20 w-20 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden">
        <img
          key={current.id}
          src={current.url ?? undefined}
          alt={title}
          className="w-full h-full object-cover"
          onError={() => markErrored(current.id)}
        />
      </div>

      {usableImages.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {usableImages.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setSelectedIndex(index)}
              aria-label={`Show image ${index + 1} of ${usableImages.length}`}
              aria-current={image.id === current.id}
              className={`shrink-0 w-20 aspect-video rounded-md overflow-hidden border-2 transition-colors ${
                image.id === current.id
                  ? 'border-primary'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={image.url ?? undefined}
                alt=""
                className="w-full h-full object-cover"
                onError={() => markErrored(image.id)}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { cn } from '@/lib/utils';

interface SeasonMosaicProps {
  thumbnails: string[];
  fallbackImage: string;
  alt: string;
  className?: string;
}

/** Collage of a season's preview thumbnails: one hero tile plus two side tiles, falling back to season artwork. */
export const SeasonMosaic: React.FC<SeasonMosaicProps> = ({ thumbnails, fallbackImage, alt, className }) => {
  const [hero, ...rest] = thumbnails.length > 0 ? thumbnails : [fallbackImage];
  const side = rest.slice(0, 2);
  const tileClass =
    'size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105';
  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (e.currentTarget.src.endsWith(fallbackImage)) return;
    e.currentTarget.src = fallbackImage;
  };

  return (
    <div
      className={cn(
        'grid size-full gap-0.5 bg-background',
        side.length === 2 ? 'grid-cols-3 grid-rows-2' : 'grid-cols-1',
        className
      )}
    >
      <div className={cn('overflow-hidden', side.length === 2 && 'col-span-2 row-span-2')}>
        <img src={hero} alt={alt} loading="lazy" onError={handleError} className={tileClass} />
      </div>
      {side.length === 2 &&
        side.map((src) => (
          <div key={src} className="overflow-hidden">
            <img src={src} alt="" loading="lazy" onError={handleError} className={tileClass} />
          </div>
        ))}
    </div>
  );
};

export default SeasonMosaic;

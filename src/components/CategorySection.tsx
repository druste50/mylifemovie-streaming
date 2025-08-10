import { useState, useRef } from 'react';
import { Movie, TVShow } from '@/types/movie';
import { MovieCard } from './MovieCard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CategorySectionProps {
  title: string;
  items: (Movie | TVShow)[];
  onItemClick?: (item: Movie | TVShow) => void;
  loading?: boolean;
  showTitle?: boolean;
}

export function CategorySection({ title, items, onItemClick, loading = false, showTitle = true }: CategorySectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;

    const scrollAmount = 300;
    const newScrollLeft = scrollRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
    
    scrollRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  if (loading) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          {showTitle && <h2 className="text-2xl font-bold mb-6 text-white">{title}</h2>}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="aspect-[2/3] bg-muted rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        {/* Cabeçalho da seção */}
        {showTitle && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            
            {/* Controles de navegação - Desktop */}
            <div className="hidden md:flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 disabled:opacity-50"
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 disabled:opacity-50"
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {!showTitle && (
          <div className="hidden md:flex gap-2 justify-end mb-6">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 disabled:opacity-50"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 disabled:opacity-50"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Grid de filmes/séries */}
        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 md:pb-0"
            onScroll={handleScroll}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {items.map((item) => (
              <div
                key={item.id}
                className="flex-none w-40 sm:w-48 md:w-52"
              >
                <MovieCard
                  item={item}
                  onClick={() => onItemClick?.(item)}
                />
              </div>
            ))}
          </div>

          {/* Gradientes de fade nas bordas - Desktop */}
          <div className="hidden md:block absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent pointer-events-none" />
          <div className="hidden md:block absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  );
}
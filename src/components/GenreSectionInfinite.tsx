import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useInfiniteContent } from '@/hooks/use-infinite-content';
import { MovieCard } from './MovieCard';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GenreSectionInfiniteProps {
  title: string;
  genreId: number;
  contentType: 'movies' | 'tv';
}

export function GenreSectionInfinite({ title, genreId, contentType }: GenreSectionInfiniteProps) {
  const type = contentType === 'movies' ? 'movies-by-genre' : 'tv-by-genre';
  const { items, loading, hasMore, loadMore, reset } = useInfiniteContent({ type, genreId });
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Reset quando tipo ou gênero mudar
  useEffect(() => {
    if (genreId) {
      reset();
    }
  }, [genreId, contentType, reset]);

  // Funções de navegação
  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  // Manipular scroll horizontal
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const scrollPercentage = (scrollLeft + clientWidth) / scrollWidth;

    // Atualizar visibilidade das setas
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);

    // Carregar mais quando chegar a 80% do scroll
    if (scrollPercentage > 0.8 && hasMore && !loading) {
      loadMore();
    }
  }, [hasMore, loading, loadMore]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Throttle scroll events for better performance
    let timeoutId: NodeJS.Timeout;
    const throttledScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 100);
    };

    container.addEventListener('scroll', throttledScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', throttledScroll);
      clearTimeout(timeoutId);
    };
  }, [handleScroll]);

  if (items.length === 0 && !loading) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      
      <div className="relative group">
        {/* Seta esquerda */}
        {showLeftArrow && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex"
            onClick={scrollLeft}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}

        {/* Seta direita */}
        {showRightArrow && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex"
            onClick={scrollRight}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        )}

        <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto pb-4 scroll-smooth scroll-container"
          >
          {items.map((item) => (
            <MovieCard
              key={item.id}
              item={item}
            />
          ))}
          
          {loading && (
            <div className="flex items-center justify-center w-48 h-72 flex-shrink-0">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
          
          {!hasMore && items.length > 0 && (
            <div className="flex items-center justify-center w-48 h-72 flex-shrink-0">
              <p className="text-gray-400 text-center">Fim do conteúdo</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
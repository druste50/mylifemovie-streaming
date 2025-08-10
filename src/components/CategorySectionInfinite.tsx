import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useInfiniteContent } from '@/hooks/use-infinite-content';
import { MovieCard } from './MovieCard';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CategorySectionInfiniteProps {
  title: string;
  type: 'popular-movies' | 'trending-movies' | 'top-rated-movies' | 'popular-tv' | 'trending-tv';
  onItemClick?: (item: any) => void;
}

export function CategorySectionInfinite({ title, type, onItemClick }: CategorySectionInfiniteProps) {
  const { items, loading, hasMore, loadMore } = useInfiniteContent({ type });
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);



  // O hook useInfiniteContent já carrega o conteúdo inicial automaticamente

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
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
      {items.length === 0 && loading && (
        <div className="text-white">Carregando {title.toLowerCase()}...</div>
      )}
      <div className="relative group">
        {/* Seta esquerda */}
        {showLeftArrow && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            onClick={scrollLeft}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
        )}
        
        {/* Seta direita */}
        {showRightArrow && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            onClick={scrollRight}
          >
            <ChevronRight className="w-6 h-6" />
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
              onClick={() => onItemClick?.(item)}
            />
          ))}
          
          {loading && (
            <div className="flex-shrink-0 flex items-center justify-center w-48 h-72">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          )}
          
          {!hasMore && items.length > 0 && (
            <div className="flex-shrink-0 flex items-center justify-center w-48 h-72 text-gray-400">
              <span className="text-sm">Fim do conteúdo</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
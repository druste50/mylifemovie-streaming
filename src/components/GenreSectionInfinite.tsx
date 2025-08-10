import React, { useEffect, useRef, useCallback } from 'react';
import { useInfiniteContent } from '@/hooks/use-infinite-content';
import { MovieCard } from './MovieCard';
import { Loader2 } from 'lucide-react';

interface GenreSectionInfiniteProps {
  title: string;
  genreId: number;
  contentType: 'movies' | 'tv';
}

export function GenreSectionInfinite({ title, genreId, contentType }: GenreSectionInfiniteProps) {
  const type = contentType === 'movies' ? 'movies-by-genre' : 'tv-by-genre';
  const { items, loading, hasMore, loadMore } = useInfiniteContent({ type, genreId });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Carregar conteúdo inicial
  useEffect(() => {
    loadMore();
  }, [genreId]);

  // Verificar se o container pode ser rolado
  const checkScrollable = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return false;
    return container.scrollWidth > container.clientWidth;
  }, []);

  // Carregar mais conteúdo quando necessário
  useEffect(() => {
    const loadMoreIfNeeded = async () => {
      if (!hasMore || loading) return;
      
      // Se não há scroll horizontal, carregar mais automaticamente
      if (!checkScrollable()) {
        await loadMore();
      }
    };

    const timer = setTimeout(loadMoreIfNeeded, 100);
    return () => clearTimeout(timer);
  }, [items, hasMore, loading, loadMore, checkScrollable]);

  // Manipular scroll horizontal
  const handleScroll = useCallback(async () => {
    const container = scrollContainerRef.current;
    if (!container || loading || !hasMore) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const scrollPercentage = (scrollLeft + clientWidth) / scrollWidth;

    // Carregar mais quando chegar a 80% do scroll
    if (scrollPercentage >= 0.8) {
      await loadMore();
    }
  }, [loading, hasMore, loadMore]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  if (items.length === 0 && !loading) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
      <div 
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item) => (
          <div key={item.id} className="flex-shrink-0">
            <MovieCard movie={item} />
          </div>
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
  );
}
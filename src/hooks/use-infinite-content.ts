import { useState, useCallback } from 'react';
import { Movie, TVShow } from '@/types/movie';
import { tmdbService } from '@/services/tmdbService';

type ContentType = 'popular-movies' | 'trending-movies' | 'top-rated-movies' | 'popular-tv' | 'trending-tv' | 'movies-by-genre' | 'tv-by-genre';

interface UseInfiniteContentProps {
  type: ContentType;
  genreId?: number;
  initialPage?: number;
}

interface UseInfiniteContentReturn {
  items: (Movie | TVShow)[];
  loading: boolean;
  hasMore: boolean;
  currentPage: number;
  totalPages: number;
  loadMore: () => Promise<void>;
  reset: () => void;
}

export function useInfiniteContent({ 
  type, 
  genreId, 
  initialPage = 1 
}: UseInfiniteContentProps): UseInfiniteContentReturn {
  const [items, setItems] = useState<(Movie | TVShow)[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);

  const fetchContent = useCallback(async (page: number) => {
    try {
      let response: { results: (Movie | TVShow)[], hasMore: boolean, totalPages: number };
      
      switch (type) {
        case 'popular-movies':
          response = await tmdbService.getPopularMoviesPage(page);
          break;
        case 'trending-movies':
          response = await tmdbService.getTrendingMoviesPage(page);
          break;
        case 'top-rated-movies':
          response = await tmdbService.getTopRatedMoviesPage(page);
          break;
        case 'popular-tv':
          response = await tmdbService.getPopularTVShowsPage(page);
          break;
        case 'trending-tv':
          response = await tmdbService.getTrendingTVShowsPage(page);
          break;
        case 'movies-by-genre':
          if (!genreId) throw new Error('genreId é obrigatório para movies-by-genre');
          response = await tmdbService.getMoviesByGenrePage(genreId, page);
          break;
        case 'tv-by-genre':
          if (!genreId) throw new Error('genreId é obrigatório para tv-by-genre');
          response = await tmdbService.getTVShowsByGenrePage(genreId, page);
          break;
        default:
          throw new Error(`Tipo de conteúdo não suportado: ${type}`);
      }

      // Filtrar conteúdo disponível no WarezCDN
      const filteredContent = type.includes('tv') || type.includes('series')
        ? await tmdbService.filterAvailableTVShows(response.results as TVShow[])
        : await tmdbService.filterAvailableMovies(response.results as Movie[]);

      console.log(`📊 Página ${page} - ${type}: ${response.results.length} buscados → ${filteredContent.length} disponíveis`);

      return {
        results: filteredContent,
        hasMore: response.hasMore,
        totalPages: response.totalPages
      };
    } catch (error) {
      console.error('Erro ao buscar conteúdo:', error);
      throw error;
    }
  }, [type, genreId]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await fetchContent(currentPage);
      
      setItems(prev => {
        // Evitar duplicatas e filtrar itens inválidos
        const existingIds = new Set(prev.map(item => item.id));
        const newItems = response.results.filter(item => 
          item && 
          item.id && 
          !existingIds.has(item.id)
        );
        return [...prev, ...newItems];
      });
      
      setHasMore(response.hasMore);
      setTotalPages(response.totalPages);
      setCurrentPage(prev => prev + 1);
    } catch (error) {
      console.error('Erro ao carregar mais conteúdo:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, hasMore, loading, fetchContent]);

  const reset = useCallback(() => {
    setItems([]);
    setLoading(false);
    setHasMore(true);
    setCurrentPage(initialPage);
    setTotalPages(0);
  }, [initialPage]);

  return {
    items,
    loading,
    hasMore,
    currentPage,
    totalPages,
    loadMore,
    reset
  };
}
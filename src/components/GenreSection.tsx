import { useState, useEffect } from 'react';
import { Genre, Movie, TVShow } from '@/types/movie';
import { tmdbService } from '@/services/tmdbService';
import { CategorySection } from './CategorySection';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface GenreSectionProps {
  type: 'movie' | 'tv';
  onItemClick: (item: Movie | TVShow) => void;
}

export function GenreSection({ type, onItemClick }: GenreSectionProps) {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [genreContent, setGenreContent] = useState<(Movie | TVShow)[]>([]);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [genreScrollPosition, setGenreScrollPosition] = useState(0);

  // Carregar gêneros
  useEffect(() => {
    loadGenres();
  }, [type]);

  // Carregar conteúdo quando gênero é selecionado
  useEffect(() => {
    if (selectedGenre) {
      loadGenreContent(selectedGenre.id);
    }
  }, [selectedGenre, type]);

  const loadGenres = async () => {
    try {
      setLoading(true);
      const response = type === 'movie' 
        ? await tmdbService.getMovieGenres()
        : await tmdbService.getTVGenres();
      
      setGenres(response.genres);
      
      // Selecionar primeiro gênero automaticamente
      if (response.genres.length > 0) {
        setSelectedGenre(response.genres[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar gêneros:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGenreContent = async (genreId: number) => {
    try {
      setContentLoading(true);
      const response = type === 'movie'
        ? await tmdbService.getMoviesByGenre(genreId)
        : await tmdbService.getTVShowsByGenre(genreId);
      
      setGenreContent(response.results);
    } catch (error) {
      console.error('Erro ao carregar conteúdo do gênero:', error);
    } finally {
      setContentLoading(false);
    }
  };

  const scrollGenres = (direction: 'left' | 'right') => {
    const container = document.getElementById('genres-container');
    if (container) {
      const scrollAmount = 300;
      const newPosition = direction === 'left' 
        ? Math.max(0, genreScrollPosition - scrollAmount)
        : genreScrollPosition + scrollAmount;
      
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setGenreScrollPosition(newPosition);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-48 mb-6"></div>
          <div className="flex gap-3 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-700 rounded-full w-24"></div>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Título da seção */}
      <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
        {type === 'movie' ? '🎬' : '📺'}
        {type === 'movie' ? 'Filmes por Gênero' : 'Séries por Gênero'}
      </h2>

      {/* Seletor de gêneros */}
      <div className="relative mb-8">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => scrollGenres('left')}
            className="text-white hover:bg-white/10 p-2"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div 
            id="genres-container"
            className="flex gap-3 overflow-x-auto scrollbar-hide flex-1 py-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {genres.map((genre) => (
              <Badge
                key={genre.id}
                variant={selectedGenre?.id === genre.id ? "default" : "outline"}
                className={`cursor-pointer whitespace-nowrap px-4 py-2 text-sm transition-all hover:scale-105 ${
                  selectedGenre?.id === genre.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-gray-600 text-gray-300 hover:border-primary hover:text-primary'
                }`}
                onClick={() => setSelectedGenre(genre)}
              >
                {genre.name}
              </Badge>
            ))}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => scrollGenres('right')}
            className="text-white hover:bg-white/10 p-2"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Conteúdo do gênero selecionado */}
      {selectedGenre && (
        <CategorySection
          title={`${selectedGenre.name}`}
          items={genreContent}
          onItemClick={onItemClick}
          loading={contentLoading}
          showTitle={false}
        />
      )}
    </div>
  );
}
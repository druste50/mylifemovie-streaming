import React, { useState, useEffect } from 'react';
import { Genre } from '@/types/movie';
import { tmdbService } from '@/services/tmdbService';
import { GenreSectionInfinite } from './GenreSectionInfinite';
import { Button } from '@/components/ui/button';

interface GenreSectionProps {
  contentType?: 'movies' | 'tv';
}

export function GenreSection({ contentType = 'movies' }: GenreSectionProps) {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);

  useEffect(() => {
    loadGenres();
  }, [contentType]);

  const loadGenres = async () => {
    try {
      const response = contentType === 'movies' 
        ? await tmdbService.getMovieGenres()
        : await tmdbService.getTVGenres();
      const genresList = response.genres || [];
      setGenres(genresList);
      if (genresList.length > 0) {
        setSelectedGenre(genresList[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar gêneros:', error);
      setGenres([]); // Garantir que genres seja sempre um array
    }
  };

  const handleGenreChange = (genre: Genre) => {
    setSelectedGenre(genre);
  };

  return (
    <div className="space-y-10">
      {/* Seletor de gêneros */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Escolha um Gênero</h2>
          <p className="text-gray-400">Clique em um gênero para explorar o conteúdo</p>
        </div>
        
        <div className="genre-grid grid gap-3">
          {genres.map((genre) => (
            <Button
              key={genre.id}
              variant={selectedGenre?.id === genre.id ? 'default' : 'outline'}
              onClick={() => handleGenreChange(genre)}
              className={`genre-button text-sm py-3 px-4 rounded-full font-medium ${
                selectedGenre?.id === genre.id ? 'active' : ''
              }`}
              size="sm"
            >
              {genre.name}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Conteúdo do gênero */}
      {selectedGenre && (
        <GenreSectionInfinite
          title={`${selectedGenre.name} - ${contentType === 'movies' ? 'Filmes' : 'Séries'}`}
          genreId={selectedGenre.id}
          contentType={contentType}
        />
      )}
    </div>
  );
}
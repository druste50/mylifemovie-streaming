import React, { useState, useEffect } from 'react';
import { Genre } from '@/types/movie';
import { tmdbService } from '@/services/tmdbService';
import { GenreSectionInfinite } from './GenreSectionInfinite';
import { Button } from '@/components/ui/button';

export function GenreSection() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [contentType, setContentType] = useState<'movies' | 'tv'>('movies');

  useEffect(() => {
    loadGenres();
  }, []);

  const loadGenres = async () => {
    try {
      const movieGenres = await tmdbService.getMovieGenres();
      setGenres(movieGenres);
      if (movieGenres.length > 0) {
        setSelectedGenre(movieGenres[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar gêneros:', error);
    }
  };

  const handleGenreChange = (genre: Genre) => {
    setSelectedGenre(genre);
  };

  const handleContentTypeChange = (type: 'movies' | 'tv') => {
    setContentType(type);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-white">Explorar por Gênero</h2>
        
        {/* Seletor de tipo de conteúdo */}
        <div className="flex gap-2">
          <Button
            variant={contentType === 'movies' ? 'default' : 'outline'}
            onClick={() => handleContentTypeChange('movies')}
            className="text-sm"
          >
            Filmes
          </Button>
          <Button
            variant={contentType === 'tv' ? 'default' : 'outline'}
            onClick={() => handleContentTypeChange('tv')}
            className="text-sm"
          >
            Séries
          </Button>
        </div>
        
        {/* Seletor de gêneros */}
        <div className="flex flex-wrap gap-2">
          {genres.map((genre) => (
            <Button
              key={genre.id}
              variant={selectedGenre?.id === genre.id ? 'default' : 'outline'}
              onClick={() => handleGenreChange(genre)}
              className="text-sm"
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
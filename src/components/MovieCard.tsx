import { Movie, TVShow } from '@/types/movie';
import { tmdbService } from '@/services/tmdbService';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Play, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MovieCardProps {
  item: Movie | TVShow;
  onClick?: () => void;
  showPlayButton?: boolean;
}

export function MovieCard({ item, onClick, showPlayButton = true }: MovieCardProps) {
  const isMovie = 'title' in item;
  const title = isMovie ? item.title : item.name;
  const releaseDate = isMovie ? item.release_date : item.first_air_date;
  const posterUrl = tmdbService.getPosterUrl(item.poster_path);
  
  const year = releaseDate ? new Date(releaseDate).getFullYear() : '';
  const rating = item.vote_average.toFixed(1);

  return (
    <Card 
      className="movie-card group cursor-pointer border-0 p-0"
      onClick={onClick}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg">
        <img
          src={posterUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Overlay com gradiente */}
        <div className="absolute inset-0 overlay-gradient opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Rating badge */}
        <Badge className="absolute top-2 right-2 bg-black/70 text-yellow-400 border-0">
          <Star className="w-3 h-3 mr-1 fill-current" />
          {rating}
        </Badge>

        {/* Botão de play */}
        {showPlayButton && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button 
              size="lg" 
              className="gradient-primary border-0 hover:scale-110 transition-transform"
            >
              <Play className="w-6 h-6 mr-2 fill-current" />
              Assistir
            </Button>
          </div>
        )}
      </div>

      {/* Informações do filme */}
      <div className="p-4">
        <h3 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {year}
          </span>
          <span className="px-2 py-1 bg-muted rounded-full">
            {isMovie ? 'Filme' : 'Série'}
          </span>
        </div>
      </div>
    </Card>
  );
}
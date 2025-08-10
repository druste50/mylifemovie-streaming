import { Movie } from '@/types/movie';
import { tmdbService } from '@/services/tmdbService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Info, Star, Calendar } from 'lucide-react';

interface HeroSectionProps {
  movie: Movie;
  onPlay?: () => void;
  onInfo?: () => void;
}

export function HeroSection({ movie, onPlay, onInfo }: HeroSectionProps) {
  const backdropUrl = tmdbService.getBackdropUrl(movie.backdrop_path, 'original');
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : '';
  const rating = movie.vote_average.toFixed(1);

  return (
    <div className="relative h-[70vh] min-h-[500px] w-full overflow-hidden">
      {/* Imagem de fundo */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backdropUrl})` }}
      />
      
      {/* Overlay com gradiente */}
      <div className="absolute inset-0 gradient-hero opacity-80" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

      {/* Conteúdo */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl animate-fade-in-up">
            {/* Badge de destaque */}
            <Badge className="mb-4 gradient-primary border-0 text-white font-medium">
              Em Destaque
            </Badge>

            {/* Título */}
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white leading-tight">
              {movie.title}
            </h1>

            {/* Informações do filme */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1 text-yellow-400">
                <Star className="w-5 h-5 fill-current" />
                <span className="font-semibold">{rating}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{year}</span>
              </div>
              <Badge variant="outline" className="border-white/20 text-white">
                Filme
              </Badge>
            </div>

            {/* Sinopse */}
            <p className="text-lg text-gray-200 mb-8 leading-relaxed line-clamp-3">
              {movie.overview}
            </p>

            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="gradient-primary border-0 text-white font-semibold px-8 py-3 hover:scale-105 transition-transform"
                onClick={onPlay}
              >
                <Play className="w-5 h-5 mr-2 fill-current" />
                Assistir Agora
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="glass border-white/20 text-white hover:bg-white/10 font-semibold px-8 py-3"
                onClick={onInfo}
              >
                <Info className="w-5 h-5 mr-2" />
                Mais Informações
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
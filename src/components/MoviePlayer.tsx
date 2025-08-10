import { useState, useEffect } from 'react';
import { X, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface MoviePlayerProps {
  imdbId: string;
  title: string;
  type: 'movie' | 'series';
  season?: number;
  episode?: number;
  onClose: () => void;
}

export function MoviePlayer({ imdbId, title, type, season, episode, onClose }: MoviePlayerProps) {
  const [isMuted, setIsMuted] = useState(false);

  // Construir URL do embed WarezCDN
  const getEmbedUrl = () => {
    let url = `https://embed.warezcdn.com/${type === 'movie' ? 'filme' : 'serie'}/${imdbId}`;
    
    if (type === 'series' && season) {
      url += `/${season}`;
      if (episode) {
        url += `/${episode}`;
      }
    }
    
    // Personalizações do embed
    url += '#transparent#color6c5ce7';
    
    return url;
  };

  // Escape key para fechar
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      {/* Controles do Player */}
      <div className="absolute top-4 left-4 right-4 z-60 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-white font-semibold text-lg">{title}</h2>
          {type === 'series' && season && episode && (
            <span className="text-gray-300 text-sm">
              T{season} E{episode}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Player com proteções contra anúncios */}
      <div className="w-full h-full max-w-7xl max-h-[80vh] mx-4">
        <Card className="w-full h-full border-0 overflow-hidden bg-black">
          <iframe
            src={getEmbedUrl()}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-presentation allow-forms allow-popups-to-escape-sandbox"
            allow="autoplay; encrypted-media; fullscreen *; picture-in-picture"
            referrerPolicy="no-referrer"
            title={title}
            style={{ 
              pointerEvents: 'auto',
              isolation: 'isolate'
            }}
          />
        </Card>
      </div>

      {/* Instruções */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <p className="text-gray-400 text-sm text-center">
          Pressione ESC para sair • Use os controles do player interno para fullscreen e qualidade
        </p>
      </div>
    </div>
  );
}
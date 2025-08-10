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
  const [showIOSMessage, setShowIOSMessage] = useState(false);
  const [isLoadingStream, setIsLoadingStream] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [showNativePlayer, setShowNativePlayer] = useState(false);

  // Construir URL do embed WarezCDN
  const getEmbedUrl = () => {
    // Tentar múltiplos domínios do WarezCDN
    const domains = [
      'https://embed.warezcdn.link',
      'https://embed.warezcdn.com',
      'https://warezcdn.link/embed'
    ];
    
    let url = `${domains[0]}/${type === 'movie' ? 'filme' : 'serie'}/${imdbId}`;
    
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

  // URL alternativa para iOS (sem personalizações que podem causar problemas)
  const getSimpleEmbedUrl = () => {
    let url = `https://warezcdn.link/${type === 'movie' ? 'filme' : 'serie'}/${imdbId}`;
    
    if (type === 'series' && season) {
      url += `/${season}`;
      if (episode) {
        url += `/${episode}`;
      }
    }
    
    return url;
  };

  // Detectar se é iOS
  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  };

  // Detectar se é iOS Safari
  const isIOSSafari = () => {
    const userAgent = navigator.userAgent;
    return /iPad|iPhone|iPod/.test(userAgent) && /Safari/.test(userAgent) && !/CriOS|FxiOS/.test(userAgent);
  };

  // Tentar abrir no player nativo do iOS
  const openInNativePlayer = () => {
    const videoUrl = getSimpleEmbedUrl();
    // Tentar abrir diretamente no player nativo
    window.open(videoUrl, '_blank');
  };

  // Copiar URL alternativa
  const copyAlternativeUrl = () => {
    const simpleUrl = getSimpleEmbedUrl();
    navigator.clipboard.writeText(simpleUrl);
    setShowIOSMessage(true);
    setTimeout(() => setShowIOSMessage(false), 3000);
  };

  // Tentar player nativo iOS
  const tryNativePlayer = async () => {
    setIsLoadingStream(true);
    
    try {
      // Usar diretamente o embed URL simplificado no player nativo
      // O Safari iOS pode conseguir extrair o stream automaticamente
      const embedUrl = getSimpleEmbedUrl();
      
      // Lista de possíveis URLs de stream para tentar
      const possibleStreams = [
        // Tentar URLs de stream diretos primeiro
        `https://warezcdn.link/api/stream/${imdbId}${type === 'series' && season ? `/${season}${episode ? `/${episode}` : ''}` : ''}.m3u8`,
        `https://embed.warezcdn.link/api/stream/${imdbId}${type === 'series' && season ? `/${season}${episode ? `/${episode}` : ''}` : ''}.m3u8`,
        `https://warezcdn.link/stream/${imdbId}${type === 'series' && season ? `/${season}${episode ? `/${episode}` : ''}` : ''}/playlist.m3u8`,
        // Como fallback, usar o embed URL diretamente
        embedUrl
      ];
      
      // Tentar o primeiro stream disponível
      const streamUrl = possibleStreams[0];
      
      console.log('Tentando carregar stream:', streamUrl);
      
      setStreamUrl(streamUrl);
      setShowNativePlayer(true);
      setIsLoadingStream(false);
      
    } catch (error) {
      console.error('Erro ao tentar extrair stream:', error);
      alert('Erro ao carregar player nativo. Tente as outras opções.');
      setIsLoadingStream(false);
    }
  };

  // Verificar se o dispositivo suporta HLS nativo
  const supportsNativeHLS = () => {
    const video = document.createElement('video');
    return video.canPlayType('application/vnd.apple.mpegurl') !== '';
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
        {isIOS() ? (
          // Interface especial para iOS
          <Card className="w-full h-full border-0 overflow-hidden bg-gradient-to-br from-gray-900 to-black flex flex-col items-center justify-center p-8">
            {showNativePlayer && streamUrl ? (
              // Player nativo iOS com HLS
              <div className="w-full h-full flex flex-col">
                <div className="flex-1 flex items-center justify-center">
                  <video
                    className="w-full h-full max-h-[70vh] bg-black"
                    controls
                    playsInline
                    preload="metadata"
                    src={streamUrl}
                    onError={(e) => {
                      console.error('Erro no player nativo:', e);
                      
                      // Tentar próximo URL da lista
                      const possibleStreams = [
                        `https://warezcdn.link/api/stream/${imdbId}${type === 'series' && season ? `/${season}${episode ? `/${episode}` : ''}` : ''}.m3u8`,
                        `https://embed.warezcdn.link/api/stream/${imdbId}${type === 'series' && season ? `/${season}${episode ? `/${episode}` : ''}` : ''}.m3u8`,
                        `https://warezcdn.link/stream/${imdbId}${type === 'series' && season ? `/${season}${episode ? `/${episode}` : ''}` : ''}/playlist.m3u8`,
                        getSimpleEmbedUrl()
                      ];
                      
                      const currentIndex = possibleStreams.indexOf(streamUrl);
                      const nextIndex = currentIndex + 1;
                      
                      if (nextIndex < possibleStreams.length) {
                        console.log('Tentando próximo stream:', possibleStreams[nextIndex]);
                        setStreamUrl(possibleStreams[nextIndex]);
                      } else {
                        alert('Não foi possível reproduzir o vídeo. Tente as outras opções disponíveis.');
                        setShowNativePlayer(false);
                        setStreamUrl(null);
                      }
                    }}
                    onLoadStart={() => {
                      console.log('Iniciando carregamento do vídeo:', streamUrl);
                    }}
                    onCanPlay={() => {
                      console.log('Vídeo pronto para reprodução');
                    }}
                  >
                    Seu navegador não suporta reprodução de vídeo HTML5.
                  </video>
                </div>
                <div className="mt-4 text-center">
                  <Button 
                    onClick={() => {
                      setShowNativePlayer(false);
                      setStreamUrl(null);
                    }}
                    variant="outline"
                    className="border-gray-600 text-white hover:bg-gray-800"
                  >
                    ← Voltar às Opções
                  </Button>
                </div>
              </div>
            ) : (
              // Interface de opções
              <div className="text-center space-y-6">
                <div className="text-6xl mb-4">📱</div>
                <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
                <p className="text-gray-300 text-lg mb-6">
                  Escolha a melhor opção para assistir no iOS:
                </p>
                
                <div className="space-y-4 w-full max-w-md">
                  {supportsNativeHLS() && (
                    <Button 
                      onClick={tryNativePlayer}
                      disabled={isLoadingStream}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg"
                    >
                      {isLoadingStream ? '🔄 Carregando...' : '🎬 Player Nativo iOS'}
                    </Button>
                  )}
                  
                   <Button 
                     onClick={openInNativePlayer}
                     className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
                   >
                     🌐 Abrir em Nova Aba
                   </Button>
                   
                   <Button 
                     onClick={copyAlternativeUrl}
                     variant="outline"
                     className="w-full border-gray-600 text-white hover:bg-gray-800 py-3 text-lg"
                   >
                     📋 Copiar Link Simplificado
                   </Button>
                   
                   <Button 
                     onClick={() => {
                       const fullUrl = getEmbedUrl();
                       navigator.clipboard.writeText(fullUrl);
                       setShowIOSMessage(true);
                       setTimeout(() => setShowIOSMessage(false), 3000);
                     }}
                     variant="outline"
                     className="w-full border-gray-600 text-white hover:bg-gray-800 py-3 text-lg"
                   >
                     📋 Copiar Link Completo
                   </Button>
                 </div>
                
                {showIOSMessage && (
                   <div className="bg-green-600 text-white px-4 py-2 rounded-lg mt-4">
                     ✅ Link copiado! Teste em Chrome, Firefox ou cole diretamente no navegador
                   </div>
                 )}
                
                <div className="bg-blue-900/30 border border-blue-600/50 rounded-lg p-4 mt-6">
                  <p className="text-blue-200 text-sm">
                    💡 <strong>Novo:</strong> Experimente o Player Nativo iOS para reprodução direta!
                  </p>
                </div>
                
                <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4 mt-2">
                  <p className="text-yellow-200 text-sm">
                    📱 Para melhor experiência, use Chrome ou Firefox em vez do Safari.
                  </p>
                </div>
              </div>
            )}
          </Card>
        ) : (
          // Player normal para outros dispositivos
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
        )}
      </div>

      {/* Instruções - apenas para dispositivos não-iOS */}
      {!isIOS() && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 max-w-md">
          <p className="text-gray-400 text-sm text-center mb-2">
            Pressione ESC para sair • Use os controles do player interno para fullscreen e qualidade
          </p>
        </div>
      )}
    </div>
  );
}
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
  const [showError, setShowError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  // Detectar erro de carregamento do iframe
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 5000); // 5 segundos para carregar

    return () => clearTimeout(timer);
  }, []);

  // Função para lidar com erro do iframe
  const handleIframeError = () => {
    setShowError(true);
    setIsLoading(false);
  };

  // Função para lidar com carregamento bem-sucedido do iframe
  const handleIframeLoad = () => {
    setIsLoading(false);
    setShowError(false);
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

  // Tentar extrair stream usando postMessage e proxy
  const tryNativePlayer = async () => {
    setIsLoadingStream(true);
    
    try {
      console.log('Iniciando extração de stream para iOS...');
      
      // Método 1: Tentar URLs diretos de stream
      const directStreams = [
        `https://warezcdn.link/api/stream/${imdbId}${type === 'series' && season ? `/${season}${episode ? `/${episode}` : ''}` : ''}.m3u8`,
        `https://embed.warezcdn.link/api/stream/${imdbId}${type === 'series' && season ? `/${season}${episode ? `/${episode}` : ''}` : ''}.m3u8`,
        `https://warezcdn.link/stream/${imdbId}${type === 'series' && season ? `/${season}${episode ? `/${episode}` : ''}` : ''}/playlist.m3u8`
      ];
      
      // Método 2: Tentar usar proxy CORS
      const proxyUrls = [
        `https://cors-anywhere.herokuapp.com/${getSimpleEmbedUrl()}`,
        `https://api.allorigins.win/get?url=${encodeURIComponent(getSimpleEmbedUrl())}`,
        `https://thingproxy.freeboard.io/fetch/${getSimpleEmbedUrl()}`
      ];
      
      // Método 3: Tentar iframe com postMessage
      const tryIframeExtraction = () => {
        return new Promise((resolve, reject) => {
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.sandbox = 'allow-scripts allow-same-origin';
          iframe.src = getSimpleEmbedUrl();
          
          const timeout = setTimeout(() => {
            document.body.removeChild(iframe);
            reject(new Error('Timeout na extração via iframe'));
          }, 10000);
          
          // Escutar mensagens do iframe
          const messageHandler = (event) => {
            if (event.source === iframe.contentWindow) {
              clearTimeout(timeout);
              document.body.removeChild(iframe);
              window.removeEventListener('message', messageHandler);
              
              if (event.data && event.data.streamUrl) {
                resolve(event.data.streamUrl);
              } else {
                reject(new Error('Stream não encontrado via postMessage'));
              }
            }
          };
          
          window.addEventListener('message', messageHandler);
          document.body.appendChild(iframe);
          
          // Tentar injetar script no iframe após carregamento
          iframe.onload = () => {
            try {
              iframe.contentWindow.postMessage({
                action: 'extractStream',
                imdbId: imdbId,
                type: type,
                season: season,
                episode: episode
              }, '*');
            } catch (e) {
              console.log('Não foi possível comunicar com iframe:', e);
            }
          };
        });
      };
      
      // Tentar métodos em sequência
      let streamUrl = null;
      
      // 1. Tentar streams diretos
      for (const url of directStreams) {
        try {
          console.log('Testando stream direto:', url);
          const response = await fetch(url, { 
            method: 'HEAD',
            mode: 'no-cors'
          });
          streamUrl = url;
          break;
        } catch (e) {
          console.log('Stream direto falhou:', url);
        }
      }
      
      // 2. Se não encontrou, tentar proxies
      if (!streamUrl) {
        for (const proxyUrl of proxyUrls) {
          try {
            console.log('Testando proxy:', proxyUrl);
            const response = await fetch(proxyUrl, {
              method: 'GET',
              mode: 'cors'
            });
            
            if (response.ok) {
              const text = await response.text();
              // Procurar por URLs de stream no HTML
              const m3u8Match = text.match(/https?:\/\/[^\s"']+\.m3u8/g);
              if (m3u8Match && m3u8Match.length > 0) {
                streamUrl = m3u8Match[0];
                break;
              }
            }
          } catch (e) {
            console.log('Proxy falhou:', proxyUrl);
          }
        }
      }
      
      // 3. Se ainda não encontrou, tentar iframe com postMessage
      if (!streamUrl) {
        try {
          console.log('Tentando extração via iframe...');
          streamUrl = await tryIframeExtraction();
        } catch (e) {
          console.log('Extração via iframe falhou:', e);
        }
      }
      
      // 4. Como último recurso, usar o embed URL diretamente
      if (!streamUrl) {
        console.log('Usando embed URL como fallback');
        streamUrl = getSimpleEmbedUrl();
      }
      
      console.log('Stream final selecionado:', streamUrl);
      setStreamUrl(streamUrl);
      setShowNativePlayer(true);
      setIsLoadingStream(false);
      
    } catch (error) {
      console.error('Erro na extração de stream:', error);
      // Como fallback final, usar o embed diretamente
      setStreamUrl(getSimpleEmbedUrl());
      setShowNativePlayer(true);
      setIsLoadingStream(false);
    }
  };

  // Verificar se o dispositivo suporta HLS nativo
  const supportsNativeHLS = () => {
    const video = document.createElement('video');
    return video.canPlayType('application/vnd.apple.mpegurl') !== '';
  };

  // Escape key para fechar e listener para postMessage
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Listener para mensagens do iframe (bypass)
    const handleMessage = (event: MessageEvent) => {
      console.log('Mensagem recebida:', event.data);
      
      // Verificar se é uma mensagem de stream
      if (event.data && typeof event.data === 'object') {
        if (event.data.streamUrl) {
          console.log('Stream URL encontrado via postMessage:', event.data.streamUrl);
          setStreamUrl(event.data.streamUrl);
        }
        
        if (event.data.action === 'player-ready') {
          console.log('Player do iframe está pronto');
          // Tentar enviar comandos de bypass
          event.source?.postMessage({
            action: 'disable-protection',
            commands: [
              'document.querySelectorAll(".overlay, .protection, .blocker").forEach(el => el.remove())',
              'document.body.style.pointerEvents = "auto"',
              'document.querySelectorAll("*").forEach(el => el.style.pointerEvents = "auto")',
              'window.addEventListener("contextmenu", e => e.stopPropagation(), true)'
            ]
          }, '*');
        }
        
        if (event.data.action === 'bypass-success') {
          console.log('Bypass realizado com sucesso');
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    window.addEventListener('message', handleMessage);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('message', handleMessage);
    };
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
          // Interface simplificada para iOS
          <Card className="w-full h-full border-0 overflow-hidden bg-gradient-to-br from-gray-900 to-black flex flex-col items-center justify-center p-8">
            <div className="text-center space-y-6 max-w-md">
              <div className="text-6xl mb-4">🚧</div>
              <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
              
              <div className="bg-orange-900/30 border border-orange-600/50 rounded-lg p-6 mt-6">
                <div className="text-orange-200 space-y-3">
                  <h4 className="text-lg font-semibold text-orange-100">🔧 Em Desenvolvimento</h4>
                  <p className="text-sm">
                    Estamos implementando uma solução específica para dispositivos iOS.
                  </p>
                  <p className="text-sm">
                    Por favor, acesse este site em <strong>qualquer navegador do iOS</strong> (Safari, Chrome, Firefox, Edge) para a melhor experiência.
                  </p>
                </div>
              </div>
              
              <div className="bg-blue-900/30 border border-blue-600/50 rounded-lg p-4 mt-4">
                <p className="text-blue-200 text-sm">
                  💡 <strong>Dica:</strong> Enquanto isso, você pode usar um computador ou dispositivo Android para assistir normalmente.
                </p>
              </div>
              
              <div className="bg-gray-800/50 border border-gray-600/50 rounded-lg p-4 mt-4">
                <p className="text-gray-300 text-xs">
                  Agradecemos sua paciência enquanto trabalhamos para oferecer a melhor experiência no iOS.
                </p>
              </div>
            </div>
          </Card>
        ) : showError ? (
          // Mensagem de erro quando conteúdo não está disponível
          <Card className="w-full h-full border-0 overflow-hidden bg-gradient-to-br from-red-900 to-black flex flex-col items-center justify-center p-8">
            <div className="text-center space-y-6 max-w-md">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
              
              <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-6 mt-6">
                <div className="text-red-200 space-y-3">
                  <h4 className="text-lg font-semibold text-red-100">Conteúdo Indisponível</h4>
                  <p className="text-sm">
                    Este {type === 'movie' ? 'filme' : 'série'} não está disponível para streaming no momento.
                  </p>
                  <p className="text-sm">
                    Isso pode acontecer quando o conteúdo ainda não foi sincronizado com nossos servidores.
                  </p>
                </div>
              </div>
              
              <div className="bg-blue-900/30 border border-blue-600/50 rounded-lg p-4 mt-4">
                <p className="text-blue-200 text-sm">
                  💡 <strong>Sugestão:</strong> Tente novamente mais tarde ou escolha outro título.
                </p>
              </div>
              
              <Button 
                onClick={onClose}
                className="bg-red-600 hover:bg-red-700 text-white mt-4"
              >
                Voltar
              </Button>
            </div>
          </Card>
        ) : isLoading ? (
          // Loading state
          <Card className="w-full h-full border-0 overflow-hidden bg-black flex flex-col items-center justify-center">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              <p className="text-white text-lg">Carregando {title}...</p>
            </div>
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
              onLoad={handleIframeLoad}
              onError={handleIframeError}
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
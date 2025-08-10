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
          // Interface especial para iOS
          <Card className="w-full h-full border-0 overflow-hidden bg-gradient-to-br from-gray-900 to-black flex flex-col items-center justify-center p-8">
            {showNativePlayer && streamUrl ? (
              // Player nativo iOS com HLS ou iframe bypass
              <div className="w-full h-full flex flex-col">
                <div className="flex-1 flex items-center justify-center">
                  {streamUrl === 'iframe-bypass' ? (
                    // Iframe com bypass especial para iOS
                    <div className="w-full h-full relative bg-black">
                      <iframe
                        src={getSimpleEmbedUrl()}
                        className="w-full h-full border-0"
                        sandbox="allow-scripts allow-same-origin allow-presentation allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals"
                        allow="autoplay *; encrypted-media *; fullscreen *; picture-in-picture *; accelerometer *; gyroscope *; magnetometer *; camera *; microphone *; geolocation *"
                        referrerPolicy="no-referrer"
                        title={title}
                        style={{
                          pointerEvents: 'auto',
                          isolation: 'isolate',
                          border: 'none',
                          outline: 'none'
                        }}
                        onLoad={() => {
                          console.log('Iframe bypass carregado');
                          // Tentar injetar scripts para bypass
                          try {
                            const iframe = document.querySelector('iframe');
                            if (iframe && iframe.contentWindow) {
                              // Tentar comunicação via postMessage
                              iframe.contentWindow.postMessage({
                                action: 'bypass-protection',
                                origin: window.location.origin
                              }, '*');
                              
                              // Tentar remover proteções comuns
                              setTimeout(() => {
                                iframe.contentWindow.postMessage({
                                  action: 'remove-overlays'
                                }, '*');
                              }, 2000);
                            }
                          } catch (e) {
                            console.log('Não foi possível comunicar com iframe:', e);
                          }
                        }}
                      />
                      
                      {/* Overlay para capturar cliques e tentar bypass */}
                      <div 
                        className="absolute inset-0 pointer-events-none"
                        style={{ zIndex: -1 }}
                        onClick={(e) => {
                          e.preventDefault();
                          // Tentar focar no iframe
                          const iframe = document.querySelector('iframe');
                          if (iframe) {
                            iframe.focus();
                          }
                        }}
                      />
                    </div>
                  ) : (
                    // Player de vídeo nativo
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
                  )}
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
                    onClick={() => {
                      // Tentar iframe com bypass para iOS
                      setShowNativePlayer(true);
                      setStreamUrl('iframe-bypass');
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 text-lg"
                  >
                    🔓 Player com Bypass iOS
                  </Button>
                  
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
                
                <div className="bg-purple-900/30 border border-purple-600/50 rounded-lg p-4 mt-6">
                  <p className="text-purple-200 text-sm">
                    🔓 <strong>Novo:</strong> Player com Bypass iOS usa técnicas avançadas para contornar proteções!
                  </p>
                </div>
                
                <div className="bg-blue-900/30 border border-blue-600/50 rounded-lg p-4 mt-2">
                  <p className="text-blue-200 text-sm">
                    💡 Player Nativo iOS tenta extrair streams diretos usando múltiplos métodos.
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
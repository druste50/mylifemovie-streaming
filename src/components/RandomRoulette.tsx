import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, Play, X, Film, Tv } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { tmdbService } from '@/services/tmdbService';
import type { Movie } from '@/types/movie';

interface RandomRouletteProps {
  onPlayMovie: (item: Movie) => void;
}

export function RandomRoulette({ onPlayMovie }: RandomRouletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Movie | null>(null);
  const [contentType, setContentType] = useState<'movies' | 'tv'>('movies');
  const [rouletteItems, setRouletteItems] = useState<Movie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Buscar itens aleatórios para a roleta
  const fetchRandomItems = async (type: 'movies' | 'tv') => {
    try {
      const randomPage = Math.floor(Math.random() * 10) + 1;
      let response;
      
      if (type === 'movies') {
        response = await tmdbService.getPopularMoviesPage(randomPage);
      } else {
        response = await tmdbService.getPopularTVShowsPage(randomPage);
      }
      
      const shuffled = response.results.sort(() => Math.random() - 0.5);
      setRouletteItems(shuffled.slice(0, 12)); // 12 itens para a roleta
    } catch (error) {
      console.error('Erro ao buscar itens aleatórios:', error);
      setRouletteItems([]); // Garantir que seja um array vazio em caso de erro
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRandomItems(contentType);
    }
  }, [isOpen, contentType]);

  const spinRoulette = () => {
    if (rouletteItems.length === 0) return;
    
    setIsSpinning(true);
    setSelectedItem(null);
    
    // Simular giro da roleta
    let spins = 0;
    const maxSpins = 20 + Math.floor(Math.random() * 20); // 20-40 giros
    
    const spinInterval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % rouletteItems.length);
      spins++;
      
      if (spins >= maxSpins) {
        clearInterval(spinInterval);
        setIsSpinning(false);
        setSelectedItem(rouletteItems[currentIndex]);
      }
    }, 100 + (spins * 5)); // Velocidade diminui gradualmente
  };

  const handlePlay = () => {
    if (selectedItem) {
      onPlayMovie(selectedItem);
      setIsOpen(false);
      setSelectedItem(null);
    }
  };

  return (
    <>
      {/* Botão flutuante */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300"
          size="icon"
        >
          <Shuffle className="h-8 w-8 text-white" />
        </Button>
      </motion.div>

      {/* Modal da Roleta */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-700 shadow-2xl"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Shuffle className="h-6 w-6 text-purple-400" />
                  Roleta da Sorte
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Seletor de tipo */}
              <div className="flex gap-2 mb-6">
                <Button
                  variant={contentType === 'movies' ? 'default' : 'outline'}
                  onClick={() => setContentType('movies')}
                  className="flex-1 flex items-center gap-2"
                  disabled={isSpinning}
                >
                  <Film className="h-4 w-4" />
                  Filmes
                </Button>
                <Button
                  variant={contentType === 'tv' ? 'default' : 'outline'}
                  onClick={() => setContentType('tv')}
                  className="flex-1 flex items-center gap-2"
                  disabled={isSpinning}
                >
                  <Tv className="h-4 w-4" />
                  Séries
                </Button>
              </div>

              {/* Roleta */}
              <div className="relative mb-6">
                <div className="w-64 h-64 mx-auto relative overflow-hidden rounded-full border-4 border-purple-500 bg-gray-800">
                  {/* Indicador */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-purple-500"></div>
                  </div>
                  
                  {/* Itens da roleta */}
                  <motion.div
                    className="w-full h-full relative"
                    animate={{
                      rotate: isSpinning ? currentIndex * (360 / rouletteItems.length) : 0
                    }}
                    transition={{
                      duration: isSpinning ? 0.1 : 0.5,
                      ease: isSpinning ? 'linear' : 'easeOut'
                    }}
                  >
                    {rouletteItems.map((item, index) => {
                      const angle = (360 / rouletteItems.length) * index;
                      const isSelected = !isSpinning && index === currentIndex;
                      
                      return (
                        <div
                          key={item.id}
                          className={`absolute w-full h-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                            isSelected ? 'text-yellow-400 scale-110' : 'text-white'
                          }`}
                          style={{
                            transform: `rotate(${angle}deg)`,
                            transformOrigin: 'center'
                          }}
                        >
                          <div
                            className="absolute top-4 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-lg bg-cover bg-center border-2 border-gray-600"
                            style={{
                              backgroundImage: `url(https://image.tmdb.org/t/p/w200${item.poster_path})`,
                              transform: `rotate(-${angle}deg)`
                            }}
                          />
                        </div>
                      );
                    })}
                  </motion.div>
                </div>
              </div>

              {/* Resultado */}
              {selectedItem && (
                <motion.div
                  className="text-center mb-6 p-4 bg-gray-800 rounded-lg border border-purple-500"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <img
                    src={`https://image.tmdb.org/t/p/w200${selectedItem.poster_path}`}
                    alt={selectedItem.title || selectedItem.name}
                    className="w-20 h-30 mx-auto rounded-lg mb-3 object-cover"
                  />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {selectedItem.title || selectedItem.name}
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    ⭐ {selectedItem.vote_average.toFixed(1)}
                  </p>
                </motion.div>
              )}

              {/* Botões */}
              <div className="flex gap-3">
                <Button
                  onClick={spinRoulette}
                  disabled={isSpinning || rouletteItems.length === 0}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isSpinning ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Shuffle className="h-4 w-4 mr-2" />
                    </motion.div>
                  ) : (
                    <Shuffle className="h-4 w-4 mr-2" />
                  )}
                  {isSpinning ? 'Girando...' : 'Girar Roleta'}
                </Button>
                
                {selectedItem && (
                  <Button
                    onClick={handlePlay}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Assistir
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
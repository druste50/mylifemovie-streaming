import { useState, useEffect } from 'react';
import { Movie, TVShow, MovieDetails, TVShowDetails } from '@/types/movie';
import { tmdbService } from '@/services/tmdbService';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { CategorySectionInfinite } from '@/components/CategorySectionInfinite';
import { GenreSection } from '@/components/GenreSection';
import { MoviePlayer } from '@/components/MoviePlayer';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [heroMovie, setHeroMovie] = useState<Movie | null>(null);
  const [searchResults, setSearchResults] = useState<(Movie | TVShow)[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState('home');
  const [selectedContent, setSelectedContent] = useState<{
    item: Movie | TVShow;
    imdbId: string;
    type: 'movie' | 'series';
  } | null>(null);
  
  const { toast } = useToast();

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      console.log('🚀 Buscando filme hero...');
      
      // Buscar apenas alguns filmes em alta para o hero
      const trendingRes = await tmdbService.getTrendingMoviesPage(1);
      const filteredTrending = await tmdbService.filterAvailableMovies(trendingRes.results);

      // Definir filme hero (primeiro filme em alta disponível)
      if (filteredTrending.length > 0) {
        setHeroMovie(filteredTrending[0]);
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro ao carregar conteúdo",
        description: "Não foi possível carregar os filmes e séries. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Buscar conteúdo
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      const results = await tmdbService.searchMulti(query);
      
      // Filtrar apenas filmes e séries
      const filteredResults = results.results.filter(
        (item: any) => item.media_type === 'movie' || item.media_type === 'tv'
      );
      
      // Filtrar apenas conteúdo disponível no WarezCDN
      console.log(`Filtrando ${filteredResults.length} resultados de busca...`);
      const availableResults = await tmdbService.filterAvailableContent(filteredResults);
      
      setSearchResults(availableResults);
      
      if (availableResults.length === 0) {
        toast({
          title: "Nenhum resultado disponível",
          description: `Encontramos resultados para "${query}", mas nenhum está disponível para streaming no momento.`,
        });
      } else {
        console.log(`${availableResults.length} resultados disponíveis de ${filteredResults.length} encontrados`);
      }
    } catch (error) {
      console.error('Erro na busca:', error);
      toast({
        title: "Erro na busca",
        description: "Não foi possível realizar a busca. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Obter IMDB ID e reproduzir conteúdo
  const handlePlayContent = async (item: Movie | TVShow) => {
    try {
      const isMovie = 'title' in item;
      let imdbId: string;

      if (isMovie) {
        const externalIds = await tmdbService.getMovieExternalIds(item.id);
        imdbId = externalIds.imdb_id;
      } else {
        const externalIds = await tmdbService.getTVExternalIds(item.id);
        imdbId = externalIds.imdb_id;
      }

      if (!imdbId) {
        toast({
          title: "Conteúdo indisponível",
          description: "Este conteúdo não está disponível para reprodução no momento.",
          variant: "destructive"
        });
        return;
      }

      setSelectedContent({
        item,
        imdbId,
        type: isMovie ? 'movie' : 'series'
      });

    } catch (error) {
      console.error('Erro ao obter IMDB ID:', error);
      toast({
        title: "Erro ao carregar conteúdo",
        description: "Não foi possível carregar este conteúdo. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleClosePlayer = () => {
    setSelectedContent(null);
  };

  const handleNavigation = (section: string) => {
    setCurrentSection(section);
    setIsSearching(false);
    setSearchResults([]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onSearch={handleSearch}
        onNavigate={handleNavigation}
        currentSection={currentSection}
      />
      
      {/* Espaçamento para o header fixo */}
      <div className="pt-16">
        {/* Hero Section - apenas na home */}
        {currentSection === 'home' && !isSearching && heroMovie && (
          <HeroSection
            movie={heroMovie}
            onPlay={() => handlePlayContent(heroMovie)}
            onInfo={() => handlePlayContent(heroMovie)}
          />
        )}

        {/* Resultados da busca */}
        {isSearching && (
          <div className="container mx-auto px-4 py-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              Resultados da Busca
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {searchResults.map((item) => (
                <div key={item.id} className="animate-fade-in-up">
                  <div 
                    className="cursor-pointer"
                    onClick={() => handlePlayContent(item)}
                  >
                    <img
                      src={tmdbService.getPosterUrl(item.poster_path)}
                      alt={'title' in item ? item.title : item.name}
                      className="w-full aspect-[2/3] object-cover rounded-lg hover:scale-105 transition-transform"
                    />
                    <h3 className="text-white font-medium text-sm mt-2 line-clamp-2">
                      {'title' in item ? item.title : item.name}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Seção de Filmes por Gênero */}
        {currentSection === 'movies' && !isSearching && (
          <GenreSection
            type="movie"
            onItemClick={handlePlayContent}
          />
        )}

        {/* Seção de Séries por Gênero */}
        {currentSection === 'series' && !isSearching && (
          <GenreSection
            type="tv"
            onItemClick={handlePlayContent}
          />
        )}

        {/* Home - Seções de conteúdo */}
        {currentSection === 'home' && !isSearching && (
          <>
            <CategorySectionInfinite
              title="🔥 Em Alta Hoje"
              type="trending-movies"
              onItemClick={handlePlayContent}
            />

            <CategorySectionInfinite
              title="🎬 Filmes Populares"
              type="popular-movies"
              onItemClick={handlePlayContent}
            />

            <CategorySectionInfinite
              title="⭐ Mais Bem Avaliados"
              type="top-rated-movies"
              onItemClick={handlePlayContent}
            />

            <CategorySectionInfinite
              title="📺 Séries Populares"
              type="popular-tv"
              onItemClick={handlePlayContent}
            />

            <CategorySectionInfinite
              title="🚀 Séries em Alta"
              type="trending-tv"
              onItemClick={handlePlayContent}
            />
          </>
        )}
      </div>

      {/* Player */}
      {selectedContent && (
        <MoviePlayer
          imdbId={selectedContent.imdbId}
          title={'title' in selectedContent.item ? selectedContent.item.title : selectedContent.item.name}
          type={selectedContent.type}
          onClose={handleClosePlayer}
        />
      )}
    </div>
  );
};

export default Index;
import { useState, useEffect } from 'react';
import { Movie, TVShow, MovieDetails, TVShowDetails } from '@/types/movie';
import { tmdbService } from '@/services/tmdbService';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { CategorySection } from '@/components/CategorySection';
import { GenreSection } from '@/components/GenreSection';
import { MoviePlayer } from '@/components/MoviePlayer';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [heroMovie, setHeroMovie] = useState<Movie | null>(null);
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [popularSeries, setPopularSeries] = useState<TVShow[]>([]);
  const [trendingSeries, setTrendingSeries] = useState<TVShow[]>([]);
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
      
      console.log('🚀 Buscando conteúdo do TMDB (múltiplas páginas)...');
      
      const [
        trendingMoviesRes,
        popularMoviesRes,
        topRatedMoviesRes,
        popularSeriesRes,
        trendingSeriesRes
      ] = await Promise.all([
        tmdbService.getTrendingMovies(3), // 3 páginas = ~60 filmes
        tmdbService.getPopularMovies(3),  // 3 páginas = ~60 filmes
        tmdbService.getTopRatedMovies(3), // 3 páginas = ~60 filmes
        tmdbService.getPopularTVShows(3), // 3 páginas = ~60 séries
        tmdbService.getTrendingTVShows(3) // 3 páginas = ~60 séries
      ]);

      console.log('📊 Total buscado do TMDB:', {
        trendingMovies: trendingMoviesRes.results.length,
        popularMovies: popularMoviesRes.results.length,
        topRatedMovies: topRatedMoviesRes.results.length,
        popularSeries: popularSeriesRes.results.length,
        trendingSeries: trendingSeriesRes.results.length
      });

      // Filtrar apenas conteúdo disponível no WarezCDN
      console.log('🔍 Filtrando conteúdo disponível no WarezCDN...');
      
      const [
        filteredTrendingMovies,
        filteredPopularMovies,
        filteredTopRatedMovies,
        filteredPopularSeries,
        filteredTrendingSeries
      ] = await Promise.all([
        tmdbService.filterAvailableMovies(trendingMoviesRes.results),
        tmdbService.filterAvailableMovies(popularMoviesRes.results),
        tmdbService.filterAvailableMovies(topRatedMoviesRes.results),
        tmdbService.filterAvailableTVShows(popularSeriesRes.results),
        tmdbService.filterAvailableTVShows(trendingSeriesRes.results)
      ]);

      setTrendingMovies(filteredTrendingMovies);
      setPopularMovies(filteredPopularMovies);
      setTopRatedMovies(filteredTopRatedMovies);
      setPopularSeries(filteredPopularSeries);
      setTrendingSeries(filteredTrendingSeries);
      
      // Definir filme hero (primeiro dos trending disponíveis)
      if (filteredTrendingMovies.length > 0) {
        setHeroMovie(filteredTrendingMovies[0]);
      }
      
      console.log('✅ Filtragem concluída - Conteúdo disponível:', {
        trendingMovies: `${filteredTrendingMovies.length}/${trendingMoviesRes.results.length}`,
        popularMovies: `${filteredPopularMovies.length}/${popularMoviesRes.results.length}`,
        topRatedMovies: `${filteredTopRatedMovies.length}/${topRatedMoviesRes.results.length}`,
        popularSeries: `${filteredPopularSeries.length}/${popularSeriesRes.results.length}`,
        trendingSeries: `${filteredTrendingSeries.length}/${trendingSeriesRes.results.length}`
      });
      
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
            <CategorySection
              title="🔥 Em Alta Hoje"
              items={trendingMovies}
              onItemClick={handlePlayContent}
              loading={loading}
            />

            <CategorySection
              title="🎬 Filmes Populares"
              items={popularMovies}
              onItemClick={handlePlayContent}
              loading={loading}
            />

            <CategorySection
              title="⭐ Mais Bem Avaliados"
              items={topRatedMovies}
              onItemClick={handlePlayContent}
              loading={loading}
            />

            <CategorySection
              title="📺 Séries Populares"
              items={popularSeries}
              onItemClick={handlePlayContent}
              loading={loading}
            />

            <CategorySection
              title="🚀 Séries em Alta"
              items={trendingSeries}
              onItemClick={handlePlayContent}
              loading={loading}
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
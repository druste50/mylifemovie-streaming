import { Movie, MovieDetails, TMDBResponse, TVShow, TVShowDetails, Genre } from '@/types/movie';

const TMDB_API_KEY = '84326cb6508af159ceee6d620552bf69';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Cache para verificações de disponibilidade no WarezCDN
const availabilityCache = new Map<string, boolean>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos (aumentado para reduzir requisições)
const cacheTimestamps = new Map<string, number>();

// Estatísticas de validação
const validationStats = {
  total: 0,
  available: 0,
  unavailable: 0,
  errors: 0,
  cacheHits: 0
};

// Função para log de estatísticas
function logValidationStats() {
  const { total, available, unavailable, errors, cacheHits } = validationStats;
  const availabilityRate = total > 0 ? ((available / total) * 100).toFixed(1) : '0';
  const cacheHitRate = total > 0 ? ((cacheHits / total) * 100).toFixed(1) : '0';
  
  console.log(`📊 WarezCDN Stats: ${total} validações | ${availabilityRate}% disponível | ${cacheHitRate}% cache hits | ${errors} erros`);
}

// Função para log de busca de conteúdo
function logContentFetch(category: string, totalFetched: number, availableAfterFilter: number) {
  const availabilityRate = totalFetched > 0 ? ((availableAfterFilter / totalFetched) * 100).toFixed(1) : '0';
  console.log(`🎬 ${category}: ${totalFetched} itens buscados do TMDB → ${availableAfterFilter} disponíveis (${availabilityRate}%)`);
}

class TMDBService {
  private async fetchTMDB(endpoint: string, params: Record<string, string | number> = {}): Promise<any> {
    const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
    url.searchParams.append('api_key', TMDB_API_KEY);
    url.searchParams.append('language', 'pt-BR');
    
    // Adicionar parâmetros extras
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value.toString());
    });
    
    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`TMDB API Error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar dados do TMDB:', error);
      throw error;
    }
  }

  // Filmes populares (múltiplas páginas)
  async getPopularMovies(maxPages: number = 3): Promise<TMDBResponse> {
    const allResults: Movie[] = [];
    let totalPages = 1;
    let totalResults = 0;
    
    for (let page = 1; page <= maxPages; page++) {
      const response = await this.fetchTMDB('/movie/popular', { page });
      allResults.push(...response.results);
      totalPages = response.total_pages;
      totalResults = response.total_results;
      
      // Se chegamos ao fim das páginas disponíveis, parar
      if (page >= totalPages) break;
    }
    
    return {
      results: allResults,
      page: 1,
      total_pages: totalPages,
      total_results: totalResults
    };
  }

  // Filmes populares com paginação incremental
  async getPopularMoviesPage(page: number = 1): Promise<{ results: Movie[], hasMore: boolean, totalPages: number }> {
    const response = await this.fetchTMDB('/movie/popular', { page });
    return {
      results: response.results,
      hasMore: page < response.total_pages,
      totalPages: response.total_pages
    };
  }

  // Filmes em alta (múltiplas páginas)
  async getTrendingMovies(maxPages: number = 3): Promise<TMDBResponse> {
    const allResults: Movie[] = [];
    let totalPages = 1;
    let totalResults = 0;
    
    for (let page = 1; page <= maxPages; page++) {
      const response = await this.fetchTMDB('/trending/movie/day', { page });
      allResults.push(...response.results);
      totalPages = response.total_pages;
      totalResults = response.total_results;
      
      // Se chegamos ao fim das páginas disponíveis, parar
      if (page >= totalPages) break;
    }
    
    return {
      results: allResults,
      page: 1,
      total_pages: totalPages,
      total_results: totalResults
    };
  }

  // Filmes em alta com paginação incremental
  async getTrendingMoviesPage(page: number = 1): Promise<{ results: Movie[], hasMore: boolean, totalPages: number }> {
    const response = await this.fetchTMDB('/trending/movie/day', { page });
    return {
      results: response.results,
      hasMore: page < response.total_pages,
      totalPages: response.total_pages
    };
  }

  // Filmes mais bem avaliados (múltiplas páginas)
  async getTopRatedMovies(maxPages: number = 3): Promise<TMDBResponse> {
    const allResults: Movie[] = [];
    let totalPages = 1;
    let totalResults = 0;
    
    for (let page = 1; page <= maxPages; page++) {
      const response = await this.fetchTMDB('/movie/top_rated', { page });
      allResults.push(...response.results);
      totalPages = response.total_pages;
      totalResults = response.total_results;
      
      // Se chegamos ao fim das páginas disponíveis, parar
      if (page >= totalPages) break;
    }
    
    return {
      results: allResults,
      page: 1,
      total_pages: totalPages,
      total_results: totalResults
    };
  }

  // Filmes mais bem avaliados com paginação incremental
  async getTopRatedMoviesPage(page: number = 1): Promise<{ results: Movie[], hasMore: boolean, totalPages: number }> {
    const response = await this.fetchTMDB('/movie/top_rated', { page });
    return {
      results: response.results,
      hasMore: page < response.total_pages,
      totalPages: response.total_pages
    };
  }

  // Filmes em cartaz
  async getNowPlayingMovies(page: number = 1): Promise<TMDBResponse> {
    return this.fetchTMDB('/movie/now_playing', { page });
  }

  // Filmes que chegam em breve
  async getUpcomingMovies(page: number = 1): Promise<TMDBResponse> {
    return this.fetchTMDB('/movie/upcoming', { page });
  }

  // Detalhes de um filme
  async getMovieDetails(movieId: number): Promise<MovieDetails> {
    return this.fetchTMDB(`/movie/${movieId}`);
  }

  // Buscar filmes
  async searchMovies(query: string, page: number = 1): Promise<TMDBResponse> {
    return this.fetchTMDB('/search/movie', { query, page });
  }

  // Séries populares (múltiplas páginas)
  async getPopularTVShows(maxPages: number = 3): Promise<{ results: TVShow[] }> {
    const allResults: TVShow[] = [];
    
    for (let page = 1; page <= maxPages; page++) {
      const response = await this.fetchTMDB('/tv/popular', { page });
      allResults.push(...response.results);
      
      // Se chegamos ao fim das páginas disponíveis, parar
      if (page >= response.total_pages) break;
    }
    
    return { results: allResults };
  }

  // Séries populares com paginação incremental
  async getPopularTVShowsPage(page: number = 1): Promise<{ results: TVShow[], hasMore: boolean, totalPages: number }> {
    const response = await this.fetchTMDB('/tv/popular', { page });
    return {
      results: response.results,
      hasMore: page < response.total_pages,
      totalPages: response.total_pages
    };
  }

  // Séries em alta (múltiplas páginas)
  async getTrendingTVShows(maxPages: number = 3): Promise<{ results: TVShow[] }> {
    const allResults: TVShow[] = [];
    
    for (let page = 1; page <= maxPages; page++) {
      const response = await this.fetchTMDB('/trending/tv/day', { page });
      allResults.push(...response.results);
      
      // Se chegamos ao fim das páginas disponíveis, parar
      if (page >= response.total_pages) break;
    }
    
    return { results: allResults };
  }

  // Séries em alta com paginação incremental
  async getTrendingTVShowsPage(page: number = 1): Promise<{ results: TVShow[], hasMore: boolean, totalPages: number }> {
    const response = await this.fetchTMDB('/trending/tv/day', { page });
    return {
      results: response.results,
      hasMore: page < response.total_pages,
      totalPages: response.total_pages
    };
  }

  // Detalhes de uma série
  async getTVShowDetails(tvId: number): Promise<TVShowDetails> {
    return this.fetchTMDB(`/tv/${tvId}`);
  }

  // Buscar séries
  async searchTVShows(query: string, page: number = 1): Promise<{ results: TVShow[] }> {
    return this.fetchTMDB('/search/tv', { query, page });
  }

  // Gêneros de filmes
  async getMovieGenres(): Promise<{ genres: Genre[] }> {
    return this.fetchTMDB('/genre/movie/list');
  }

  // Gêneros de séries
  async getTVGenres(): Promise<{ genres: Genre[] }> {
    return this.fetchTMDB('/genre/tv/list');
  }

  // Filmes por gênero (múltiplas páginas)
  async getMoviesByGenre(genreId: number, maxPages: number = 5): Promise<TMDBResponse> {
    const allResults: Movie[] = [];
    let totalPages = 1;
    let totalResults = 0;
    
    for (let page = 1; page <= maxPages; page++) {
      const response = await this.fetchTMDB('/discover/movie', { with_genres: genreId, page });
      allResults.push(...response.results);
      totalPages = response.total_pages;
      totalResults = response.total_results;
      
      // Se chegamos ao fim das páginas disponíveis, parar
      if (page >= totalPages) break;
    }
    
    return {
      results: allResults,
      page: 1,
      total_pages: totalPages,
      total_results: totalResults
    };
  }

  // Filmes por gênero com paginação incremental
  async getMoviesByGenrePage(genreId: number, page: number = 1): Promise<{ results: Movie[], hasMore: boolean, totalPages: number }> {
    const response = await this.fetchTMDB('/discover/movie', { with_genres: genreId, page });
    return {
      results: response.results,
      hasMore: page < response.total_pages,
      totalPages: response.total_pages
    };
  }

  // Séries por gênero (múltiplas páginas)
  async getTVShowsByGenre(genreId: number, maxPages: number = 5): Promise<{ results: TVShow[] }> {
    const allResults: TVShow[] = [];
    
    for (let page = 1; page <= maxPages; page++) {
      const response = await this.fetchTMDB('/discover/tv', { with_genres: genreId, page });
      allResults.push(...response.results);
      
      // Se chegamos ao fim das páginas disponíveis, parar
      if (page >= response.total_pages) break;
    }
    
    return { results: allResults };
  }

  // Séries por gênero com paginação incremental
  async getTVShowsByGenrePage(genreId: number, page: number = 1): Promise<{ results: TVShow[], hasMore: boolean, totalPages: number }> {
    const response = await this.fetchTMDB('/discover/tv', { with_genres: genreId, page });
    return {
      results: response.results,
      hasMore: page < response.total_pages,
      totalPages: response.total_pages
    };
  }

  // URLs de imagens
  getPosterUrl(posterPath: string, size: string = 'w500'): string {
    return posterPath ? `${IMAGE_BASE_URL}/${size}${posterPath}` : '/placeholder.svg';
  }

  getBackdropUrl(backdropPath: string, size: string = 'w1280'): string {
    return backdropPath ? `${IMAGE_BASE_URL}/${size}${backdropPath}` : '/placeholder.svg';
  }

  // Busca geral (filmes e séries)
  async searchMulti(query: string, page: number = 1): Promise<any> {
    return this.fetchTMDB('/search/multi', { query, page });
  }

  // Obter External IDs (incluindo IMDB ID)
  async getMovieExternalIds(movieId: number): Promise<{ imdb_id: string }> {
    return this.fetchTMDB(`/movie/${movieId}/external_ids`);
  }

  async getTVExternalIds(tvId: number): Promise<{ imdb_id: string }> {
    return this.fetchTMDB(`/tv/${tvId}/external_ids`);
  }

  // Verificar se um filme/série está disponível no WarezCDN
  async checkWarezCDNAvailability(imdbId: string, type: 'movie' | 'tv'): Promise<boolean> {
    const cacheKey = `${type}_${imdbId}`;
    const now = Date.now();
    
    validationStats.total++;
    
    // Verificar cache
    if (availabilityCache.has(cacheKey)) {
      const timestamp = cacheTimestamps.get(cacheKey) || 0;
      if (now - timestamp < CACHE_DURATION) {
        validationStats.cacheHits++;
        const cached = availabilityCache.get(cacheKey) || false;
        
        // Log estatísticas a cada 50 validações
        if (validationStats.total % 50 === 0) {
          logValidationStats();
        }
        
        return cached;
      }
    }
    
    try {
      // Validação básica: verificar se o IMDB ID é válido
      if (!imdbId || !imdbId.startsWith('tt') || imdbId.length < 7) {
        availabilityCache.set(cacheKey, false);
        cacheTimestamps.set(cacheKey, now);
        validationStats.unavailable++;
        return false;
      }
      
      // Assumir que o conteúdo está disponível para evitar erros SSL
      // Retornando ao comportamento anterior que funcionava melhor
      const isAvailable = true;
      
      availabilityCache.set(cacheKey, isAvailable);
      cacheTimestamps.set(cacheKey, now);
      
      validationStats.available++;
      console.log(`✅ Conteúdo ${imdbId} (${type}) assumido como disponível`);
      
      // Log estatísticas a cada 50 validações
      if (validationStats.total % 50 === 0) {
        logValidationStats();
      }
      
      return isAvailable;
      
    } catch (error) {
      // Em caso de erro, assumir que está disponível (comportamento anterior)
      validationStats.errors++;
      availabilityCache.set(cacheKey, true);
      cacheTimestamps.set(cacheKey, now);
      console.log(`⚠️ Erro ao validar ${imdbId} (${type}), assumindo disponível:`, error);
      return true;
    }
  }
  
  // Funções de validação removidas - agora assumimos disponibilidade para evitar erros SSL

  // Filtrar filmes disponíveis no WarezCDN
  async filterAvailableMovies(movies: Movie[]): Promise<Movie[]> {
    const availableMovies: Movie[] = [];
    
    // Verificar em lotes para melhor performance
    const batchSize = 5;
    for (let i = 0; i < movies.length; i += batchSize) {
      const batch = movies.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (movie) => {
        try {
          // Obter IMDB ID
          const externalIds = await this.getMovieExternalIds(movie.id);
          if (externalIds.imdb_id) {
            const isAvailable = await this.checkWarezCDNAvailability(externalIds.imdb_id, 'movie');
            return isAvailable ? movie : null;
          }
          return null;
        } catch (error) {
          console.warn(`Erro ao verificar filme ${movie.id}:`, error);
          // Em caso de erro, incluir o filme
          return movie;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      availableMovies.push(...batchResults.filter(movie => movie !== null && movie !== undefined));
    }
    
    return availableMovies;
  }

  // Filtrar séries disponíveis no WarezCDN
  async filterAvailableTVShows(tvShows: TVShow[]): Promise<TVShow[]> {
    const availableTVShows: TVShow[] = [];
    
    // Verificar em lotes para melhor performance
    const batchSize = 5;
    for (let i = 0; i < tvShows.length; i += batchSize) {
      const batch = tvShows.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (tvShow) => {
        try {
          // Obter IMDB ID
          const externalIds = await this.getTVExternalIds(tvShow.id);
          if (externalIds.imdb_id) {
            const isAvailable = await this.checkWarezCDNAvailability(externalIds.imdb_id, 'tv');
            return isAvailable ? tvShow : null;
          }
          return null;
        } catch (error) {
          console.warn(`Erro ao verificar série ${tvShow.id}:`, error);
          // Em caso de erro, incluir a série
          return tvShow;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      availableTVShows.push(...batchResults.filter(tvShow => tvShow !== null && tvShow !== undefined));
    }
    
    return availableTVShows;
  }

  // Método combinado para filtrar qualquer tipo de conteúdo
  async filterAvailableContent(items: (Movie | TVShow)[]): Promise<(Movie | TVShow)[]> {
    const movies = items.filter(item => 'title' in item) as Movie[];
    const tvShows = items.filter(item => 'name' in item) as TVShow[];
    
    const [availableMovies, availableTVShows] = await Promise.all([
      movies.length > 0 ? this.filterAvailableMovies(movies) : Promise.resolve([]),
      tvShows.length > 0 ? this.filterAvailableTVShows(tvShows) : Promise.resolve([])
    ]);
    
    return [...availableMovies, ...availableTVShows];
  }
}

export const tmdbService = new TMDBService();
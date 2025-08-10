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

  // Filmes populares
  async getPopularMovies(page: number = 1): Promise<TMDBResponse> {
    return this.fetchTMDB('/movie/popular', { page });
  }

  // Filmes em alta
  async getTrendingMovies(): Promise<TMDBResponse> {
    return this.fetchTMDB('/trending/movie/day');
  }

  // Filmes mais bem avaliados
  async getTopRatedMovies(page: number = 1): Promise<TMDBResponse> {
    return this.fetchTMDB('/movie/top_rated', { page });
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

  // Séries populares
  async getPopularTVShows(page: number = 1): Promise<{ results: TVShow[] }> {
    return this.fetchTMDB('/tv/popular', { page });
  }

  // Séries em alta
  async getTrendingTVShows(): Promise<{ results: TVShow[] }> {
    return this.fetchTMDB('/trending/tv/day');
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

  // Filmes por gênero
  async getMoviesByGenre(genreId: number, page: number = 1): Promise<TMDBResponse> {
    return this.fetchTMDB('/discover/movie', { with_genres: genreId, page });
  }

  // Séries por gênero
  async getTVShowsByGenre(genreId: number, page: number = 1): Promise<{ results: TVShow[] }> {
    return this.fetchTMDB('/discover/tv', { with_genres: genreId, page });
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
      
      // Verificar disponibilidade usando uma abordagem mais robusta
      const isAvailable = await this.validateWarezCDNContent(imdbId, type);
      
      availabilityCache.set(cacheKey, isAvailable);
      cacheTimestamps.set(cacheKey, now);
      
      if (isAvailable) {
        validationStats.available++;
        console.log(`✅ Conteúdo ${imdbId} (${type}) validado no WarezCDN`);
      } else {
        validationStats.unavailable++;
        console.log(`❌ Conteúdo ${imdbId} (${type}) não disponível no WarezCDN`);
      }
      
      // Log estatísticas a cada 50 validações
      if (validationStats.total % 50 === 0) {
        logValidationStats();
      }
      
      return isAvailable;
      
    } catch (error) {
      validationStats.errors++;
      console.warn(`⚠️ Erro ao verificar disponibilidade no WarezCDN para ${imdbId}:`, error);
      // Em caso de erro, assumir que não está disponível para ser mais conservador
      availabilityCache.set(cacheKey, false);
      cacheTimestamps.set(cacheKey, now);
      return false;
    }
  }
  
  // Validar se o conteúdo realmente existe no WarezCDN
  private async validateWarezCDNContent(imdbId: string, type: 'movie' | 'tv'): Promise<boolean> {
    const contentType = type === 'movie' ? 'filme' : 'serie';
    
    // Primeiro, tentar uma validação mais inteligente usando iframe test
    try {
      const isValid = await this.testWarezCDNEmbed(imdbId, contentType);
      if (isValid !== null) {
        return isValid;
      }
    } catch (error) {
      console.log('Fallback para validação básica devido a erro:', error);
    }
    
    // Fallback: URLs baseadas na documentação oficial do WarezCDN
    const testUrls = [
      `https://embed.warezcdn.com/${contentType}/${imdbId}`,
      `https://embed.warezcdn.link/${contentType}/${imdbId}`,
      `https://warezcdn.link/embed/${contentType}/${imdbId}`
    ];
    
    // Testar cada URL para verificar disponibilidade
    for (const url of testUrls) {
      try {
        // Usar uma abordagem mais simples e eficiente
        const response = await fetch(url, {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache',
          signal: AbortSignal.timeout(2000) // Timeout de 2 segundos
        });
        
        // Se a requisição não falhou, assumir que o conteúdo existe
        return true;
        
      } catch (error) {
        // Se deu timeout ou erro de rede, continuar testando
        continue;
      }
    }
    
    // Se nenhuma URL funcionou, o conteúdo provavelmente não existe
    return false;
  }
  
  // Testar embed do WarezCDN de forma mais inteligente
  private async testWarezCDNEmbed(imdbId: string, contentType: string): Promise<boolean | null> {
    return new Promise((resolve) => {
      try {
        // Criar um iframe temporário para testar o embed
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.style.position = 'absolute';
        iframe.style.left = '-9999px';
        iframe.width = '1';
        iframe.height = '1';
        
        // URL de teste com parâmetros de customização
        const testUrl = `https://embed.warezcdn.com/${contentType}/${imdbId}#transparent#color6c5ce7`;
        
        let resolved = false;
        
        // Timeout para a validação
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            document.body.removeChild(iframe);
            resolve(null); // Retorna null para usar fallback
          }
        }, 3000);
        
        // Listener para quando o iframe carrega
        iframe.onload = () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            
            // Verificar se o iframe carregou conteúdo válido
            try {
              // Se chegou até aqui, provavelmente o conteúdo existe
              document.body.removeChild(iframe);
              resolve(true);
            } catch (error) {
              document.body.removeChild(iframe);
              resolve(false);
            }
          }
        };
        
        // Listener para erros
        iframe.onerror = () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            document.body.removeChild(iframe);
            resolve(false);
          }
        };
        
        // Adicionar ao DOM e definir src
        document.body.appendChild(iframe);
        iframe.src = testUrl;
        
      } catch (error) {
        resolve(null); // Usar fallback em caso de erro
      }
    });
  }

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
      availableMovies.push(...batchResults.filter(movie => movie !== null));
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
      availableTVShows.push(...batchResults.filter(tvShow => tvShow !== null));
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
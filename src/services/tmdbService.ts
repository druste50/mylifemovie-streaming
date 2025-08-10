import { Movie, MovieDetails, TMDBResponse, TVShow, TVShowDetails, Genre } from '@/types/movie';

const TMDB_API_KEY = '84326cb6508af159ceee6d620552bf69';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Cache para verificações de disponibilidade no WarezCDN
const availabilityCache = new Map<string, boolean>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const cacheTimestamps = new Map<string, number>();

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
    
    // Verificar cache
    if (availabilityCache.has(cacheKey)) {
      const timestamp = cacheTimestamps.get(cacheKey) || 0;
      if (now - timestamp < CACHE_DURATION) {
        return availabilityCache.get(cacheKey) || false;
      }
    }
    
    try {
      // URLs do WarezCDN para verificar
      const warezUrls = [
        `https://embed.warezcdn.link/${type === 'movie' ? 'filme' : 'serie'}/${imdbId}`,
        `https://warezcdn.link/${type === 'movie' ? 'filme' : 'serie'}/${imdbId}`,
        `https://embed.warezcdn.com/${type === 'movie' ? 'filme' : 'serie'}/${imdbId}`
      ];
      
      // Tentar verificar disponibilidade
      for (const url of warezUrls) {
        try {
          const response = await fetch(url, {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-cache'
          });
          
          // Se chegou até aqui sem erro, provavelmente existe
          availabilityCache.set(cacheKey, true);
          cacheTimestamps.set(cacheKey, now);
          return true;
        } catch (error) {
          // Continuar tentando outras URLs
          continue;
        }
      }
      
      // Se nenhuma URL funcionou, marcar como indisponível
      availabilityCache.set(cacheKey, false);
      cacheTimestamps.set(cacheKey, now);
      return false;
      
    } catch (error) {
      console.warn(`Erro ao verificar disponibilidade no WarezCDN para ${imdbId}:`, error);
      // Em caso de erro, assumir que está disponível para não bloquear conteúdo
      return true;
    }
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
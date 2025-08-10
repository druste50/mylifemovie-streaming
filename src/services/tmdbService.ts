import { Movie, MovieDetails, TMDBResponse, TVShow, TVShowDetails, Genre } from '@/types/movie';

const TMDB_API_KEY = '84326cb6508af159ceee6d620552bf69';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

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
}

export const tmdbService = new TMDBService();
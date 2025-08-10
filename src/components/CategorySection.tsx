import { Movie, TVShow } from '@/types/movie';
import { MovieCard } from './MovieCard';

interface CategorySectionProps {
  title: string;
  items: (Movie | TVShow)[];
  onItemClick?: (item: Movie | TVShow) => void;
  loading?: boolean;
  showTitle?: boolean;
}

export function CategorySection({ title, items, onItemClick, loading = false, showTitle = true }: CategorySectionProps) {

  if (loading) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          {showTitle && <h2 className="text-2xl font-bold mb-6 text-white">{title}</h2>}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="aspect-[2/3] bg-muted rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        {/* Cabeçalho da seção */}
        {showTitle && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">{title}</h2>
          </div>
        )}

        {/* Grid de filmes/séries */}
        <div className="relative">
          {/* Layout responsivo com múltiplas fileiras */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {items.map((item) => (
              <div key={item.id}>
                <MovieCard
                  item={item}
                  onClick={() => onItemClick?.(item)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
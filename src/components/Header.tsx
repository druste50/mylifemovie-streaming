import { useState } from 'react';
import { Search, Menu, X, Film, Tv, Heart, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  onSearch?: (query: string) => void;
  onMenuToggle?: () => void;
  onNavigate?: (section: string) => void;
  currentSection?: string;
}

export function Header({ onSearch, onMenuToggle, onNavigate, currentSection = 'home' }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim());
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    onMenuToggle?.();
  };

  const navigationItems = [
    { id: 'home', label: 'Início', icon: Film },
    { id: 'movies', label: 'Filmes', icon: Film },
    { id: 'series', label: 'Séries', icon: Tv },
    { id: 'favorites', label: 'Favoritos', icon: Heart },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="gradient-primary p-2 rounded-lg">
                <Film className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">mylifemovie</h1>
              <Badge className="hidden sm:inline-flex gradient-primary border-0 text-white">
                Beta
              </Badge>
            </div>

            {/* Navegação Desktop */}
            <nav className="hidden md:flex items-center gap-6">
              {navigationItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => onNavigate?.(id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    currentSection === id
                      ? 'bg-primary/20 text-primary'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </nav>

            {/* Busca */}
            <form onSubmit={handleSearch} className="flex items-center gap-3">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar filmes e séries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/20"
                />
              </div>

              {/* Botões de ação */}
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/10">
                <User className="w-4 h-4" />
              </Button>

              {/* Menu Mobile */}
              <Button
                size="sm"
                variant="ghost"
                className="md:hidden text-white hover:bg-white/10"
                onClick={toggleMobileMenu}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Menu Mobile */}
      {isMobileMenuOpen && (
        <div className="fixed top-16 left-0 right-0 z-40 glass border-b border-white/10 md:hidden">
          <div className="container mx-auto px-4 py-4">
            {/* Busca Mobile */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar filmes e séries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
              </div>
            </form>

            {/* Navegação Mobile */}
            <nav className="grid grid-cols-2 gap-2">
              {navigationItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => {
                    onNavigate?.(id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 p-3 rounded-lg transition-colors ${
                    currentSection === id
                      ? 'bg-primary/20 text-primary'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
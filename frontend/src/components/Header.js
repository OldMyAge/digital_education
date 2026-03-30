import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, BookOpen, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await axios.get(`${API}/search?q=${encodeURIComponent(query)}`);
      setSearchResults(response.data);
      setSearchOpen(true);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const navigateToLesson = (lessonId) => {
    navigate(`/lesson/${lessonId}`);
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group" data-testid="logo-link">
            <div className="bg-blue-600 p-2 rounded-lg group-hover:bg-blue-700 transition-colors">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-gray-900">Цифрова Освіта</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors" data-testid="nav-home">
              Головна
            </Link>
            <Link to="/news" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors" data-testid="nav-news">
              Новини
            </Link>
            {[5, 6, 7, 8, 9].map((grade) => (
              <Link
                key={grade}
                to={`/class/${grade}`}
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                data-testid={`nav-class-${grade}`}
              >
                {grade} клас
              </Link>
            ))}
            {user && (
              <>
                <Link
                  to="/admin/dashboard"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                  data-testid="nav-admin"
                >
                  Адмін
                </Link>
                <button
                  onClick={logout}
                  className="text-sm font-medium text-gray-700 hover:text-red-600 transition-colors flex items-center gap-1"
                  data-testid="logout-button"
                >
                  <LogOut className="w-4 h-4" />
                  Вийти
                </button>
              </>
            )}
          </nav>

          {/* Search Bar */}
          <div className="hidden md:block relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Пошук уроків..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 w-64"
                data-testid="search-input"
              />
            </div>
            {searchOpen && searchResults.length > 0 && (
              <div className="absolute top-full mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto" data-testid="search-results">
                {searchResults.map((result) => (
                  <button
                    key={result.lesson_id}
                    onClick={() => navigateToLesson(result.lesson_id)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    data-testid={`search-result-${result.lesson_id}`}
                  >
                    <div className="font-medium text-gray-900">{result.lesson_title}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {result.grade} клас • {result.topic_title} • Урок {result.lesson_number}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            data-testid="mobile-menu-button"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100" data-testid="mobile-menu">
            <div className="flex flex-col gap-4">
              <Link to="/" className="text-sm font-medium text-gray-700" onClick={() => setMobileMenuOpen(false)}>
                Головна
              </Link>
              <Link to="/news" className="text-sm font-medium text-gray-700" onClick={() => setMobileMenuOpen(false)}>
                Новини
              </Link>
              {[5, 6, 7, 8, 9].map((grade) => (
                <Link
                  key={grade}
                  to={`/class/${grade}`}
                  className="text-sm font-medium text-gray-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {grade} клас
                </Link>
              ))}
              {user && (
                <>
                  <Link
                    to="/admin/dashboard"
                    className="text-sm font-medium text-gray-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Адмін-панель
                  </Link>
                  <button onClick={logout} className="text-sm font-medium text-red-600 text-left">
                    Вийти
                  </button>
                </>
              )}
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Пошук уроків..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

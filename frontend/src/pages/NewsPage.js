import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Pin, ExternalLink, Filter, ChevronDown, Calendar, Tag } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const convertGoogleDriveUrl = (url) => {
  if (!url) return url;
  let fileId = null;
  const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch && fileIdMatch[1]) fileId = fileIdMatch[1];
  const openIdMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (!fileId && openIdMatch && openIdMatch[1]) fileId = openIdMatch[1];
  if (fileId) return `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`;
  return url;
};

const CATEGORIES = {
  all: { label: 'Усі', color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' },
  news: { label: 'Новини', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  announcement: { label: 'Оголошення', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  achievement: { label: 'Досягнення', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' }
};

export default function NewsPage() {
  const [teacher, setTeacher] = useState(null);
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredPosts(posts);
    } else {
      setFilteredPosts(posts.filter(post => post.category === activeFilter));
    }
  }, [activeFilter, posts]);

  const fetchData = async () => {
    try {
      const [teacherRes, postsRes] = await Promise.all([
        axios.get(`${API}/teacher`),
        axios.get(`${API}/posts`)
      ]);
      setTeacher(teacherRes.data);
      setPosts(postsRes.data);
      setFilteredPosts(postsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-700 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-white"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Новини та оголошення</h1>
            <p className="text-blue-100 max-w-xl mx-auto">
              Останні події, досягнення учнів та важлива інформація
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 mr-2">Фільтр:</span>
            {Object.entries(CATEGORIES).map(([key, value]) => (
              <Button
                key={key}
                variant={activeFilter === key ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(key)}
                className={activeFilter === key ? "" : "hover:bg-gray-100"}
              >
                {value.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Accordion List */}
      <section className="py-8 flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Pin className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {activeFilter === 'all' ? 'Новин поки немає' : `Немає записів у категорії "${CATEGORIES[activeFilter].label}"`}
              </h3>
              <p className="text-gray-500">Слідкуйте за оновленнями!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPosts.map((post, index) => {
                const isExpanded = expandedId === post.id;
                const category = CATEGORIES[post.category] || CATEGORIES.news;
                
                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Header - Always visible */}
                    <button
                      onClick={() => toggleExpand(post.id)}
                      className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors"
                      data-testid={`news-item-${post.id}`}
                    >
                      {/* Category dot */}
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${category.dot}`}></div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${category.color}`}>
                            {category.label}
                          </span>
                          {post.is_pinned && (
                            <Pin className="w-3 h-3 text-blue-600 fill-blue-600" />
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 text-lg truncate pr-4">
                          {post.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(post.created_at).toLocaleDateString('uk-UA', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                      
                      {/* Expand icon */}
                      <ChevronDown 
                        className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                      />
                    </button>

                    {/* Expandable content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 border-t border-gray-100">
                            {/* Image */}
                            {post.image_url && (
                              <div className="mt-4 rounded-lg overflow-hidden">
                                <img
                                  src={convertGoogleDriveUrl(post.image_url)}
                                  alt={post.title}
                                  className="w-full max-h-[500px] object-contain bg-gray-100"
                                />
                              </div>
                            )}
                            
                            {/* Full text */}
                            <div className="mt-4 text-gray-700 leading-relaxed whitespace-pre-wrap">
                              {post.content}
                            </div>
                            
                            {/* Link if exists */}
                            {post.link && (
                              <a
                                href={post.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-700 font-medium"
                              >
                                Перейти за посиланням
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer teacher={teacher} />
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { BookOpen, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function HomePage() {
  const [teacher, setTeacher] = useState(null);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teacherRes, classesRes] = await Promise.all([
        axios.get(`${API}/teacher`),
        axios.get(`${API}/classes`)
      ]);
      setTeacher(teacherRes.data);
      setClasses(classesRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section - Minimal */}
      <section className="relative grain-overlay bg-gradient-to-br from-blue-50 via-white to-amber-50 py-12 overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-40"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 tracking-tight mb-6">
              Цифрова Освіта
            </h1>
            
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Освітній портал для вивчення інформатики в 5-9 класах. 
              Матеріали, уроки та завдання за програмою Н.В. Морзе.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Classes Section - Full Width */}
      <section className="py-16 bg-gradient-to-b from-white to-blue-50 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Оберіть клас</h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Матеріали та уроки за підручником Н.В. Морзе для базової середньої освіти
            </p>
          </div>

          {classes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Завантаження класів...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {classes.map((cls, index) => {
                const colors = [
                  { bg: 'bg-gradient-to-br from-blue-500 to-blue-600', text: 'text-white', icon: 'bg-blue-400' },
                  { bg: 'bg-gradient-to-br from-emerald-500 to-teal-600', text: 'text-white', icon: 'bg-emerald-400' },
                  { bg: 'bg-gradient-to-br from-amber-500 to-orange-600', text: 'text-white', icon: 'bg-amber-400' },
                  { bg: 'bg-gradient-to-br from-rose-500 to-pink-600', text: 'text-white', icon: 'bg-rose-400' },
                  { bg: 'bg-gradient-to-br from-violet-500 to-purple-600', text: 'text-white', icon: 'bg-violet-400' }
                ];
                const color = colors[index % colors.length];
                
                return (
                  <Link key={cls.id} to={`/class/${cls.grade}`} data-testid={`class-card-${cls.grade}`}>
                    <Card className={`p-6 ${color.bg} ${color.text} border-0 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden h-full`}>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="text-5xl font-bold">{cls.grade}</div>
                            <div className="text-sm font-medium uppercase tracking-wider opacity-80">клас</div>
                          </div>
                          <div className={`${color.icon} p-3 rounded-xl group-hover:scale-110 transition-transform`}>
                            <BookOpen className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <p className="text-sm opacity-90 line-clamp-2 mb-3">{cls.description}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="opacity-80">{cls.total_hours} годин</span>
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                        </div>
                      </div>
                    </Card>
                  </Link>
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

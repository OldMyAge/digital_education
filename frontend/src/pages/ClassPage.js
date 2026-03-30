import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookOpen, FileText, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { progressManager } from '@/utils/progressManager';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ClassPage() {
  const { grade } = useParams();
  const [classData, setClassData] = useState(null);
  const [topics, setTopics] = useState([]);
  const [lessonsMap, setLessonsMap] = useState({});

  useEffect(() => {
    fetchClassData();
  }, [grade]);

  const fetchClassData = async () => {
    try {
      const [classRes, topicsRes] = await Promise.all([
        axios.get(`${API}/classes/${grade}`),
        axios.get(`${API}/topics?class_id=`)
      ]);
      
      setClassData(classRes.data);
      
      const classTopics = topicsRes.data.filter(t => {
        return classRes.data.id === t.class_id;
      });
      
      setTopics(classTopics);
      
      const lessonsData = {};
      for (const topic of classTopics) {
        const lessonsRes = await axios.get(`${API}/lessons?topic_id=${topic.id}`);
        lessonsData[topic.id] = lessonsRes.data;
      }
      setLessonsMap(lessonsData);
    } catch (error) {
      console.error('Failed to fetch class data:', error);
    }
  };

  const getTopicColor = (index) => {
    const colors = [
      'border-blue-500 bg-blue-50',
      'border-green-500 bg-green-50',
      'border-amber-500 bg-amber-50',
      'border-red-500 bg-red-50',
      'border-purple-500 bg-purple-50'
    ];
    return colors[index % colors.length];
  };

  const getBadgeColor = (index) => {
    const colors = [
      'bg-blue-600',
      'bg-green-600',
      'bg-amber-600',
      'bg-red-600',
      'bg-purple-600'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {classData && (
        <>
          {/* Class Header */}
          <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-5xl font-bold tracking-tight">Інформатика {grade} клас</h1>
                  </div>
                </div>
                <p className="text-xl text-blue-100 mt-4">{classData.description}</p>
                <div className="flex items-center gap-6 mt-6 text-blue-100">
                  <div>
                    <span className="font-semibold">{classData.total_hours}</span> годин на рік
                  </div>
                  <div>•</div>
                  <div>
                    <span className="font-semibold">{topics.length}</span> тем
                  </div>
                  <div>•</div>
                  <div>Рік: {classData.year}</div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Topics and Lessons */}
          <section className="py-12 bg-gray-50 flex-1">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {topics.length === 0 ? (
                <Card className="p-12 text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Програма в розробці</h3>
                  <p className="text-gray-600">Матеріали для цього класу будуть додані найближчим часом</p>
                </Card>
              ) : (
                <Accordion type="single" collapsible className="space-y-4" data-testid="topics-accordion">
                  {topics.map((topic, index) => (
                    <AccordionItem
                      key={topic.id}
                      value={topic.id}
                      className={`border-2 rounded-lg overflow-hidden ${getTopicColor(index)}`}
                    >
                      <AccordionTrigger
                        className="px-6 py-4 hover:no-underline"
                        data-testid={`topic-trigger-${topic.id}`}
                      >
                        <div className="flex items-start gap-4 text-left w-full">
                          <div className={`${getBadgeColor(index)} text-white px-3 py-1 rounded-lg text-sm font-semibold flex-shrink-0`}>
                            Тема {topic.order}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">{topic.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{topic.lesson_range}</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="px-6 pb-4">
                          {lessonsMap[topic.id] && lessonsMap[topic.id].length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {lessonsMap[topic.id].map((lesson) => (
                                <Link
                                  key={lesson.id}
                                  to={`/lesson/${lesson.id}`}
                                  data-testid={`lesson-card-${lesson.id}`}
                                >
                                  <Card className="p-4 hover:shadow-md hover:-translate-y-1 transition-all duration-200 border border-gray-200 h-full relative">
                                    {progressManager.isLessonCompleted(lesson.id) && (
                                      <div className="absolute top-2 right-2">
                                        <CheckCircle className="w-5 h-5 text-green-600 fill-green-100" />
                                      </div>
                                    )}
                                    <div className="flex items-start gap-3">
                                      <div className={`${getBadgeColor(index)} text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0`}>
                                        {lesson.lesson_number}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-gray-900 text-sm leading-tight mb-1">
                                          {lesson.title}
                                        </h4>
                                        {lesson.page_reference && (
                                          <p className="text-xs text-gray-500">{lesson.page_reference}</p>
                                        )}
                                      </div>
                                    </div>
                                  </Card>
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-center py-4">Уроки будуть додані найближчим часом</p>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </div>
          </section>
        </>
      )}

      <Footer />
    </div>
  );
}

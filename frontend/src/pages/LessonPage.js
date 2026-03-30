import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Youtube, FileText, Presentation, Download, BookOpen, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { progressManager } from '@/utils/progressManager';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function LessonPage() {
  const { lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [topic, setTopic] = useState(null);
  const [classData, setClassData] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    fetchLesson();
    setIsCompleted(progressManager.isLessonCompleted(lessonId));
  }, [lessonId]);

  const fetchLesson = async () => {
    try {
      const lessonRes = await axios.get(`${API}/lessons/${lessonId}`);
      setLesson(lessonRes.data);

      const topicRes = await axios.get(`${API}/topics/${lessonRes.data.topic_id}`);
      setTopic(topicRes.data);

      const classRes = await axios.get(`${API}/classes`);
      const cls = classRes.data.find(c => c.id === topicRes.data.class_id);
      setClassData(cls);
    } catch (error) {
      console.error('Failed to fetch lesson:', error);
    }
  };

  const toggleComplete = () => {
    if (isCompleted) {
      // Скасувати
      progressManager.unmarkLessonCompleted(lessonId);
      setIsCompleted(false);
      toast.info('Урок позначено як невивчений');
    } else {
      // Позначити
      progressManager.markLessonCompleted(lessonId);
      setIsCompleted(true);
      toast.success('Урок позначено як вивчений!');
    }
  };

  const getYouTubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*$/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const convertGoogleDriveUrl = (url) => {
    if (!url) return url;
    
    // Витягуємо FILE_ID з різних форматів Google Drive посилань
    let fileId = null;
    
    // Формат: https://drive.google.com/file/d/FILE_ID/view
    const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      fileId = fileIdMatch[1];
    }
    
    // Формат: https://drive.google.com/open?id=FILE_ID
    const openIdMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (!fileId && openIdMatch && openIdMatch[1]) {
      fileId = openIdMatch[1];
    }
    
    if (fileId) {
      // Використовуємо thumbnail API для кращої сумісності
      // sz=w2000 - максимальна ширина 2000px (висока якість)
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`;
    }
    
    // Якщо вже пряме посилання або інший формат - повертаємо як є
    return url;
  };

  if (!lesson || !topic || !classData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Завантаження...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const youtubeVideos = lesson.materials.filter(m => m.type === 'youtube');
  const presentations = lesson.materials.filter(m => m.type === 'presentation');
  const files = lesson.materials.filter(m => m.type === 'file');

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-blue-600">Головна</Link>
            <span>/</span>
            <Link to={`/class/${classData.grade}`} className="hover:text-blue-600">
              {classData.grade} клас
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{lesson.title}</span>
          </div>
        </div>
      </div>

      {/* Lesson Header */}
      <section className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to={`/class/${classData.grade}`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 mb-4"
            data-testid="back-button"
          >
            <ArrowLeft className="w-4 h-4" />
            Повернутися до {classData.grade} класу
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 text-white w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold">
                  {lesson.lesson_number}
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Урок {lesson.lesson_number} • {topic.title}</div>
                  <h1 className="text-3xl font-bold text-gray-900">{lesson.title}</h1>
                </div>
              </div>
              
              <Button
                onClick={toggleComplete}
                className={isCompleted ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}
                data-testid="complete-lesson-button"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {isCompleted ? 'Скасувати вивчене' : 'Позначити як вивчене'}
              </Button>
            </div>
            {lesson.page_reference && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <BookOpen className="w-4 h-4" />
                <span>Підручник: {lesson.page_reference}</span>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Lesson Content */}
      <section className="py-12 bg-gray-50 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="description" className="space-y-6" data-testid="lesson-tabs">
            <TabsList className="grid w-full grid-cols-4 max-w-2xl">
              <TabsTrigger value="description" data-testid="tab-description">Опис</TabsTrigger>
              <TabsTrigger value="homework" data-testid="tab-homework">Домашнє завдання</TabsTrigger>
              <TabsTrigger value="materials" data-testid="tab-materials">Матеріали</TabsTrigger>
              <TabsTrigger value="videos" data-testid="tab-videos">Відео</TabsTrigger>
            </TabsList>

            <TabsContent value="description">
              <Card className="p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Опис уроку</h2>
                {lesson.description ? (
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-6">{lesson.description}</p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">Опис уроку буде додано найближчим часом</p>
                  </div>
                )}

                {/* Зображення завдань */}
                {lesson.images && lesson.images.length > 0 && (
                  <div className="mt-8 space-y-8">
                    <h3 className="text-xl font-semibold text-gray-900 border-t pt-6">Завдання</h3>
                    {lesson.images
                      .sort((a, b) => a.order - b.order)
                      .map((image, index) => (
                        <div key={image.id || index} className="space-y-3" data-testid={`lesson-image-${index}`}>
                          {/* Підпис зверху */}
                          {image.caption_top && (
                            <div className="text-center">
                              <p className="text-lg font-semibold text-blue-700">{image.caption_top}</p>
                            </div>
                          )}

                          {/* Зображення */}
                          <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                            <img
                              src={convertGoogleDriveUrl(image.url)}
                              alt={image.caption_bottom || `Зображення ${index + 1}`}
                              className="w-full h-auto"
                              loading="lazy"
                              onError={(e) => {
                                console.error('Помилка завантаження зображення:', image.url);
                                e.target.onerror = null;
                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="400"%3E%3Crect fill="%23f3f4f6" width="800" height="400"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="24" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3E❌ Не вдалося завантажити зображення%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          </div>

                          {/* Підпис знизу */}
                          {image.caption_bottom && (
                            <div className="text-center">
                              <p className="text-sm italic text-gray-600">{image.caption_bottom}</p>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="homework">
              <Card className="p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Домашнє завдання</h2>
                {lesson.homework ? (
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{lesson.homework}</p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">Домашнє завдання не задано</p>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="materials">
              <Card className="p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Матеріали</h2>
                {presentations.length > 0 || files.length > 0 ? (
                  <div className="space-y-6">
                    {presentations.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Presentation className="w-5 h-5 text-blue-600" />
                          Презентації
                        </h3>
                        <div className="grid gap-3">
                          {presentations.map((material) => (
                            <a
                              key={material.id}
                              href={material.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors"
                              data-testid={`material-${material.id}`}
                            >
                              <Presentation className="w-5 h-5 text-blue-600 flex-shrink-0" />
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{material.title}</div>
                                {material.description && (
                                  <div className="text-sm text-gray-600">{material.description}</div>
                                )}
                              </div>
                              <Download className="w-4 h-4 text-gray-400" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {files.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-green-600" />
                          Додаткові файли
                        </h3>
                        <div className="grid gap-3">
                          {files.map((material) => (
                            <a
                              key={material.id}
                              href={material.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors"
                              data-testid={`file-${material.id}`}
                            >
                              <FileText className="w-5 h-5 text-green-600 flex-shrink-0" />
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{material.title}</div>
                                {material.description && (
                                  <div className="text-sm text-gray-600">{material.description}</div>
                                )}
                              </div>
                              <Download className="w-4 h-4 text-gray-400" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">Додаткові матеріали відсутні</p>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="videos">
              <div className="space-y-6">
                {youtubeVideos.length > 0 ? (
                  youtubeVideos.map((video) => {
                    const videoId = getYouTubeVideoId(video.url);
                    return (
                      <Card key={video.id} className="overflow-hidden" data-testid={`video-${video.id}`}>
                        <div className="aspect-video w-full">
                          {videoId ? (
                            <iframe
                              width="100%"
                              height="100%"
                              src={`https://www.youtube.com/embed/${videoId}`}
                              title={video.title}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="w-full h-full"
                            ></iframe>
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <Youtube className="w-16 h-16 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900">{video.title}</h3>
                          {video.description && (
                            <p className="text-sm text-gray-600 mt-1">{video.description}</p>
                          )}
                        </div>
                      </Card>
                    );
                  })
                ) : (
                  <Card className="p-12 text-center">
                    <Youtube className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">Відеоматеріали відсутні</p>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <Footer />
    </div>
  );
}

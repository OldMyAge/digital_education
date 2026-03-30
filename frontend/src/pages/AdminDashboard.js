import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BookOpen, Plus, Edit, Trash2, FileText, X, User, Newspaper } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [topics, setTopics] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [editingLesson, setEditingLesson] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    topic_id: '',
    title: '',
    lesson_number: '',
    description: '',
    page_reference: '',
    homework: '',
    materials: [],
    images: []
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [classesRes, topicsRes, lessonsRes] = await Promise.all([
        axios.get(`${API}/classes`),
        axios.get(`${API}/topics`),
        axios.get(`${API}/lessons`)
      ]);
      setClasses(classesRes.data);
      setTopics(topicsRes.data);
      setLessons(lessonsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Помилка завантаження даних');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const lessonData = {
        ...formData,
        lesson_number: parseInt(formData.lesson_number),
        materials: formData.materials
      };

      if (editingLesson) {
        await axios.put(`${API}/lessons/${editingLesson.id}`, lessonData);
        toast.success('Урок оновлено');
      } else {
        await axios.post(`${API}/lessons`, lessonData);
        toast.success('Урок створено');
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Failed to save lesson:', error);
      toast.error('Помилка збереження');
    }
  };

  const handleDelete = async (lessonId) => {
    if (!window.confirm('Видалити цей урок?')) return;
    try {
      await axios.delete(`${API}/lessons/${lessonId}`);
      toast.success('Урок видалено');
      fetchData();
    } catch (error) {
      console.error('Failed to delete lesson:', error);
      toast.error('Помилка видалення');
    }
  };

  const resetForm = () => {
    setFormData({
      topic_id: '',
      title: '',
      lesson_number: '',
      description: '',
      page_reference: '',
      homework: '',
      materials: [],
      images: []
    });
    setEditingLesson(null);
  };

  const openEditDialog = (lesson) => {
    setEditingLesson(lesson);
    setFormData({
      topic_id: lesson.topic_id,
      title: lesson.title,
      lesson_number: lesson.lesson_number.toString(),
      description: lesson.description || '',
      page_reference: lesson.page_reference || '',
      homework: lesson.homework || '',
      materials: lesson.materials || [],
      images: lesson.images || []
    });
    setDialogOpen(true);
  };

  const addMaterial = () => {
    setFormData({
      ...formData,
      materials: [...formData.materials, { type: 'youtube', title: '', url: '', description: '' }]
    });
  };

  const updateMaterial = (index, field, value) => {
    const updatedMaterials = [...formData.materials];
    updatedMaterials[index][field] = value;
    setFormData({ ...formData, materials: updatedMaterials });
  };

  const removeMaterial = (index) => {
    const updatedMaterials = formData.materials.filter((_, i) => i !== index);
    setFormData({ ...formData, materials: updatedMaterials });
  };

  const addImage = () => {
    setFormData({
      ...formData,
      images: [...formData.images, { url: '', caption_top: '', caption_bottom: '', order: formData.images.length }]
    });
  };

  const updateImage = (index, field, value) => {
    const updatedImages = [...formData.images];
    updatedImages[index][field] = value;
    setFormData({ ...formData, images: updatedImages });
  };

  const removeImage = (index) => {
    const updatedImages = formData.images.filter((_, i) => i !== index);
    // Оновити порядок
    updatedImages.forEach((img, i) => img.order = i);
    setFormData({ ...formData, images: updatedImages });
  };

  const filteredTopics = selectedClass
    ? topics.filter(t => t.class_id === selectedClass)
    : topics;

  const filteredLessons = selectedTopic
    ? lessons.filter(l => l.topic_id === selectedTopic)
    : selectedClass
    ? lessons.filter(l => {
        const topic = topics.find(t => t.id === l.topic_id);
        return topic && topic.class_id === selectedClass;
      })
    : lessons;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Адмін-панель</h1>
              <p className="text-gray-600">Управління уроками та матеріалами</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => window.location.href = '/admin/posts'}
                variant="outline"
                className="flex items-center gap-2"
                data-testid="posts-button"
              >
                <Newspaper className="w-4 h-4" />
                Новини
              </Button>
              <Button
                onClick={() => window.location.href = '/admin/profile'}
                variant="outline"
                className="flex items-center gap-2"
                data-testid="profile-button"
              >
                <User className="w-4 h-4" />
                Профіль
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card className="p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Клас</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger data-testid="class-select">
                    <SelectValue placeholder="Всі класи" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Всі класи</SelectItem>
                    {classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.grade} клас
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Тема</Label>
                <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                  <SelectTrigger data-testid="topic-select">
                    <SelectValue placeholder="Всі теми" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Всі теми</SelectItem>
                    {filteredTopics.map(topic => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" onClick={resetForm} data-testid="add-lesson-button">
                      <Plus className="w-4 h-4 mr-2" />
                      Додати урок
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingLesson ? 'Редагувати урок' : 'Додати новий урок'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label>Тема *</Label>
                        <Select
                          value={formData.topic_id}
                          onValueChange={(value) => setFormData({ ...formData, topic_id: value })}
                          required
                        >
                          <SelectTrigger data-testid="form-topic-select">
                            <SelectValue placeholder="Оберіть тему" />
                          </SelectTrigger>
                          <SelectContent>
                            {topics.map(topic => {
                              const cls = classes.find(c => c.id === topic.class_id);
                              return (
                                <SelectItem key={topic.id} value={topic.id}>
                                  {cls?.grade} клас - {topic.title}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Назва уроку *</Label>
                        <Input
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          required
                          data-testid="lesson-title-input"
                        />
                      </div>

                      <div>
                        <Label>Номер уроку *</Label>
                        <Input
                          type="number"
                          value={formData.lesson_number}
                          onChange={(e) => setFormData({ ...formData, lesson_number: e.target.value })}
                          required
                          data-testid="lesson-number-input"
                        />
                      </div>

                      <div>
                        <Label>Сторінки підручника</Label>
                        <Input
                          value={formData.page_reference}
                          onChange={(e) => setFormData({ ...formData, page_reference: e.target.value })}
                          placeholder="с. 5-8"
                        />
                      </div>

                      <div>
                        <Label>Опис уроку</Label>
                        <Textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={4}
                          data-testid="lesson-description-input"
                        />
                      </div>

                      <div>
                        <Label>Домашнє завдання</Label>
                        <Textarea
                          value={formData.homework}
                          onChange={(e) => setFormData({ ...formData, homework: e.target.value })}
                          rows={3}
                        />
                      </div>

                      {/* Materials Section */}
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-base font-semibold">Матеріали до уроку</Label>
                          <Button type="button" size="sm" onClick={addMaterial} variant="outline">
                            <Plus className="w-4 h-4 mr-1" />
                            Додати матеріал
                          </Button>
                        </div>

                        {formData.materials.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                            Немає доданих матеріалів. Натисніть "Додати матеріал" щоб додати відео або файли.
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {formData.materials.map((material, index) => (
                              <Card key={index} className="p-4 bg-gray-50">
                                <div className="flex items-start justify-between mb-3">
                                  <Label className="text-sm font-medium">Матеріал {index + 1}</Label>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removeMaterial(index)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <X className="w-4 h-4 text-red-600" />
                                  </Button>
                                </div>

                                <div className="space-y-3">
                                  <div>
                                    <Label className="text-xs">Тип матеріалу</Label>
                                    <Select
                                      value={material.type}
                                      onValueChange={(value) => updateMaterial(index, 'type', value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="youtube">YouTube відео</SelectItem>
                                        <SelectItem value="presentation">Презентація (Google Slides/Drive)</SelectItem>
                                        <SelectItem value="file">Файл (Google Drive)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div>
                                    <Label className="text-xs">Назва матеріалу *</Label>
                                    <Input
                                      value={material.title}
                                      onChange={(e) => updateMaterial(index, 'title', e.target.value)}
                                      placeholder={
                                        material.type === 'youtube'
                                          ? 'Напр: Відео урок по темі'
                                          : material.type === 'presentation'
                                          ? 'Напр: Презентація до уроку'
                                          : 'Напр: Завдання для практики'
                                      }
                                      required
                                    />
                                  </div>

                                  <div>
                                    <Label className="text-xs">
                                      Посилання *
                                      {material.type === 'youtube' && (
                                        <span className="text-gray-500 ml-1">(URL з YouTube)</span>
                                      )}
                                      {(material.type === 'presentation' || material.type === 'file') && (
                                        <span className="text-gray-500 ml-1">(Посилання з Google Drive)</span>
                                      )}
                                    </Label>
                                    <Input
                                      value={material.url}
                                      onChange={(e) => updateMaterial(index, 'url', e.target.value)}
                                      placeholder={
                                        material.type === 'youtube'
                                          ? 'https://www.youtube.com/watch?v=...'
                                          : 'https://drive.google.com/file/d/...'
                                      }
                                      required
                                    />
                                    {material.type !== 'youtube' && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        💡 Порада: У Google Drive натисніть правою кнопкою → "Отримати посилання" → 
                                        оберіть "Усі, у кого є посилання" → скопіюйте URL
                                      </p>
                                    )}
                                  </div>

                                  <div>
                                    <Label className="text-xs">Опис (необов'язково)</Label>
                                    <Textarea
                                      value={material.description || ''}
                                      onChange={(e) => updateMaterial(index, 'description', e.target.value)}
                                      placeholder="Додатковий опис матеріалу"
                                      rows={2}
                                    />
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Images Section */}
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-base font-semibold">Зображення завдань (скріншоти)</Label>
                          <Button type="button" size="sm" onClick={addImage} variant="outline">
                            <Plus className="w-4 h-4 mr-1" />
                            Додати зображення
                          </Button>
                        </div>

                        {formData.images.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                            Немає доданих зображень. Натисніть "Додати зображення" щоб додати скріншоти завдань з підручника.
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {formData.images.map((image, index) => (
                              <Card key={index} className="p-4 bg-gray-50">
                                <div className="flex items-start justify-between mb-3">
                                  <Label className="text-sm font-medium">Зображення {index + 1}</Label>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removeImage(index)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <X className="w-4 h-4 text-red-600" />
                                  </Button>
                                </div>

                                <div className="space-y-3">
                                  <div>
                                    <Label className="text-xs">Підпис зверху (необов'язково)</Label>
                                    <Input
                                      value={image.caption_top || ''}
                                      onChange={(e) => updateImage(index, 'caption_top', e.target.value)}
                                      placeholder="Напр: Повторення теми 'Текстові документи'"
                                    />
                                  </div>

                                  <div>
                                    <Label className="text-xs">Посилання на зображення (Google Drive) *</Label>
                                    <Input
                                      value={image.url}
                                      onChange={(e) => updateImage(index, 'url', e.target.value)}
                                      placeholder="https://drive.google.com/file/d/..."
                                      required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                      💡 Завантажте скріншот на Google Drive, зробіть публічним, скопіюйте посилання
                                    </p>
                                  </div>

                                  <div>
                                    <Label className="text-xs">Підпис знизу (необов'язково)</Label>
                                    <Input
                                      value={image.caption_bottom || ''}
                                      onChange={(e) => updateImage(index, 'caption_bottom', e.target.value)}
                                      placeholder="Напр: Мал. 4.51. Зразок для Варіанта 1"
                                    />
                                  </div>

                                  {/* Preview if URL is provided */}
                                  {image.url && (
                                    <div className="mt-2 p-2 bg-white rounded border">
                                      <p className="text-xs text-gray-600 mb-1">Попередній перегляд:</p>
                                      <img 
                                        src={convertGoogleDriveUrl(image.url)} 
                                        alt="Preview" 
                                        className="max-w-full h-auto rounded"
                                        style={{ maxHeight: '200px' }}
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          e.target.nextSibling.style.display = 'block';
                                        }}
                                      />
                                      <p className="text-xs text-red-600 mt-2" style={{ display: 'none' }}>
                                        ❌ Не вдалося завантажити зображення. Перевірте посилання або права доступу.
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button type="submit" className="flex-1" data-testid="save-lesson-button">
                          {editingLesson ? 'Зберегти зміни' : 'Створити урок'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setDialogOpen(false)}
                        >
                          Скасувати
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </Card>

          {/* Lessons List */}
          <div className="space-y-3">
            {filteredLessons.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Уроки не знайдено</p>
              </Card>
            ) : (
              filteredLessons
                .sort((a, b) => a.lesson_number - b.lesson_number)
                .map((lesson) => {
                  const topic = topics.find(t => t.id === lesson.topic_id);
                  const cls = topic ? classes.find(c => c.id === topic.class_id) : null;
                  return (
                    <Card key={lesson.id} className="p-4" data-testid={`lesson-item-${lesson.id}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="bg-blue-600 text-white w-10 h-10 rounded-lg flex items-center justify-center font-bold flex-shrink-0">
                            {lesson.lesson_number}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 mb-1">{lesson.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span>{cls?.grade} клас</span>
                              <span>•</span>
                              <span>{topic?.title}</span>
                              {lesson.page_reference && (
                                <>
                                  <span>•</span>
                                  <span>{lesson.page_reference}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(lesson)}
                            data-testid={`edit-lesson-${lesson.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(lesson.id)}
                            className="text-red-600 hover:text-red-700"
                            data-testid={`delete-lesson-${lesson.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

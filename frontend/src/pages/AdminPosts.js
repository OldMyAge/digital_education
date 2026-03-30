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
import { Newspaper, Plus, Edit, Trash2, Pin, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

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
  news: { label: 'Новини', color: 'bg-blue-100 text-blue-700' },
  announcement: { label: 'Оголошення', color: 'bg-amber-100 text-amber-700' },
  achievement: { label: 'Досягнення', color: 'bg-green-100 text-green-700' }
};

export default function AdminPosts() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [editingPost, setEditingPost] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image_url: '',
    link: '',
    category: 'news',
    is_pinned: false
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${API}/posts`);
      setPosts(response.data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      toast.error('Помилка завантаження постів');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPost) {
        await axios.put(`${API}/posts/${editingPost.id}`, formData);
        toast.success('Пост оновлено');
      } else {
        await axios.post(`${API}/posts`, formData);
        toast.success('Пост створено');
      }
      setDialogOpen(false);
      resetForm();
      fetchPosts();
    } catch (error) {
      console.error('Failed to save post:', error);
      toast.error('Помилка збереження');
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Видалити цей пост?')) return;
    try {
      await axios.delete(`${API}/posts/${postId}`);
      toast.success('Пост видалено');
      fetchPosts();
    } catch (error) {
      console.error('Failed to delete post:', error);
      toast.error('Помилка видалення');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      image_url: '',
      link: '',
      category: 'news',
      is_pinned: false
    });
    setEditingPost(null);
  };

  const openEditDialog = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      image_url: post.image_url || '',
      link: post.link || '',
      category: post.category,
      is_pinned: post.is_pinned
    });
    setDialogOpen(true);
  };

  const filteredPosts = filterCategory === 'all'
    ? posts
    : posts.filter(p => p.category === filterCategory);

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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Управління новинами</h1>
            <p className="text-gray-600">Додавайте та редагуйте новини, оголошення та досягнення</p>
          </div>

          {/* Filters and Add */}
          <Card className="p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Label>Фільтр:</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Всі категорії</SelectItem>
                    <SelectItem value="news">Новини</SelectItem>
                    <SelectItem value="announcement">Оголошення</SelectItem>
                    <SelectItem value="achievement">Досягнення</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm} data-testid="add-post-button">
                    <Plus className="w-4 h-4 mr-2" />
                    Додати пост
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingPost ? 'Редагувати пост' : 'Додати новий пост'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label>Категорія *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="news">Новини</SelectItem>
                          <SelectItem value="announcement">Оголошення</SelectItem>
                          <SelectItem value="achievement">Досягнення</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Заголовок *</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Назва поста"
                        required
                        data-testid="post-title-input"
                      />
                    </div>

                    <div>
                      <Label>Текст *</Label>
                      <Textarea
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        placeholder="Опишіть новину або оголошення..."
                        rows={6}
                        required
                      />
                    </div>

                    <div>
                      <Label className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        Зображення (Google Drive, необов'язково)
                      </Label>
                      <Input
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        placeholder="https://drive.google.com/file/d/..."
                      />
                      {formData.image_url && (
                        <div className="mt-2 border rounded p-2">
                          <img
                            src={convertGoogleDriveUrl(formData.image_url)}
                            alt="Preview"
                            className="max-w-full h-auto rounded max-h-48"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                          <p className="text-xs text-red-600 mt-2" style={{ display: 'none' }}>
                            ❌ Не вдалося завантажити
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" />
                        Посилання (необов'язково)
                      </Label>
                      <Input
                        value={formData.link}
                        onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                        placeholder="https://example.com"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Додайте посилання на повну статтю, відео або документ
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_pinned"
                        checked={formData.is_pinned}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_pinned: checked })}
                      />
                      <Label htmlFor="is_pinned" className="flex items-center gap-2 cursor-pointer">
                        <Pin className="w-4 h-4 text-blue-600" />
                        Закріпити пост зверху
                      </Label>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1" data-testid="save-post-button">
                        {editingPost ? 'Зберегти зміни' : 'Створити пост'}
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
          </Card>

          {/* Posts List */}
          <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <Card className="p-12 text-center">
                <Newspaper className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Постів не знайдено</p>
              </Card>
            ) : (
              filteredPosts.map((post) => (
                <Card key={post.id} className="p-6" data-testid={`post-item-${post.id}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {post.is_pinned && (
                          <Pin className="w-4 h-4 text-blue-600 fill-blue-600" />
                        )}
                        <span className={`px-2 py-1 text-xs rounded-full ${CATEGORIES[post.category].color}`}>
                          {CATEGORIES[post.category].label}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(post.created_at).toLocaleDateString('uk-UA')}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                      <p className="text-gray-700 mb-3 line-clamp-3">{post.content}</p>
                      {post.link && (
                        <a
                          href={post.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <LinkIcon className="w-3 h-3" />
                          Детальніше
                        </a>
                      )}
                    </div>
                    {post.image_url && (
                      <img
                        src={convertGoogleDriveUrl(post.image_url)}
                        alt={post.title}
                        className="w-32 h-32 object-cover rounded-lg ml-4"
                      />
                    )}
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(post)}
                        data-testid={`edit-post-${post.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(post.id)}
                        className="text-red-600"
                        data-testid={`delete-post-${post.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

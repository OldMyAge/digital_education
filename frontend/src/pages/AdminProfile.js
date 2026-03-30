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
import { User, Mail, Award, GraduationCap, Image as ImageIcon, Plus, X } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const convertGoogleDriveUrl = (url) => {
  if (!url) return url;
  let fileId = null;
  const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch && fileIdMatch[1]) {
    fileId = fileIdMatch[1];
  }
  const openIdMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (!fileId && openIdMatch && openIdMatch[1]) {
    fileId = openIdMatch[1];
  }
  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`;
  }
  return url;
};

export default function AdminProfile() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    education: '',
    experience_years: '',
    qualifications: [],
    bio: '',
    photo_url: '',
    contact_email: ''
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchTeacherInfo();
    }
  }, [user]);

  const fetchTeacherInfo = async () => {
    try {
      const response = await axios.get(`${API}/teacher`);
      setTeacher(response.data);
      setFormData({
        full_name: response.data.full_name || '',
        education: response.data.education || '',
        experience_years: response.data.experience_years || '',
        qualifications: response.data.qualifications || [],
        bio: response.data.bio || '',
        photo_url: response.data.photo_url || '',
        contact_email: response.data.contact_email || ''
      });
    } catch (error) {
      console.error('Failed to fetch teacher info:', error);
      toast.error('Помилка завантаження даних');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await axios.put(`${API}/teacher`, {
        ...formData,
        experience_years: parseInt(formData.experience_years)
      });
      toast.success('Профіль успішно оновлено!');
      fetchTeacherInfo();
    } catch (error) {
      console.error('Failed to save teacher info:', error);
      toast.error('Помилка збереження');
    } finally {
      setSaving(false);
    }
  };

  const addQualification = () => {
    setFormData({
      ...formData,
      qualifications: [...formData.qualifications, '']
    });
  };

  const updateQualification = (index, value) => {
    const updated = [...formData.qualifications];
    updated[index] = value;
    setFormData({ ...formData, qualifications: updated });
  };

  const removeQualification = (index) => {
    const updated = formData.qualifications.filter((_, i) => i !== index);
    setFormData({ ...formData, qualifications: updated });
  };

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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Налаштування профілю</h1>
            <p className="text-gray-600">Редагуйте інформацію про себе, яка відображається на головній сторінці</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Основна інформація */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Основна інформація
              </h2>

              <div className="space-y-4">
                <div>
                  <Label>ПІБ *</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Прізвище Ім'я По батькові"
                    required
                    data-testid="full-name-input"
                  />
                </div>

                <div>
                  <Label>Email для контактів *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      placeholder="email@example.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>Років досвіду *</Label>
                  <Input
                    type="number"
                    value={formData.experience_years}
                    onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                    placeholder="16"
                    min="0"
                    required
                  />
                </div>
              </div>
            </Card>

            {/* Освіта */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                Освіта
              </h2>

              <div>
                <Label>Опис освіти *</Label>
                <Textarea
                  value={formData.education}
                  onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                  placeholder="Магістр комп'ютерних систем та мереж (Університет, рік)..."
                  rows={3}
                  required
                />
              </div>
            </Card>

            {/* Кваліфікації */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-600" />
                  Кваліфікації та сертифікати
                </h2>
                <Button type="button" size="sm" onClick={addQualification} variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  Додати
                </Button>
              </div>

              {formData.qualifications.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                  Немає доданих кваліфікацій. Натисніть "Додати" щоб додати.
                </p>
              ) : (
                <div className="space-y-3">
                  {formData.qualifications.map((qual, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={qual}
                        onChange={(e) => updateQualification(index, e.target.value)}
                        placeholder={`Напр: Спеціаліст вищої категорії`}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeQualification(index)}
                        className="px-2"
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Біографія */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Біографія</h2>
              
              <div>
                <Label>Розкажіть про себе *</Label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Викладаю інформатику у 5-9 класах..."
                  rows={5}
                  required
                />
              </div>
            </Card>

            {/* Фото */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-600" />
                Фото профілю
              </h2>

              <div className="space-y-4">
                <div>
                  <Label>Посилання на фото (Google Drive) *</Label>
                  <Input
                    value={formData.photo_url}
                    onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                    placeholder="https://drive.google.com/file/d/..."
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Завантажте фото на Google Drive, зробіть публічним, скопіюйте посилання
                  </p>
                </div>

                {/* Попередній перегляд фото */}
                {formData.photo_url && (
                  <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
                    <p className="text-sm text-gray-600 mb-2">Попередній перегляд:</p>
                    <img
                      src={convertGoogleDriveUrl(formData.photo_url)}
                      alt="Попередній перегляд"
                      className="w-48 h-48 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <p className="text-xs text-red-600 mt-2" style={{ display: 'none' }}>
                      ❌ Не вдалося завантажити фото. Перевірте посилання або права доступу.
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Кнопки */}
            <div className="flex gap-4">
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={saving}
                data-testid="save-profile-button"
              >
                {saving ? 'Збереження...' : 'Зберегти зміни'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/dashboard')}
              >
                Скасувати
              </Button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}

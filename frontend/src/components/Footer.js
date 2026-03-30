import { Mail, Award, GraduationCap } from 'lucide-react';

export const Footer = ({ teacher }) => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Цифрова Освіта</h3>
            <p className="text-sm text-gray-400">
              Освітній портал для вивчення інформатики в 5-9 класах. 
              Матеріали, уроки та завдання за програмою Н.В. Морзе.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Швидкі посилання</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/" className="hover:text-white transition-colors">
                  Головна
                </a>
              </li>
              <li>
                <a href="/class/5" className="hover:text-white transition-colors">
                  5 клас
                </a>
              </li>
              <li>
                <a href="/class/6" className="hover:text-white transition-colors">
                  6 клас
                </a>
              </li>
              <li>
                <a href="/admin/login" className="hover:text-white transition-colors">
                  Адмін-панель
                </a>
              </li>
            </ul>
          </div>

          {/* Teacher Info */}
          {teacher && (
            <div>
              <h3 className="text-white font-semibold text-lg mb-4">Ваш вчитель</h3>
              <div className="space-y-4">
                {/* Photo */}
                <div className="flex items-center gap-4">
                  <img
                    src={teacher.photo_url.includes('drive.google.com') 
                      ? `https://drive.google.com/thumbnail?id=${teacher.photo_url.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1]}&sz=w200`
                      : teacher.photo_url}
                    alt={teacher.full_name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-700"
                  />
                  <div>
                    <p className="text-white font-medium text-lg">{teacher.full_name}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                      <GraduationCap className="w-4 h-4" />
                      <span>{teacher.experience_years} років досвіду</span>
                    </div>
                  </div>
                </div>
                
                {teacher.qualifications && teacher.qualifications.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Award className="w-4 h-4 flex-shrink-0" />
                    <span className="line-clamp-2">{teacher.qualifications[0]}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4" />
                  <a 
                    href={`mailto:${teacher.contact_email}`} 
                    className="hover:text-white transition-colors break-all"
                  >
                    {teacher.contact_email}
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
          <p>&copy; 2026 Цифрова Освіта. Всі права захищені.</p>
        </div>
      </div>
    </footer>
  );
};

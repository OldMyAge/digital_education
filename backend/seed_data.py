"""
Скрипт для наповнення бази даних початковими даними
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
import bcrypt
from datetime import datetime, timezone
import uuid

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def seed_database():
    print("Очищення бази даних...")
    await db.users.delete_many({})
    await db.teacher.delete_many({})
    await db.classes.delete_many({})
    await db.topics.delete_many({})
    await db.lessons.delete_many({})
    
    print("Створення адміністратора...")
    admin = {
        "id": str(uuid.uuid4()),
        "email": "ahostiuk@kosiv2.licej.ukr.education",
        "password": hash_password("InfoTeach2026!"),
        "is_admin": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(admin)
    print(f"Адміністратор створений: {admin['email']}")
    
    print("Додавання інформації про вчителя...")
    teacher = {
        "full_name": "Гостюк Андрій Васильович",
        "education": "Магістр комп'ютерних систем та мереж (Чернівецький національний університет імені Юрія Федьковича, 2009). Магістр технологічної освіти (Трудове навчання та основи інформатики, 2013)",
        "experience_years": 16,
        "qualifications": [
            "Спеціаліст вищої категорії",
            "Старший вчитель",
            "Сертифікат 'ЦИФРОВІ ТЕХНОЛОГІЇ В ДИСТАНЦІЙНІЙ ОСВІТІ' (2021)",
            "Сертифікат 'АКАДЕМІЯ ШІ ДЛЯ ОСВІТЯН ВІД GOOGLE' (2025)"
        ],
        "bio": "Викладаю інформатику у 5-9 класах за програмою Н.В. Морзе. Маю 16 років педагогічного досвіду. Регулярно підвищую кваліфікацію, слідкую за новітніми технологіями в освіті. Моя мета - зробити вивчення інформатики цікавим та доступним для кожного учня.",
        "photo_url": "https://customer-assets.emergentagent.com/job_teacher-lessons-bank/artifacts/931vx8ms_%D1%84%D0%BE%D1%82%D0%BE.jpg",
        "contact_email": "ahostiuk@kosiv2.licej.ukr.education"
    }
    await db.teacher.insert_one(teacher)
    print("Інформація про вчителя додана")
    
    # Створення класів
    print("Створення класів...")
    classes_data = [
        {"grade": 5, "total_hours": 52, "year": "2023", "description": "Інформатика 5 клас (за підручником Н.В. Морзе, О.В. Барна)"},
        {"grade": 6, "total_hours": 52, "year": "2023", "description": "Інформатика 6 клас (за підручником Н.В. Морзе, О.В. Барна)"},
        {"grade": 7, "total_hours": 70, "year": "2024", "description": "Інформатика 7 клас (за підручником Н.В. Морзе, О.В. Барна)"},
        {"grade": 8, "total_hours": 70, "year": "2025", "description": "Інформатика 8 клас (за підручником Н.В. Морзе, О.В. Барна)"},
        {"grade": 9, "total_hours": 70, "year": "2026", "description": "Інформатика 9 клас (підготовка програми)"},
    ]
    
    class_ids = {}
    for cls_data in classes_data:
        cls_id = str(uuid.uuid4())
        class_ids[cls_data['grade']] = cls_id
        cls = {
            "id": cls_id,
            "grade": cls_data['grade'],
            "total_hours": cls_data['total_hours'],
            "year": cls_data['year'],
            "description": cls_data['description'],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.classes.insert_one(cls)
        print(f"Клас {cls_data['grade']} створено")
    
    # 5 КЛАС - Теми та уроки
    print("Додавання тем та уроків для 5 класу...")
    
    topics_5 = [
        {
            "title": "Тема 1. Інформація і комп'ютер",
            "lesson_range": "Уроки 1-12",
            "order": 1,
            "lessons": [
                {"num": 1, "title": "БЖД під час роботи з комп'ютером", "pages": "с. 5-8"},
                {"num": 2, "title": "Безпечне користування інтернетом", "pages": "с. 9-11"},
                {"num": 3, "title": "Інтернет для навчання", "pages": "с. 12-15"},
                {"num": 4, "title": "Інтернет для розвитку", "pages": "с. 15-17"},
                {"num": 5, "title": "Постановка проблеми, закономірності", "pages": "с. 18-24"},
                {"num": 6, "title": "Інформація, дані, повідомлення", "pages": "с. 24-27"},
                {"num": 7, "title": "Комп'ютер як пристрій опрацювання даних", "pages": "с. 28-33"},
                {"num": 8, "title": "Складові комп'ютерів. Інфографіка. Карти знань", "pages": "с. 34-39"},
                {"num": 9, "title": "Виконавці алгоритмів. Системи команд", "pages": "с. 40-44"},
                {"num": 10, "title": "Середовище виконання алгоритмів", "pages": "с. 45-48"},
                {"num": 11, "title": "Операційна система та її інтерфейс", "pages": "с. 49-54"},
                {"num": 12, "title": "Програми для опрацювання різних типів даних. Тематична", "pages": "с. 55-61"}
            ]
        },
        {
            "title": "Тема 2. Алгоритми та програми для роботи з графікою",
            "lesson_range": "Уроки 13-18",
            "order": 2,
            "lessons": [
                {"num": 13, "title": "ПЗ для перегляду графіки", "pages": "с. 62-68"},
                {"num": 14, "title": "Опрацювання графіки в різних середовищах", "pages": "с. 69-72"},
                {"num": 15, "title": "Комп'ютерна графіка та її особливості", "pages": "с. 73-78"},
                {"num": 16, "title": "Растровий графічний редактор", "pages": "с. 78-84"},
                {"num": 17, "title": "Об'єкти та їхні властивості", "pages": "с. 84-90"},
                {"num": 18, "title": "Дії над об'єктами. Тематична", "pages": "с. 90-93"}
            ]
        },
        {
            "title": "Тема 3. Алгоритми та їх типи",
            "lesson_range": "Уроки 19-26",
            "order": 3,
            "lessons": [
                {"num": 19, "title": "Типи алгоритмів", "pages": "с. 94-99"},
                {"num": 20, "title": "Лінійні алгоритми", "pages": "с. 100-103"},
                {"num": 21, "title": "Побудова лінійних алгоритмів", "pages": "с. 103-105"},
                {"num": 22, "title": "Постановка проблеми, закономірності", "pages": "с. 106-112"},
                {"num": 23, "title": "Алгоритми моделей закономірностей", "pages": "с. 112-116"},
                {"num": 24, "title": "Алгоритми із повторенням", "pages": "с. 117-121"},
                {"num": 25, "title": "Поєднання повторень", "pages": "с. 122-124"},
                {"num": 26, "title": "Добір стратегії. Тематична", "pages": "с. 125-127"}
            ]
        },
        {
            "title": "Тема 4. Алгоритми та програми для роботи з текстами",
            "lesson_range": "Уроки 27-39",
            "order": 4,
            "lessons": [
                {"num": 27, "title": "Введення та редагування текстів", "pages": "с. 128-135"},
                {"num": 28, "title": "Форматування символів і абзаців", "pages": "с. 135-141"},
                {"num": 29, "title": "Графіка у текстовому документі", "pages": "с. 142-146"},
                {"num": 30, "title": "Створення схем", "pages": "с. 146-151"},
                {"num": 31, "title": "Векторні зображення в офісних пакетах", "pages": "с. 152-154"},
                {"num": 32, "title": "Анімовані історії у Scratch", "pages": "с. 155-159"},
                {"num": 33, "title": "Комп'ютерні мережі. Локальна мережа", "pages": "с. 160-166"},
                {"num": 34, "title": "Пошук інформації в інтернеті", "pages": "с. 167-176"},
                {"num": 35, "title": "Завантаження даних з інтернету", "pages": "с. 177-181"},
                {"num": 36, "title": "Однорівневі списки", "pages": "с. 182-186"},
                {"num": 37, "title": "Авторське право", "pages": "с. 186-190"},
                {"num": 38, "title": "Команди розгалуження", "pages": "с. 191-197"},
                {"num": 39, "title": "Алгоритми з розгалуженнями. Тематична", "pages": "с. 197-201"}
            ]
        },
        {
            "title": "Тема 5. Мультимедіа та проєкти",
            "lesson_range": "Уроки 40-52",
            "order": 5,
            "lessons": [
                {"num": 40, "title": "ПЗ для презентацій", "pages": "с. 202-207"},
                {"num": 41, "title": "Редагування та показ презентацій", "pages": "с. 207-213"},
                {"num": 42, "title": "Об'єкти презентації", "pages": "с. 214-219"},
                {"num": 43, "title": "Анімація об'єктів", "pages": "с. 220-225"},
                {"num": 44, "title": "Етапи створення презентації", "pages": "с. 226-229"},
                {"num": 45, "title": "Типи слайдів", "pages": "с. 230-236"},
                {"num": 46, "title": "Анімація переходів", "pages": "с. 236-240"},
                {"num": 47, "title": "Виступ перед аудиторією", "pages": "с. 241-242"},
                {"num": 48, "title": "Підготовка до друку", "pages": "с. 242-246"},
                {"num": 49, "title": "Алгоритми з повтореннями та розгалуженнями", "pages": "с. 247-251"},
                {"num": 50, "title": "Планування проєкту", "pages": "с. 252-254"},
                {"num": 51, "title": "Виконання проєкту. Тематична", "pages": "с. 254-255"},
                {"num": 52, "title": "Повторення та узагальнення", "pages": ""}
            ]
        }
    ]
    
    for topic_data in topics_5:
        topic_id = str(uuid.uuid4())
        topic = {
            "id": topic_id,
            "class_id": class_ids[5],
            "title": topic_data["title"],
            "order": topic_data["order"],
            "lesson_range": topic_data["lesson_range"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.topics.insert_one(topic)
        
        # Додавання уроків
        for lesson_data in topic_data["lessons"]:
            lesson = {
                "id": str(uuid.uuid4()),
                "topic_id": topic_id,
                "title": lesson_data["title"],
                "lesson_number": lesson_data["num"],
                "description": "",
                "page_reference": lesson_data["pages"],
                "homework": "",
                "materials": [],
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await db.lessons.insert_one(lesson)
    
    print(f"5 клас: {len(topics_5)} тем додано")
    
    # 6 КЛАС - Основні теми (порожні для адмін-панелі)
    print("Додавання порожніх тем для 6 класу...")
    topics_6 = [
        {"title": "Тема 1. Інформаційні процеси та системи", "order": 1},
        {"title": "Тема 2. Мережеві технології та інтернет", "order": 2},
        {"title": "Тема 3. Комп'ютер як інструмент", "order": 3},
        {"title": "Тема 4. Об'єкти та моделі. Алгоритми і програми", "order": 4},
    ]
    
    for topic_data in topics_6:
        topic_id = str(uuid.uuid4())
        topic = {
            "id": topic_id,
            "class_id": class_ids[6],
            "title": topic_data["title"],
            "order": topic_data["order"],
            "lesson_range": "Буде додано",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.topics.insert_one(topic)
    
    print(f"6 клас: {len(topics_6)} тем додано")
    
    # 7 КЛАС
    print("Додавання порожніх тем для 7 класу...")
    topics_7 = [
        {"title": "Тема 1. Комунікація та взаємодія", "order": 1},
        {"title": "Тема 2. Інформаційна грамотність. Цифрова безпека", "order": 2},
        {"title": "Тема 3. Алгоритми та програми", "order": 3},
        {"title": "Тема 4. Комп'ютерна графіка", "order": 4},
    ]
    
    for topic_data in topics_7:
        topic_id = str(uuid.uuid4())
        topic = {
            "id": topic_id,
            "class_id": class_ids[7],
            "title": topic_data["title"],
            "order": topic_data["order"],
            "lesson_range": "Буде додано",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.topics.insert_one(topic)
    
    print(f"7 клас: {len(topics_7)} тем додано")
    
    # 8 КЛАС
    print("Додавання порожніх тем для 8 класу...")
    topics_8 = [
        {"title": "Тема 1. Цифрова безпека", "order": 1},
        {"title": "Тема 2. Робота з даними", "order": 2},
        {"title": "Тема 3. Основи веб-дизайну", "order": 3},
        {"title": "Тема 4. Алгоритмізація та програмування", "order": 4},
    ]
    
    for topic_data in topics_8:
        topic_id = str(uuid.uuid4())
        topic = {
            "id": topic_id,
            "class_id": class_ids[8],
            "title": topic_data["title"],
            "order": topic_data["order"],
            "lesson_range": "Буде додано",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.topics.insert_one(topic)
    
    print(f"8 клас: {len(topics_8)} тем додано")
    
    # 9 КЛАС - порожній
    print("9 клас: порожня структура створена")
    
    print("\n✅ База даних успішно заповнена!")
    print(f"\nДані для входу в адмін-панель:")
    print(f"Email: ahostiuk@kosiv2.licej.ukr.education")
    print(f"Пароль: InfoTeach2026!")

if __name__ == "__main__":
    asyncio.run(seed_database())
    client.close()

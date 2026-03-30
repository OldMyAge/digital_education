from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT configuration
SECRET_KEY = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

security = HTTPBearer()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# =============== MODELS ===============

class TeacherInfo(BaseModel):
    model_config = ConfigDict(extra="ignore")
    full_name: str
    education: str
    experience_years: int
    qualifications: List[str]
    bio: str
    photo_url: str
    contact_email: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    is_admin: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class ClassModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    grade: int  # 5, 6, 7, 8, 9
    total_hours: int
    year: str
    description: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ClassCreate(BaseModel):
    grade: int
    total_hours: int
    year: str
    description: str

class Topic(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    class_id: str
    title: str
    order: int
    lesson_range: str  # e.g., "Уроки 1-12"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TopicCreate(BaseModel):
    class_id: str
    title: str
    order: int
    lesson_range: str

class Material(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str  # youtube, file, presentation
    title: str
    url: str
    description: Optional[str] = None

class MaterialCreate(BaseModel):
    type: str
    title: str
    url: str
    description: Optional[str] = None

class LessonImage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    url: str  # Google Drive link
    caption_top: Optional[str] = None  # Підпис зверху
    caption_bottom: Optional[str] = None  # Підпис знизу
    order: int = 0  # Порядок відображення

class LessonImageCreate(BaseModel):
    url: str
    caption_top: Optional[str] = None
    caption_bottom: Optional[str] = None
    order: int = 0

class Lesson(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    topic_id: str
    title: str
    lesson_number: int
    description: Optional[str] = None
    page_reference: Optional[str] = None  # e.g., "с. 5-8"
    homework: Optional[str] = None
    materials: List[Material] = []
    images: List[LessonImage] = []  # Зображення з підписами
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LessonCreate(BaseModel):
    topic_id: str
    title: str
    lesson_number: int
    description: Optional[str] = None
    page_reference: Optional[str] = None
    homework: Optional[str] = None
    materials: List[MaterialCreate] = []
    images: List[LessonImageCreate] = []

class LessonUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    page_reference: Optional[str] = None
    homework: Optional[str] = None
    materials: Optional[List[MaterialCreate]] = None
    images: Optional[List[LessonImageCreate]] = None

# =============== POST MODELS ===============

class Post(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    image_url: Optional[str] = None
    link: Optional[str] = None
    category: str  # "news", "announcement", "achievement"
    is_pinned: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PostCreate(BaseModel):
    title: str
    content: str
    image_url: Optional[str] = None
    link: Optional[str] = None
    category: str
    is_pinned: bool = False

class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    image_url: Optional[str] = None
    link: Optional[str] = None
    category: Optional[str] = None
    is_pinned: Optional[bool] = None

# =============== AUTH HELPERS ===============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        user = await db.users.find_one({"email": email}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return User(**user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# =============== AUTH ENDPOINTS ===============

@api_router.post("/auth/register", response_model=User)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_pw = hash_password(user_data.password)
    user = User(email=user_data.email, is_admin=True)
    user_dict = user.model_dump()
    user_dict['password'] = hashed_pw
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    return user

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user['email']})
    return Token(access_token=access_token)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# =============== TEACHER INFO ENDPOINTS ===============

@api_router.get("/teacher", response_model=TeacherInfo)
async def get_teacher_info():
    teacher = await db.teacher.find_one({}, {"_id": 0})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher info not found")
    return TeacherInfo(**teacher)

@api_router.put("/teacher", response_model=TeacherInfo)
async def update_teacher_info(info: TeacherInfo, current_user: User = Depends(get_current_user)):
    teacher_dict = info.model_dump()
    await db.teacher.delete_many({})
    await db.teacher.insert_one(teacher_dict)
    return info

# =============== CLASSES ENDPOINTS ===============

@api_router.get("/classes", response_model=List[ClassModel])
async def get_classes():
    classes = await db.classes.find({}, {"_id": 0}).sort("grade", 1).to_list(100)
    for cls in classes:
        if isinstance(cls.get('created_at'), str):
            cls['created_at'] = datetime.fromisoformat(cls['created_at'])
    return [ClassModel(**cls) for cls in classes]

@api_router.get("/classes/{grade}", response_model=ClassModel)
async def get_class_by_grade(grade: int):
    cls = await db.classes.find_one({"grade": grade}, {"_id": 0})
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    if isinstance(cls.get('created_at'), str):
        cls['created_at'] = datetime.fromisoformat(cls['created_at'])
    return ClassModel(**cls)

@api_router.post("/classes", response_model=ClassModel)
async def create_class(class_data: ClassCreate, current_user: User = Depends(get_current_user)):
    cls = ClassModel(**class_data.model_dump())
    cls_dict = cls.model_dump()
    cls_dict['created_at'] = cls_dict['created_at'].isoformat()
    await db.classes.insert_one(cls_dict)
    return cls

# =============== TOPICS ENDPOINTS ===============

@api_router.get("/topics", response_model=List[Topic])
async def get_topics(class_id: Optional[str] = None):
    query = {"class_id": class_id} if class_id else {}
    topics = await db.topics.find(query, {"_id": 0}).sort("order", 1).to_list(1000)
    for topic in topics:
        if isinstance(topic.get('created_at'), str):
            topic['created_at'] = datetime.fromisoformat(topic['created_at'])
    return [Topic(**topic) for topic in topics]

@api_router.get("/topics/{topic_id}", response_model=Topic)
async def get_topic(topic_id: str):
    topic = await db.topics.find_one({"id": topic_id}, {"_id": 0})
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    if isinstance(topic.get('created_at'), str):
        topic['created_at'] = datetime.fromisoformat(topic['created_at'])
    return Topic(**topic)

@api_router.post("/topics", response_model=Topic)
async def create_topic(topic_data: TopicCreate, current_user: User = Depends(get_current_user)):
    topic = Topic(**topic_data.model_dump())
    topic_dict = topic.model_dump()
    topic_dict['created_at'] = topic_dict['created_at'].isoformat()
    await db.topics.insert_one(topic_dict)
    return topic

# =============== LESSONS ENDPOINTS ===============

@api_router.get("/lessons", response_model=List[Lesson])
async def get_lessons(topic_id: Optional[str] = None):
    query = {"topic_id": topic_id} if topic_id else {}
    lessons = await db.lessons.find(query, {"_id": 0}).sort("lesson_number", 1).to_list(1000)
    for lesson in lessons:
        if isinstance(lesson.get('created_at'), str):
            lesson['created_at'] = datetime.fromisoformat(lesson['created_at'])
        if isinstance(lesson.get('updated_at'), str):
            lesson['updated_at'] = datetime.fromisoformat(lesson['updated_at'])
    return [Lesson(**lesson) for lesson in lessons]

@api_router.get("/lessons/{lesson_id}", response_model=Lesson)
async def get_lesson(lesson_id: str):
    lesson = await db.lessons.find_one({"id": lesson_id}, {"_id": 0})
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    if isinstance(lesson.get('created_at'), str):
        lesson['created_at'] = datetime.fromisoformat(lesson['created_at'])
    if isinstance(lesson.get('updated_at'), str):
        lesson['updated_at'] = datetime.fromisoformat(lesson['updated_at'])
    return Lesson(**lesson)

@api_router.post("/lessons", response_model=Lesson)
async def create_lesson(lesson_data: LessonCreate, current_user: User = Depends(get_current_user)):
    lesson = Lesson(
        topic_id=lesson_data.topic_id,
        title=lesson_data.title,
        lesson_number=lesson_data.lesson_number,
        description=lesson_data.description,
        page_reference=lesson_data.page_reference,
        homework=lesson_data.homework,
        materials=[Material(**m.model_dump()) for m in lesson_data.materials],
        images=[LessonImage(**img.model_dump()) for img in lesson_data.images]
    )
    lesson_dict = lesson.model_dump()
    lesson_dict['created_at'] = lesson_dict['created_at'].isoformat()
    lesson_dict['updated_at'] = lesson_dict['updated_at'].isoformat()
    await db.lessons.insert_one(lesson_dict)
    return lesson

@api_router.put("/lessons/{lesson_id}", response_model=Lesson)
async def update_lesson(lesson_id: str, lesson_data: LessonUpdate, current_user: User = Depends(get_current_user)):
    lesson = await db.lessons.find_one({"id": lesson_id}, {"_id": 0})
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    update_data = {k: v for k, v in lesson_data.model_dump().items() if v is not None}
    if 'materials' in update_data and lesson_data.materials is not None:
        update_data['materials'] = [
            Material(**m.model_dump()).model_dump() if hasattr(m, 'model_dump') 
            else Material(**m).model_dump() 
            for m in lesson_data.materials
        ]
    if 'images' in update_data and lesson_data.images is not None:
        update_data['images'] = [
            LessonImage(**img.model_dump()).model_dump() if hasattr(img, 'model_dump')
            else LessonImage(**img).model_dump()
            for img in lesson_data.images
        ]
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.lessons.update_one({"id": lesson_id}, {"$set": update_data})
    
    updated_lesson = await db.lessons.find_one({"id": lesson_id}, {"_id": 0})
    if isinstance(updated_lesson.get('created_at'), str):
        updated_lesson['created_at'] = datetime.fromisoformat(updated_lesson['created_at'])
    if isinstance(updated_lesson.get('updated_at'), str):
        updated_lesson['updated_at'] = datetime.fromisoformat(updated_lesson['updated_at'])
    return Lesson(**updated_lesson)

@api_router.delete("/lessons/{lesson_id}")
async def delete_lesson(lesson_id: str, current_user: User = Depends(get_current_user)):
    result = await db.lessons.delete_one({"id": lesson_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return {"message": "Lesson deleted successfully"}

# =============== SEARCH ENDPOINT ===============

@api_router.get("/search")
async def search_lessons(q: str):
    if not q or len(q) < 2:
        return []
    
    # Search in lessons
    lessons = await db.lessons.find(
        {"$or": [
            {"title": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}}
        ]},
        {"_id": 0}
    ).limit(20).to_list(20)
    
    # Get related topics and classes for context
    results = []
    for lesson in lessons:
        topic = await db.topics.find_one({"id": lesson['topic_id']}, {"_id": 0})
        if topic:
            cls = await db.classes.find_one({"id": topic['class_id']}, {"_id": 0})
            results.append({
                "lesson_id": lesson['id'],
                "lesson_title": lesson['title'],
                "lesson_number": lesson['lesson_number'],
                "topic_title": topic['title'],
                "grade": cls['grade'] if cls else None,
                "page_reference": lesson.get('page_reference')
            })
    
    return results

# =============== POSTS ENDPOINTS ===============

@api_router.get("/posts", response_model=List[Post])
async def get_posts(category: Optional[str] = None):
    query = {"category": category} if category else {}
    posts = await db.posts.find(query, {"_id": 0}).sort([("is_pinned", -1), ("created_at", -1)]).to_list(1000)
    for post in posts:
        if isinstance(post.get('created_at'), str):
            post['created_at'] = datetime.fromisoformat(post['created_at'])
        if isinstance(post.get('updated_at'), str):
            post['updated_at'] = datetime.fromisoformat(post['updated_at'])
    return [Post(**post) for post in posts]

@api_router.get("/posts/{post_id}", response_model=Post)
async def get_post(post_id: str):
    post = await db.posts.find_one({"id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if isinstance(post.get('created_at'), str):
        post['created_at'] = datetime.fromisoformat(post['created_at'])
    if isinstance(post.get('updated_at'), str):
        post['updated_at'] = datetime.fromisoformat(post['updated_at'])
    return Post(**post)

@api_router.post("/posts", response_model=Post)
async def create_post(post_data: PostCreate, current_user: User = Depends(get_current_user)):
    post = Post(**post_data.model_dump())
    post_dict = post.model_dump()
    post_dict['created_at'] = post_dict['created_at'].isoformat()
    post_dict['updated_at'] = post_dict['updated_at'].isoformat()
    await db.posts.insert_one(post_dict)
    return post

@api_router.put("/posts/{post_id}", response_model=Post)
async def update_post(post_id: str, post_data: PostUpdate, current_user: User = Depends(get_current_user)):
    post = await db.posts.find_one({"id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    update_data = {k: v for k, v in post_data.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.posts.update_one({"id": post_id}, {"$set": update_data})
    
    updated_post = await db.posts.find_one({"id": post_id}, {"_id": 0})
    if isinstance(updated_post.get('created_at'), str):
        updated_post['created_at'] = datetime.fromisoformat(updated_post['created_at'])
    if isinstance(updated_post.get('updated_at'), str):
        updated_post['updated_at'] = datetime.fromisoformat(updated_post['updated_at'])
    return Post(**updated_post)

@api_router.delete("/posts/{post_id}")
async def delete_post(post_id: str, current_user: User = Depends(get_current_user)):
    result = await db.posts.delete_one({"id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"message": "Post deleted successfully"}

# =============== ROOT ENDPOINT ===============

@api_router.get("/")
async def root():
    return {"message": "Цифрова Освіта API", "version": "1.0.0"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

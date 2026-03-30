// Utility for managing student progress in localStorage

const STORAGE_KEY = 'cifrovaOsvita_progress';

export const progressManager = {
  // Get all progress data
  getProgress: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : { lessons: {} };
    } catch (error) {
      console.error('Error reading progress:', error);
      return { lessons: {} };
    }
  },

  // Mark lesson as completed
  markLessonCompleted: (lessonId) => {
    try {
      const progress = progressManager.getProgress();
      progress.lessons[lessonId] = {
        completed: true,
        completedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      return true;
    } catch (error) {
      console.error('Error saving progress:', error);
      return false;
    }
  },

  // Unmark lesson as completed
  unmarkLessonCompleted: (lessonId) => {
    try {
      const progress = progressManager.getProgress();
      if (progress.lessons[lessonId]) {
        delete progress.lessons[lessonId];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      }
      return true;
    } catch (error) {
      console.error('Error removing progress:', error);
      return false;
    }
  },

  // Check if lesson is completed
  isLessonCompleted: (lessonId) => {
    const progress = progressManager.getProgress();
    return !!progress.lessons[lessonId]?.completed;
  },

  // Get completed lessons count for a topic
  getTopicProgress: (lessonIds) => {
    const progress = progressManager.getProgress();
    const completed = lessonIds.filter(id => progress.lessons[id]?.completed).length;
    return {
      completed,
      total: lessonIds.length,
      percentage: lessonIds.length > 0 ? Math.round((completed / lessonIds.length) * 100) : 0
    };
  },

  // Get all completed lessons
  getCompletedLessons: () => {
    const progress = progressManager.getProgress();
    return Object.keys(progress.lessons).filter(id => progress.lessons[id].completed);
  },

  // Clear all progress
  clearProgress: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing progress:', error);
      return false;
    }
  }
};

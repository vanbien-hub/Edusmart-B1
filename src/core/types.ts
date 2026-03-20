export type Role = 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: Role;
  avatar?: string;
  dateOfBirth?: string;
  parentPhone?: string;
  classId?: string;
  gender?: 'male' | 'female';
  status?: 'active' | 'inactive';
}

export interface Class {
  id: string;
  name: string;
  teacherId: string;
  studentIds: string[];
  academicYear?: string;
  joinCode?: string;
}

export interface Subject {
  id: string;
  name: string;
  description?: string;
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  order: number;
}

export interface Chapter {
  id: string;
  topicId: string;
  name: string;
  order: number;
}

export interface Lesson {
  id: string;
  chapterId: string;
  classId?: string;
  title: string;
  content: string;
  videoUrl?: string;
  documentUrl?: string;
  order: number;
  status: 'draft' | 'published';
  courseStatus?: string;
  duration?: string;
  mediaType?: string;
}

export interface Assignment {
  id: string;
  lessonId?: string;
  classId?: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  type: 'text' | 'file' | 'quiz';
  rubric?: string;
  questionIds?: string[];
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  content?: string;
  fileUrl?: string;
  submittedAt: string;
  score?: number;
  feedback?: string;
}

export interface Progress {
  id: string;
  studentId: string;
  lessonId: string;
  completed: boolean;
  completedAt?: string;
}

export type QuestionType = 'multiple_choice' | 'short_answer' | 'true_false' | 'fill_blank' | 'ordering';

export interface Question {
  id: string;
  subjectId: string;
  chapterId?: string;
  type: QuestionType;
  content: string;
  options?: string[]; // For multiple choice, ordering
  correctAnswer: string | string[] | boolean; // Depends on type
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: string;
}

export interface Announcement {
  id: string;
  classId?: string;
  title: string;
  content: string;
  createdAt: string;
  authorId: string;
  target: 'student' | 'parent' | 'all';
}

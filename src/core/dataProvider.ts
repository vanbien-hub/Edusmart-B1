import {
  User, Class, Subject, Topic, Chapter, Lesson, Assignment, Submission, Progress, Announcement, Question
} from './types';

export interface DataProvider {
  // Auth
  login(username: string, password: string): Promise<User | null>;
  getCurrentUser(): Promise<User | null>;
  updateCurrentUser(user: Partial<User>): Promise<User>;
  logout(): Promise<void>;

  // Users
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  getStudentsByClass(classId: string): Promise<User[]>;
  addStudent(student: Omit<User, 'id'>): Promise<User>;
  updateStudent(id: string, student: Partial<User>): Promise<User>;
  deleteStudent(id: string): Promise<void>;
  
  // Classes
  getClasses(): Promise<Class[]>;
  getClass(id: string): Promise<Class | undefined>;
  addClass(cls: Omit<Class, 'id'>): Promise<Class>;
  updateClass(id: string, cls: Partial<Class>): Promise<Class>;
  deleteClass(id: string): Promise<void>;
  
  // Subjects
  getSubjects(): Promise<Subject[]>;
  addSubject(subject: Omit<Subject, 'id'>): Promise<Subject>;
  updateSubject(id: string, subject: Partial<Subject>): Promise<Subject>;
  deleteSubject(id: string): Promise<void>;
  
  // Topics
  getTopics(subjectId?: string): Promise<Topic[]>;
  addTopic(topic: Omit<Topic, 'id'>): Promise<Topic>;
  updateTopic(id: string, topic: Partial<Topic>): Promise<Topic>;
  deleteTopic(id: string): Promise<void>;
  
  // Chapters
  getChapters(topicId?: string): Promise<Chapter[]>;
  addChapter(chapter: Omit<Chapter, 'id'>): Promise<Chapter>;
  updateChapter(id: string, chapter: Partial<Chapter>): Promise<Chapter>;
  deleteChapter(id: string): Promise<void>;
  
  // Lessons
  getLessons(chapterId?: string, classId?: string, status?: 'draft' | 'published'): Promise<Lesson[]>;
  getLesson(id: string): Promise<Lesson | undefined>;
  addLesson(lesson: Omit<Lesson, 'id'>): Promise<Lesson>;
  updateLesson(id: string, lesson: Partial<Lesson>): Promise<Lesson>;
  deleteLesson(id: string): Promise<void>;
  
  // Assignments
  getAssignments(classId?: string): Promise<Assignment[]>;
  getAssignment(id: string): Promise<Assignment | undefined>;
  addAssignment(assignment: Omit<Assignment, 'id'>): Promise<Assignment>;
  updateAssignment(id: string, assignment: Partial<Assignment>): Promise<Assignment>;
  deleteAssignment(id: string): Promise<void>;
  
  // Submissions
  getSubmissions(assignmentId?: string, studentId?: string): Promise<Submission[]>;
  submitAssignment(submission: Omit<Submission, 'id' | 'submittedAt'>): Promise<Submission>;
  gradeSubmission(submissionId: string, score: number, feedback?: string): Promise<Submission>;
  
  // Progress
  getProgress(studentId: string): Promise<Progress[]>;
  updateProgress(studentId: string, lessonId: string, completed: boolean): Promise<Progress>;
  
  // Announcements
  getAnnouncements(classId?: string, target?: 'student' | 'parent' | 'all'): Promise<Announcement[]>;
  addAnnouncement(announcement: Omit<Announcement, 'id' | 'createdAt'>): Promise<Announcement>;
  deleteAnnouncement(id: string): Promise<void>;
  
  // Questions
  getQuestions(subjectId?: string, chapterId?: string): Promise<Question[]>;
  getQuestion(id: string): Promise<Question | undefined>;
  addQuestion(question: Omit<Question, 'id' | 'createdAt'>): Promise<Question>;
  updateQuestion(id: string, question: Partial<Question>): Promise<Question>;
  deleteQuestion(id: string): Promise<void>;
  addQuestionsBulk(questions: Omit<Question, 'id' | 'createdAt'>[]): Promise<Question[]>;
  
  // Reports
  getStudentReport(studentId: string): Promise<any>;
  getClassReport(classId: string): Promise<any>;
}

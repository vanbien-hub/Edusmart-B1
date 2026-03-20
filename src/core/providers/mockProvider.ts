import { DataProvider } from '../dataProvider';
import {
  User, Class, Subject, Topic, Chapter, Lesson, Assignment, Submission, Progress, Announcement, Question
} from '../types';

const STORAGE_KEY = 'lms_mock_data_v2';

interface MockData {
  users: User[];
  classes: Class[];
  subjects: Subject[];
  topics: Topic[];
  chapters: Chapter[];
  lessons: Lesson[];
  assignments: Assignment[];
  submissions: Submission[];
  progress: Progress[];
  announcements: Announcement[];
  questions: Question[];
}

const initialData: MockData = {
  users: [
    { id: 't1', name: 'Nguyễn Văn A', username: 'hvbien', password: '123', role: 'teacher' },
    { id: 's1', name: 'Trần Thị B', username: 'hocsinh', password: '123', role: 'student', classId: 'c1', dateOfBirth: '2008-05-12', parentPhone: '0901234567' },
    { id: 's2', name: 'Lê Văn C', username: 'levanc', password: '123', role: 'student', classId: 'c1', dateOfBirth: '2008-08-20', parentPhone: '0909876543' },
  ],
  classes: [
    { id: 'c1', name: '10A1', teacherId: 't1', studentIds: ['s1', 's2'], academicYear: '2023-2024', joinCode: '10A1-BIO' },
  ],
  subjects: [
    { id: 'sub1', name: 'Sinh học 10 - Kết nối tri thức', description: 'Môn Sinh học lớp 10 bộ sách Kết nối tri thức với cuộc sống' },
  ],
  topics: [
    { id: 'top1', subjectId: 'sub1', name: 'Phần 1: Giới thiệu chung về thế giới sống', order: 1 },
    { id: 'top2', subjectId: 'sub1', name: 'Phần 2: Sinh học tế bào', order: 2 },
    { id: 'top3', subjectId: 'sub1', name: 'Phần 3: Sinh học vi sinh vật và virus', order: 3 },
  ],
  chapters: [
    { id: 'chap1', topicId: 'top1', name: 'Chương 1: Mở đầu', order: 1 },
    { id: 'chap2', topicId: 'top2', name: 'Chương 1: Thành phần hoá học của tế bào', order: 1 },
    { id: 'chap3', topicId: 'top2', name: 'Chương 2: Cấu trúc tế bào', order: 2 },
  ],
  lessons: [
    { id: 'les1', chapterId: 'chap1', classId: 'c1', title: 'Bài 1: Giới thiệu khái quát môn Sinh học', content: '<p>Nội dung bài 1...</p>', order: 1, status: 'published' },
    { id: 'les2', chapterId: 'chap1', classId: 'c1', title: 'Bài 2: Các giới sinh vật', content: '<p>Nội dung bài 2...</p>', order: 2, status: 'published' },
    { id: 'les3', chapterId: 'chap2', classId: 'c1', title: 'Bài 3: Các nguyên tố hóa học và nước', content: '<p>Nội dung bài 3...</p>', order: 1, status: 'draft' },
    { id: 'les4', chapterId: 'chap2', classId: 'c1', title: 'Bài 4: Cacbohidrat và lipit', content: '<p>Nội dung bài 4...</p>', order: 2, status: 'draft' },
    { id: 'les5', chapterId: 'chap2', classId: 'c1', title: 'Bài 5: Các phân tử sinh học', content: '<p>Nội dung bài 5...</p>', order: 3, status: 'draft' },
  ],
  assignments: [
    { id: 'ass1', lessonId: 'les1', classId: 'c1', title: 'Bài tập trắc nghiệm Bài 1', description: 'Hoàn thành 10 câu hỏi trắc nghiệm.', dueDate: new Date(Date.now() + 86400000 * 7).toISOString(), maxScore: 10, type: 'text', rubric: 'Mỗi câu đúng 1 điểm' },
    { id: 'ass2', classId: 'c1', title: 'Báo cáo thực hành quan sát tế bào', description: 'Nộp file báo cáo thực hành định dạng PDF.', dueDate: new Date(Date.now() - 86400000).toISOString(), maxScore: 10, type: 'file', rubric: 'Trình bày: 2đ, Nội dung: 6đ, Kết luận: 2đ' },
  ],
  submissions: [
    { id: 'sub1', assignmentId: 'ass2', studentId: 's1', fileUrl: 'https://example.com/baocao.pdf', submittedAt: new Date(Date.now() - 172800000).toISOString(), score: 8.5, feedback: 'Bài làm tốt, cần chú ý phần kết luận.' }
  ],
  progress: [],
  announcements: [
    { id: 'ann1', classId: 'c1', title: 'Chào mừng năm học mới', content: 'Chúc các em học tốt môn Sinh học 10!', createdAt: new Date().toISOString(), authorId: 't1', target: 'all' },
    { id: 'ann2', classId: 'c1', title: 'Họp phụ huynh đầu năm', content: 'Kính mời quý phụ huynh tham gia buổi họp đầu năm vào Chủ nhật tuần này.', createdAt: new Date(Date.now() - 86400000).toISOString(), authorId: 't1', target: 'parent' },
  ],
  questions: [
    {
      id: 'q1',
      subjectId: 'sub1',
      chapterId: 'chap1',
      type: 'multiple_choice',
      content: 'Đơn vị tổ chức cơ sở của mọi sinh vật là gì?',
      options: ['Mô', 'Tế bào', 'Cơ quan', 'Hệ cơ quan'],
      correctAnswer: 'Tế bào',
      difficulty: 'easy',
      createdAt: new Date().toISOString()
    },
    {
      id: 'q2',
      subjectId: 'sub1',
      chapterId: 'chap2',
      type: 'true_false',
      content: 'Nước là dung môi hòa tan nhiều chất trong cơ thể sống.',
      correctAnswer: true,
      difficulty: 'easy',
      createdAt: new Date().toISOString()
    }
  ]
};

export const seedData = () => {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
  }
};

const getData = (): MockData => {
  seedData();
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  const parsedData = {
    users: data.users || [],
    classes: data.classes || [],
    subjects: data.subjects || [],
    topics: data.topics || [],
    chapters: data.chapters || [],
    lessons: data.lessons || [],
    assignments: data.assignments || [],
    submissions: data.submissions || [],
    progress: data.progress || [],
    announcements: data.announcements || [],
    questions: data.questions || []
  };

  // Self-healing: ensure classes.studentIds matches users.classId
  let needsSave = false;
  parsedData.classes.forEach(cls => {
    const actualStudents = parsedData.users
      .filter(u => u.role === 'student' && u.classId === cls.id)
      .map(u => u.id);
    
    // Check if arrays have same elements
    const currentSorted = [...(cls.studentIds || [])].sort();
    const actualSorted = [...actualStudents].sort();
    
    if (JSON.stringify(currentSorted) !== JSON.stringify(actualSorted)) {
      cls.studentIds = actualStudents;
      needsSave = true;
    } else if (!cls.studentIds) {
      cls.studentIds = [];
      needsSave = true;
    }
  });

  if (needsSave) {
    saveData(parsedData);
  }

  return parsedData;
};

const saveData = (data: MockData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const mockProvider: DataProvider = {
  // Auth
  async login(username, password) {
    const users = getData().users;
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      return user;
    }
    return null;
  },
  async getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  },
  async updateCurrentUser(updates) {
    const data = getData();
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) throw new Error('Not logged in');
    
    const currentUser = JSON.parse(userStr);
    const index = data.users.findIndex(u => u.id === currentUser.id);
    
    if (index > -1) {
      data.users[index] = { ...data.users[index], ...updates };
      saveData(data);
      localStorage.setItem('currentUser', JSON.stringify(data.users[index]));
      return data.users[index];
    }
    throw new Error('User not found');
  },
  async logout() {
    localStorage.removeItem('currentUser');
  },

  async getUsers() { return getData().users; },
  async getUser(id) { return getData().users.find(u => u.id === id); },
  async getStudentsByClass(classId) { return getData().users.filter(u => u.role === 'student' && u.classId === classId); },
  async addStudent(student) {
    const data = getData();
    const newStudent = { ...student, id: `s_${Date.now()}`, role: 'student' as const };
    data.users.push(newStudent);
    if (student.classId) {
      const cls = data.classes.find(c => c.id === student.classId);
      if (cls && !cls.studentIds.includes(newStudent.id)) {
        cls.studentIds.push(newStudent.id);
      }
    }
    saveData(data);
    return newStudent;
  },
  async updateStudent(id, student) {
    const data = getData();
    const index = data.users.findIndex(u => u.id === id);
    if (index > -1) {
      const oldStudent = data.users[index];
      const oldClassId = oldStudent.classId;
      
      data.users[index] = { ...oldStudent, ...student };
      
      if (student.classId !== undefined && oldClassId !== student.classId) {
        if (oldClassId) {
          const oldClass = data.classes.find(c => c.id === oldClassId);
          if (oldClass) {
            oldClass.studentIds = oldClass.studentIds.filter(sid => sid !== id);
          }
        }
        if (student.classId) {
          const newClass = data.classes.find(c => c.id === student.classId);
          if (newClass && !newClass.studentIds.includes(id)) {
            newClass.studentIds.push(id);
          }
        }
      }
      
      saveData(data);
      return data.users[index];
    }
    throw new Error('Student not found');
  },
  async deleteStudent(id) {
    const data = getData();
    data.users = data.users.filter(u => u.id !== id);
    data.classes.forEach(c => {
      c.studentIds = c.studentIds.filter(sid => sid !== id);
    });
    saveData(data);
  },
  
  async getClasses() { return getData().classes; },
  async getClass(id) { return getData().classes.find(c => c.id === id); },
  async addClass(cls) {
    const data = getData();
    const newClass = { ...cls, id: `c_${Date.now()}`, studentIds: [] };
    data.classes.push(newClass);
    saveData(data);
    return newClass;
  },
  async updateClass(id, cls) {
    const data = getData();
    const index = data.classes.findIndex(c => c.id === id);
    if (index > -1) {
      data.classes[index] = { ...data.classes[index], ...cls };
      saveData(data);
      return data.classes[index];
    }
    throw new Error('Class not found');
  },
  async deleteClass(id) {
    const data = getData();
    data.classes = data.classes.filter(c => c.id !== id);
    data.users.forEach(u => {
      if (u.classId === id) u.classId = undefined;
    });
    saveData(data);
  },
  
  async getSubjects() { return getData().subjects; },
  async addSubject(subject) {
    const data = getData();
    const newSubject = { ...subject, id: `sub_${Date.now()}` };
    data.subjects.push(newSubject);
    saveData(data);
    return newSubject;
  },
  async updateSubject(id, subject) {
    const data = getData();
    const index = data.subjects.findIndex(s => s.id === id);
    if (index > -1) {
      data.subjects[index] = { ...data.subjects[index], ...subject };
      saveData(data);
      return data.subjects[index];
    }
    throw new Error('Subject not found');
  },
  async deleteSubject(id) {
    const data = getData();
    data.subjects = data.subjects.filter(s => s.id !== id);
    data.topics = data.topics.filter(t => t.subjectId !== id);
    saveData(data);
  },
  
  async getTopics(subjectId) { 
    let topics = getData().topics;
    if (subjectId) topics = topics.filter(t => t.subjectId === subjectId);
    return topics.sort((a, b) => a.order - b.order); 
  },
  async addTopic(topic) {
    const data = getData();
    const newTopic = { ...topic, id: `top_${Date.now()}` };
    data.topics.push(newTopic);
    saveData(data);
    return newTopic;
  },
  async updateTopic(id, topic) {
    const data = getData();
    const index = data.topics.findIndex(t => t.id === id);
    if (index > -1) {
      data.topics[index] = { ...data.topics[index], ...topic };
      saveData(data);
      return data.topics[index];
    }
    throw new Error('Topic not found');
  },
  async deleteTopic(id) {
    const data = getData();
    data.topics = data.topics.filter(t => t.id !== id);
    data.chapters = data.chapters.filter(c => c.topicId !== id);
    saveData(data);
  },
  
  async getChapters(topicId) { 
    let chapters = getData().chapters;
    if (topicId) chapters = chapters.filter(c => c.topicId === topicId);
    return chapters.sort((a, b) => a.order - b.order); 
  },
  async addChapter(chapter) {
    const data = getData();
    const newChapter = { ...chapter, id: `chap_${Date.now()}` };
    data.chapters.push(newChapter);
    saveData(data);
    return newChapter;
  },
  async updateChapter(id, chapter) {
    const data = getData();
    const index = data.chapters.findIndex(c => c.id === id);
    if (index > -1) {
      data.chapters[index] = { ...data.chapters[index], ...chapter };
      saveData(data);
      return data.chapters[index];
    }
    throw new Error('Chapter not found');
  },
  async deleteChapter(id) {
    const data = getData();
    data.chapters = data.chapters.filter(c => c.id !== id);
    data.lessons = data.lessons.filter(l => l.chapterId !== id);
    saveData(data);
  },
  
  async getLessons(chapterId, classId, status) {
    let lessons = getData().lessons;
    if (chapterId) lessons = lessons.filter(l => l.chapterId === chapterId);
    if (classId) lessons = lessons.filter(l => l.classId === classId);
    if (status) lessons = lessons.filter(l => l.status === status);
    return lessons.sort((a, b) => a.order - b.order);
  },
  async getLesson(id) { return getData().lessons.find(l => l.id === id); },
  async addLesson(lesson) {
    const data = getData();
    const newLesson = { ...lesson, id: `les_${Date.now()}` };
    data.lessons.push(newLesson);
    saveData(data);
    return newLesson;
  },
  async updateLesson(id, lesson) {
    const data = getData();
    const index = data.lessons.findIndex(l => l.id === id);
    if (index > -1) {
      data.lessons[index] = { ...data.lessons[index], ...lesson };
      saveData(data);
      return data.lessons[index];
    }
    throw new Error('Lesson not found');
  },
  async deleteLesson(id) {
    const data = getData();
    data.lessons = data.lessons.filter(l => l.id !== id);
    saveData(data);
  },
  
  async getAssignments(classId) {
    let assignments = getData().assignments;
    if (classId) assignments = assignments.filter(a => a.classId === classId || !a.classId);
    return assignments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  },
  async getAssignment(id) { return getData().assignments.find(a => a.id === id); },
  async addAssignment(assignment) {
    const data = getData();
    const newAssignment = { ...assignment, id: `ass_${Date.now()}` };
    data.assignments.push(newAssignment);
    saveData(data);
    return newAssignment;
  },
  async updateAssignment(id, assignment) {
    const data = getData();
    const index = data.assignments.findIndex(a => a.id === id);
    if (index > -1) {
      data.assignments[index] = { ...data.assignments[index], ...assignment };
      saveData(data);
      return data.assignments[index];
    }
    throw new Error('Assignment not found');
  },
  async deleteAssignment(id) {
    const data = getData();
    data.assignments = data.assignments.filter(a => a.id !== id);
    data.submissions = data.submissions.filter(s => s.assignmentId !== id);
    saveData(data);
  },
  
  async getSubmissions(assignmentId, studentId) {
    let submissions = getData().submissions;
    if (assignmentId) submissions = submissions.filter(s => s.assignmentId === assignmentId);
    if (studentId) submissions = submissions.filter(s => s.studentId === studentId);
    return submissions;
  },
  
  async submitAssignment(submission) {
    const data = getData();
    // Check if already submitted
    const existingIndex = data.submissions.findIndex(s => s.assignmentId === submission.assignmentId && s.studentId === submission.studentId);
    
    if (existingIndex > -1) {
      data.submissions[existingIndex] = {
        ...data.submissions[existingIndex],
        ...submission,
        submittedAt: new Date().toISOString()
      };
      saveData(data);
      return data.submissions[existingIndex];
    } else {
      const newSubmission: Submission = {
        ...submission,
        id: `sub_${Date.now()}`,
        submittedAt: new Date().toISOString(),
      };
      data.submissions.push(newSubmission);
      saveData(data);
      return newSubmission;
    }
  },
  
  async gradeSubmission(submissionId, score, feedback) {
    const data = getData();
    const subIndex = data.submissions.findIndex(s => s.id === submissionId);
    if (subIndex > -1) {
      data.submissions[subIndex] = { ...data.submissions[subIndex], score, feedback };
      saveData(data);
      return data.submissions[subIndex];
    }
    throw new Error('Submission not found');
  },
  
  async getProgress(studentId) { return getData().progress.filter(p => p.studentId === studentId); },
  
  async updateProgress(studentId, lessonId, completed) {
    const data = getData();
    let prog = data.progress.find(p => p.studentId === studentId && p.lessonId === lessonId);
    if (prog) {
      prog.completed = completed;
      prog.completedAt = completed ? new Date().toISOString() : undefined;
    } else {
      prog = {
        id: `prog_${Date.now()}`,
        studentId,
        lessonId,
        completed,
        completedAt: completed ? new Date().toISOString() : undefined,
      };
      data.progress.push(prog);
    }
    saveData(data);
    return prog;
  },
  
  async getAnnouncements(classId, target) {
    let anns = getData().announcements;
    if (classId) anns = anns.filter(a => a.classId === classId || !a.classId);
    if (target) anns = anns.filter(a => a.target === target || a.target === 'all');
    return anns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  async addAnnouncement(announcement) {
    const data = getData();
    const newAnn: Announcement = {
      ...announcement,
      id: `ann_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    data.announcements.push(newAnn);
    saveData(data);
    return newAnn;
  },
  async deleteAnnouncement(id) {
    const data = getData();
    data.announcements = data.announcements.filter(a => a.id !== id);
    saveData(data);
  },
  
  // Questions
  async getQuestions(subjectId, chapterId) {
    let questions = getData().questions || [];
    if (subjectId) questions = questions.filter(q => q.subjectId === subjectId);
    if (chapterId) questions = questions.filter(q => q.chapterId === chapterId);
    return questions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  async getQuestion(id) {
    return (getData().questions || []).find(q => q.id === id);
  },
  async addQuestion(question) {
    const data = getData();
    if (!data.questions) data.questions = [];
    const newQuestion: Question = {
      ...question,
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    data.questions.push(newQuestion);
    saveData(data);
    return newQuestion;
  },
  async updateQuestion(id, question) {
    const data = getData();
    if (!data.questions) data.questions = [];
    const index = data.questions.findIndex(q => q.id === id);
    if (index > -1) {
      data.questions[index] = { ...data.questions[index], ...question };
      saveData(data);
      return data.questions[index];
    }
    throw new Error('Question not found');
  },
  async deleteQuestion(id) {
    const data = getData();
    if (!data.questions) data.questions = [];
    data.questions = data.questions.filter(q => q.id !== id);
    saveData(data);
  },
  async addQuestionsBulk(questions) {
    const data = getData();
    if (!data.questions) data.questions = [];
    const newQuestions = questions.map(q => ({
      ...q,
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    }));
    data.questions = [...data.questions, ...newQuestions];
    saveData(data);
    return newQuestions;
  },
  
  async getStudentReport(studentId) { return { studentId, status: 'Tốt' }; },
  async getClassReport(classId) { return { classId, averageScore: 8.5 }; },
};

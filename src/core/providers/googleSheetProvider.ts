import { DataProvider } from '../dataProvider';
import {
  User, Class, Subject, Topic, Chapter, Lesson, Assignment, Submission, Progress, Announcement, Question
} from '../types';

const API_URL = 'https://script.google.com/macros/s/AKfycbyFLFLI0cfEsVgZrDpMzUwFftv7jPTzx52Sn9kihUk-F-7OpNJ0ZQ4Gx-Ofywq9sGPsWQ/exec';

async function fetchFromSheet(action: string, payload: any = {}) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8", 
      },
      body: JSON.stringify({ action, payload })
    });
    
    const result = await response.json();
    if (!result.ok) throw new Error(result.error);
    
    return result.data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

export const googleSheetProvider: DataProvider = {
  // Auth
  async login(username, password) {
    const users = await fetchFromSheet("Users.list", { username, password });
    if (users && users.length > 0) {
      const user = users[0];
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
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) throw new Error('Not logged in');
    
    const currentUser = JSON.parse(userStr);
    const updatedUser = await fetchFromSheet("Users.update", { id: currentUser.id, ...updates });
    
    const newUser = { ...currentUser, ...updatedUser };
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    return newUser;
  },
  async logout() {
    localStorage.removeItem('currentUser');
  },

  // Users
  async getUsers() { return await fetchFromSheet("Users.list"); },
  async getUser(id) { return await fetchFromSheet("Users.get", { id }); },
  async getStudentsByClass(classId) { return await fetchFromSheet("Users.list", { role: 'student', classId }); },
  async addStudent(student) {
    return await fetchFromSheet("Users.create", { ...student, role: 'student' });
  },
  async updateStudent(id, student) {
    return await fetchFromSheet("Users.update", { id, ...student });
  },
  async deleteStudent(id) {
    await fetchFromSheet("Users.delete", { id });
  },
  
  // Classes
  async getClasses() { return await fetchFromSheet("Classes.list"); },
  async getClass(id) { return await fetchFromSheet("Classes.get", { id }); },
  async addClass(cls) {
    return await fetchFromSheet("Classes.create", cls);
  },
  async updateClass(id, cls) {
    return await fetchFromSheet("Classes.update", { id, ...cls });
  },
  async deleteClass(id) {
    await fetchFromSheet("Classes.delete", { id });
  },
  
  // Subjects
  async getSubjects() { return await fetchFromSheet("Subjects.list"); },
  async addSubject(subject) {
    return await fetchFromSheet("Subjects.create", subject);
  },
  async updateSubject(id, subject) {
    return await fetchFromSheet("Subjects.update", { id, ...subject });
  },
  async deleteSubject(id) {
    await fetchFromSheet("Subjects.delete", { id });
  },
  
  // Topics
  async getTopics(subjectId) { 
    let payload = subjectId ? { subjectId } : {};
    let topics = await fetchFromSheet("Topics.list", payload);
    return topics.sort((a: any, b: any) => a.order - b.order); 
  },
  async addTopic(topic) {
    return await fetchFromSheet("Topics.create", topic);
  },
  async updateTopic(id, topic) {
    return await fetchFromSheet("Topics.update", { id, ...topic });
  },
  async deleteTopic(id) {
    await fetchFromSheet("Topics.delete", { id });
  },
  
  // Chapters
  async getChapters(topicId) { 
    let payload = topicId ? { topicId } : {};
    let chapters = await fetchFromSheet("Chapters.list", payload);
    return chapters.sort((a: any, b: any) => a.order - b.order); 
  },
  async addChapter(chapter) {
    return await fetchFromSheet("Chapters.create", chapter);
  },
  async updateChapter(id, chapter) {
    return await fetchFromSheet("Chapters.update", { id, ...chapter });
  },
  async deleteChapter(id) {
    await fetchFromSheet("Chapters.delete", { id });
  },
  
  // Lessons
  async getLessons(chapterId, classId, status) {
    let payload: any = {};
    if (chapterId) payload.chapterId = chapterId;
    if (classId) payload.classId = classId;
    if (status) payload.status = status;
    let lessons = await fetchFromSheet("Lessons.list", payload);
    return lessons.sort((a: any, b: any) => a.order - b.order);
  },
  async getLesson(id) { return await fetchFromSheet("Lessons.get", { id }); },
  async addLesson(lesson) {
    return await fetchFromSheet("Lessons.create", lesson);
  },
  async updateLesson(id, lesson) {
    return await fetchFromSheet("Lessons.update", { id, ...lesson });
  },
  async deleteLesson(id) {
    await fetchFromSheet("Lessons.delete", { id });
  },
  
  // Assignments
  async getAssignments(classId) {
    let assignments = await fetchFromSheet("Assignments.list");
    if (classId) assignments = assignments.filter((a: any) => a.classId === classId || !a.classId);
    return assignments.sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  },
  async getAssignment(id) { return await fetchFromSheet("Assignments.get", { id }); },
  async addAssignment(assignment) {
    return await fetchFromSheet("Assignments.create", assignment);
  },
  async updateAssignment(id, assignment) {
    return await fetchFromSheet("Assignments.update", { id, ...assignment });
  },
  async deleteAssignment(id) {
    await fetchFromSheet("Assignments.delete", { id });
  },
  
  // Submissions
  async getSubmissions(assignmentId, studentId) {
    let payload: any = {};
    if (assignmentId) payload.assignmentId = assignmentId;
    if (studentId) payload.studentId = studentId;
    return await fetchFromSheet("Submissions.list", payload);
  },
  
  async submitAssignment(submission) {
    // Check if already submitted
    const existing = await fetchFromSheet("Submissions.list", { 
      assignmentId: submission.assignmentId, 
      studentId: submission.studentId 
    });
    
    if (existing && existing.length > 0) {
      return await fetchFromSheet("Submissions.update", {
        id: existing[0].id,
        ...submission,
        submittedAt: new Date().toISOString()
      });
    } else {
      return await fetchFromSheet("Submissions.create", {
        ...submission,
        submittedAt: new Date().toISOString()
      });
    }
  },
  
  async gradeSubmission(submissionId, score, feedback) {
    return await fetchFromSheet("Submissions.update", { id: submissionId, score, feedback });
  },
  
  // Progress
  async getProgress(studentId) { 
    return await fetchFromSheet("Progress.list", { studentId }); 
  },
  
  async updateProgress(studentId, lessonId, completed) {
    const existing = await fetchFromSheet("Progress.list", { studentId, lessonId });
    if (existing && existing.length > 0) {
      return await fetchFromSheet("Progress.update", {
        id: existing[0].id,
        completed,
        completedAt: completed ? new Date().toISOString() : ""
      });
    } else {
      return await fetchFromSheet("Progress.create", {
        studentId,
        lessonId,
        completed,
        completedAt: completed ? new Date().toISOString() : ""
      });
    }
  },
  
  // Announcements
  async getAnnouncements(classId, target) {
    let anns = await fetchFromSheet("Announcements.list");
    if (classId) anns = anns.filter((a: any) => a.classId === classId || !a.classId);
    if (target) anns = anns.filter((a: any) => a.target === target || a.target === 'all');
    return anns.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  async addAnnouncement(announcement) {
    return await fetchFromSheet("Announcements.create", announcement);
  },
  async deleteAnnouncement(id) {
    await fetchFromSheet("Announcements.delete", { id });
  },
  
  // Questions
  async getQuestions(subjectId, chapterId) {
    let payload: any = {};
    if (subjectId) payload.subjectId = subjectId;
    if (chapterId) payload.chapterId = chapterId;
    let questions = await fetchFromSheet("Questions.list", payload);
    return questions.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  async getQuestion(id) {
    return await fetchFromSheet("Questions.get", { id });
  },
  async addQuestion(question) {
    return await fetchFromSheet("Questions.create", question);
  },
  async updateQuestion(id, question) {
    return await fetchFromSheet("Questions.update", { id, ...question });
  },
  async deleteQuestion(id) {
    await fetchFromSheet("Questions.delete", { id });
  },
  async addQuestionsBulk(questions) {
    // Note: The current GAS script doesn't have a bulk create, so we do it sequentially
    const results = [];
    for (const q of questions) {
      results.push(await fetchFromSheet("Questions.create", q));
    }
    return results;
  },
  
  // Reports
  async getStudentReport(studentId) { return { studentId, status: 'Tốt' }; },
  async getClassReport(classId) { return { classId, averageScore: 8.5 }; },
};

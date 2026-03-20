import React, { useState, useEffect } from 'react';
import { dataProvider } from '../../core/provider';
import { Class, User, Assignment, Submission, Progress, Lesson } from '../../core/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export function Reports() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  
  const [students, setStudents] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadReportData(selectedClassId);
    }
  }, [selectedClassId]);

  const loadClasses = async () => {
    const cls = await dataProvider.getClasses();
    setClasses(cls);
    if (cls.length > 0) {
      setSelectedClassId('all');
    }
  };

  const loadReportData = async (classId: string) => {
    let users: User[] = [];
    if (classId === 'all') {
      const allUsers = await dataProvider.getUsers();
      users = allUsers.filter(u => u.role === 'student');
    } else {
      users = await dataProvider.getStudentsByClass(classId);
    }
    setStudents(users);

    const assigns = await dataProvider.getAssignments(classId === 'all' ? undefined : classId);
    setAssignments(assigns);

    const less = await dataProvider.getLessons(undefined, classId === 'all' ? undefined : classId, 'published');
    const genericLess = await dataProvider.getLessons(undefined, undefined, 'published');
    // Ensure no duplicates
    const allLessons = [...less, ...genericLess.filter(l => !l.classId)];
    const uniqueLessons = Array.from(new Map(allLessons.map(item => [item.id, item])).values());
    setLessons(uniqueLessons);

    let allSubs: Submission[] = [];
    for (const assign of assigns) {
      const subs = await dataProvider.getSubmissions(assign.id);
      allSubs = [...allSubs, ...subs];
    }
    setSubmissions(allSubs);

    let allProg: Progress[] = [];
    for (const user of users) {
      const prog = await dataProvider.getProgress(user.id);
      allProg = [...allProg, ...prog];
    }
    setProgress(allProg);
  };

  // Calculate stats
  const totalLessons = lessons.length;
  const totalAssignments = assignments.length;
  
  // Lesson completion rate
  const completedLessonsCount = progress.filter(p => p.completed).length;
  const expectedCompletions = students.length * totalLessons;
  const completionRate = expectedCompletions > 0 ? Math.round((completedLessonsCount / expectedCompletions) * 100) : 0;

  // Assignment submission rate
  const expectedSubmissions = students.length * totalAssignments;
  const onTimeSubmissions = submissions.filter(s => {
    const assign = assignments.find(a => a.id === s.assignmentId);
    return assign && new Date(s.submittedAt) <= new Date(assign.dueDate);
  }).length;
  const lateSubmissions = submissions.length - onTimeSubmissions;
  const missingSubmissions = expectedSubmissions - submissions.length;

  const submissionPieData = [
    { name: 'Đúng hạn', value: onTimeSubmissions, color: '#10b981' },
    { name: 'Nộp muộn', value: lateSubmissions, color: '#f59e0b' },
    { name: 'Chưa nộp', value: Math.max(0, missingSubmissions), color: '#ef4444' },
  ];

  // At Risk Students and Performance Categorization
  let excellentCount = 0; // Tốt (>= 8.0)
  let goodCount = 0;      // Khá (>= 6.5 and < 8.0)
  let averageCount = 0;   // Đạt (>= 5.0 and < 6.5)
  let poorCount = 0;      // Chưa đạt (< 5.0)

  const atRiskStudents = students.map(student => {
    const studentSubs = submissions.filter(s => s.studentId === student.id);
    
    // Calculate late/missing
    let lateOrMissingCount = 0;
    assignments.forEach(assign => {
      const sub = studentSubs.find(s => s.assignmentId === assign.id);
      if (!sub && new Date() > new Date(assign.dueDate)) {
        lateOrMissingCount++; // Missing and past due
      } else if (sub && new Date(sub.submittedAt) > new Date(assign.dueDate)) {
        lateOrMissingCount++; // Late
      }
    });

    // Calculate average score
    const gradedSubs = studentSubs.filter(s => s.score !== undefined);
    const avgScore = gradedSubs.length > 0 
      ? gradedSubs.reduce((acc, curr) => acc + (curr.score || 0), 0) / gradedSubs.length 
      : null;

    if (avgScore !== null) {
      if (avgScore >= 8.0) excellentCount++;
      else if (avgScore >= 6.5) goodCount++;
      else if (avgScore >= 5.0) averageCount++;
      else poorCount++;
    }

    return {
      ...student,
      lateOrMissingCount,
      avgScore,
      isAtRisk: lateOrMissingCount >= 2 || (avgScore !== null && avgScore < 5.0)
    };
  }).filter(s => s.isAtRisk);

  const performancePieData = [
    { name: 'Tốt (>= 8.0)', value: excellentCount, color: '#10b981' }, // Emerald 500
    { name: 'Khá (6.5 - 7.9)', value: goodCount, color: '#3b82f6' }, // Blue 500
    { name: 'Đạt (5.0 - 6.4)', value: averageCount, color: '#f59e0b' }, // Amber 500
    { name: 'Chưa đạt (< 5.0)', value: poorCount, color: '#ef4444' }, // Red 500
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Báo cáo & Thống kê</h2>
        <select
          className="p-2 border rounded-md outline-none focus:border-emerald-500 bg-white shadow-sm"
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
        >
          <option value="all">Tất cả các lớp</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Tỷ lệ hoàn thành bài giảng</dt>
                  <dd className="text-2xl font-bold text-gray-900">{completionRate}%</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Tỷ lệ nộp bài đúng hạn</dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {expectedSubmissions > 0 ? Math.round((onTimeSubmissions / expectedSubmissions) * 100) : 0}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Học sinh cần hỗ trợ</dt>
                  <dd className="text-2xl font-bold text-gray-900">{atRiskStudents.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tình trạng nộp bài tập</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={submissionPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {submissionPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Phân loại học lực</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={performancePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {performancePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 lg:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Học sinh cần hỗ trợ (At Risk)</h3>
          <div className="overflow-y-auto max-h-64">
            <ul className="divide-y divide-gray-200">
              {atRiskStudents.map(student => (
                <li key={student.id} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">
                        {student.name.charAt(0)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{student.name}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {student.lateOrMissingCount > 0 && <span className="text-red-600 mr-2">Thiếu/Muộn {student.lateOrMissingCount} bài</span>}
                        {student.avgScore !== null && student.avgScore < 5 && <span className="text-orange-600">Điểm TB: {student.avgScore.toFixed(1)}</span>}
                      </p>
                    </div>
                    <div>
                      <button className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50">
                        Liên hệ PH
                      </button>
                    </div>
                  </div>
                </li>
              ))}
              {atRiskStudents.length === 0 && (
                <li className="py-8 text-center text-gray-500">
                  Tuyệt vời! Không có học sinh nào trong diện cần hỗ trợ.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

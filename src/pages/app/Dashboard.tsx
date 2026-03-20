import React, { useEffect, useState } from 'react';
import { dataProvider } from '../../core/provider';
import { Lesson, Assignment, Announcement, Progress, User, Topic, Chapter } from '../../core/types';
import { BookOpen, FileText, CheckCircle, Bell, Clock, Trophy, Award } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export function StudentDashboard() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [leaderboard, setLeaderboard] = useState<{id: string, name: string, rank: number, score: number}[]>([]);
  const [myRankInfo, setMyRankInfo] = useState<{rank: number, score: number} | null>(null);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [certificates, setCertificates] = useState<{id: string, name: string, date: string}[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const currentUser = await dataProvider.getCurrentUser();
      if (!currentUser) return;
      setUser(currentUser);
      
      const studentId = currentUser.id;
      const classId = currentUser.classId;

      // Get published lessons for student's class and general lessons
      const classLessons = await dataProvider.getLessons(undefined, classId, 'published');
      const generalLessons = await dataProvider.getLessons(undefined, undefined, 'published');
      const allLessons = [...classLessons, ...generalLessons.filter(l => !l.classId)];
      
      // Sort by order
      allLessons.sort((a, b) => a.order - b.order);
      setLessons(allLessons);

      const assigns = await dataProvider.getAssignments(classId);
      setAssignments(assigns);

      const prog = await dataProvider.getProgress(studentId);
      setProgress(prog);

      const anns = await dataProvider.getAnnouncements(classId, 'student');
      setAnnouncements(anns);

      // Calculate Rank
      if (classId) {
        const classStudents = await dataProvider.getStudentsByClass(classId);
        setTotalStudents(classStudents.length);
        
        let allSubs: any[] = [];
        for (const a of assigns) {
          const subs = await dataProvider.getSubmissions(a.id);
          allSubs = [...allSubs, ...subs];
        }
        
        const studentAverages = classStudents.map(s => {
          const sSubs = allSubs.filter(sub => sub.studentId === s.id && sub.score !== undefined);
          if (sSubs.length === 0) return { id: s.id, name: s.name, avg: -1 };
          const total = sSubs.reduce((acc, curr) => acc + (curr.score || 0), 0);
          return { id: s.id, name: s.name, avg: total / sSubs.length };
        });
        
        studentAverages.sort((a, b) => b.avg - a.avg);
        
        const rankedStudents = studentAverages.map((s, index) => ({
          id: s.id,
          name: s.name,
          score: s.avg,
          rank: index + 1
        }));

        setLeaderboard(rankedStudents.slice(0, 10));
        
        const me = rankedStudents.find(s => s.id === studentId);
        if (me) {
          setMyRankInfo({ rank: me.rank, score: me.score });
        }
      }

      // Calculate Certificates
      const allTopics = await dataProvider.getTopics();
      const allChapters = await dataProvider.getChapters();
      const myCerts: {id: string, name: string, date: string}[] = [];
      
      for (const topic of allTopics) {
        const topicChapters = allChapters.filter(c => c.topicId === topic.id);
        const topicLessons = allLessons.filter(l => topicChapters.some(c => c.id === l.chapterId));
        
        if (topicLessons.length > 0) {
          const completedTopicLessons = topicLessons.filter(l => prog.some(p => p.lessonId === l.id && p.completed));
          if (completedTopicLessons.length === topicLessons.length) {
            // Find the latest completion date
            const completionDates = completedTopicLessons.map(l => {
              const p = prog.find(p => p.lessonId === l.id);
              return p?.completedAt ? new Date(p.completedAt).getTime() : 0;
            });
            const latestDate = new Date(Math.max(...completionDates));
            myCerts.push({
              id: topic.id,
              name: `Hoàn thành chủ đề: ${topic.name}`,
              date: latestDate.toISOString()
            });
          }
        }
      }
      setCertificates(myCerts);
    };
    loadData();
  }, []);

  const completedCount = progress.filter(p => p.completed).length;
  const totalLessons = lessons.length;
  const progressPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  // Get next lessons (not completed)
  const nextLessons = lessons.filter(l => !progress.find(p => p.lessonId === l.id && p.completed)).slice(0, 3);

  // Get upcoming assignments
  const upcomingAssignments = assignments
    .filter(a => new Date(a.dueDate) > new Date())
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Tổng quan học tập</h2>

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-md shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <Bell className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Thông báo mới nhất</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p className="font-bold">{announcements[0].title}</p>
                <p className="mt-1">{announcements[0].content}</p>
                <p className="mt-2 text-xs text-blue-500">{format(new Date(announcements[0].createdAt), 'dd/MM/yyyy HH:mm')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress and Rank Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Tiến độ khóa học</h3>
            <span className="text-2xl font-bold text-emerald-600">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Đã hoàn thành {completedCount} / {totalLessons} bài học
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Trophy className="w-6 h-6 mr-2 text-yellow-500" />
            <h3 className="text-lg font-medium text-gray-900">Bảng xếp hạng Top 10</h3>
          </div>
          <div className="space-y-3">
            {leaderboard.map((student) => (
              <div 
                key={student.id} 
                className={`flex items-center justify-between p-3 rounded-lg border ${student.id === user?.id ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-100'}`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    student.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                    student.rank === 2 ? 'bg-gray-200 text-gray-700' :
                    student.rank === 3 ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-50 text-blue-700'
                  }`}>
                    {student.rank}
                  </div>
                  <span className={`font-medium ${student.id === user?.id ? 'text-yellow-800' : 'text-gray-900'}`}>
                    {student.name} {student.id === user?.id && '(Bạn)'}
                  </span>
                </div>
                <span className="font-bold text-emerald-600">
                  {student.score === -1 ? '-' : student.score.toFixed(1)}
                </span>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">Chưa có dữ liệu xếp hạng</p>
            )}
            
            {myRankInfo && myRankInfo.rank > 10 && (
              <>
                <div className="text-center text-gray-400 my-1">...</div>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-yellow-50 border-yellow-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-blue-50 text-blue-700">
                      {myRankInfo.rank}
                    </div>
                    <span className="font-medium text-yellow-800">
                      {user?.name} (Bạn)
                    </span>
                  </div>
                  <span className="font-bold text-emerald-600">
                    {myRankInfo.score === -1 ? '-' : myRankInfo.score.toFixed(1)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Next Lessons */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-emerald-600" />
              Bài học tiếp theo
            </h3>
            <Link to="/app/lessons" className="text-sm text-emerald-600 hover:text-emerald-700">Xem tất cả</Link>
          </div>
          <div className="space-y-4">
            {nextLessons.map(lesson => (
              <div key={lesson.id} className="flex items-start p-3 bg-gray-50 rounded-md">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm">
                    {lesson.order}
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{lesson.title}</p>
                  <Link to="/app/lessons" className="text-xs text-emerald-600 hover:text-emerald-700 mt-1 inline-block">Học ngay &rarr;</Link>
                </div>
              </div>
            ))}
            {nextLessons.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">Bạn đã hoàn thành tất cả bài học!</p>
            )}
          </div>
        </div>

        {/* Upcoming Assignments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-orange-500" />
              Bài tập sắp đến hạn
            </h3>
            <Link to="/app/assignments" className="text-sm text-emerald-600 hover:text-emerald-700">Xem tất cả</Link>
          </div>
          <div className="space-y-4">
            {upcomingAssignments.map(assignment => (
              <div key={assignment.id} className="flex items-start p-3 border border-gray-100 rounded-md">
                <div className="flex-shrink-0 mt-1">
                  <Clock className="w-5 h-5 text-orange-400" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">{assignment.title}</p>
                  <p className="text-xs text-gray-500 mt-1">Hạn nộp: {format(new Date(assignment.dueDate), 'dd/MM/yyyy HH:mm')}</p>
                </div>
                <Link to="/app/assignments" className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-100">
                  Làm bài
                </Link>
              </div>
            ))}
            {upcomingAssignments.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">Không có bài tập nào sắp đến hạn.</p>
            )}
          </div>
        </div>
      </div>

      {/* Certificates */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <Award className="w-6 h-6 mr-2 text-blue-500" />
          <h3 className="text-lg font-medium text-gray-900">Giấy chứng nhận</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {certificates.map(cert => (
            <div key={cert.id} className="border border-blue-100 bg-blue-50 rounded-lg p-4 flex items-start space-x-4">
              <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900">{cert.name}</h4>
                <p className="text-xs text-blue-600 mt-1">Cấp ngày: {format(new Date(cert.date), 'dd/MM/yyyy')}</p>
              </div>
            </div>
          ))}
          {certificates.length === 0 && (
            <div className="col-span-full text-center py-6 text-gray-500 border border-dashed border-gray-300 rounded-lg">
              Bạn chưa có giấy chứng nhận nào. Hãy hoàn thành các chủ đề học tập để nhận chứng nhận nhé!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

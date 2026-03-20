import React, { useState, useEffect, useRef } from 'react';
import { dataProvider } from '../../core/provider';
import { Lesson, Topic, Chapter, Progress, User } from '../../core/types';
import { BookOpen, CheckCircle, PlayCircle, FileText, ChevronRight, ChevronDown } from 'lucide-react';
import ReactPlayer from 'react-player';

export function StudentLessons() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lessonsByChapter, setLessonsByChapter] = useState<Record<string, Lesson[]>>({});
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const currentUser = await dataProvider.getCurrentUser();
    if (!currentUser) return;
    setUser(currentUser);
    
    const studentId = currentUser.id;
    const classId = currentUser.classId;

    // Get all subjects -> topics -> chapters
    const subs = await dataProvider.getSubjects();
    let allTopics: Topic[] = [];
    for (const sub of subs) {
      const subTopics = await dataProvider.getTopics(sub.id);
      allTopics = [...allTopics, ...subTopics];
    }
    setTopics(allTopics);

    let allChapters: Chapter[] = [];
    for (const topic of allTopics) {
      const chaps = await dataProvider.getChapters(topic.id);
      allChapters = [...allChapters, ...chaps];
    }
    setChapters(allChapters);

    // Get published lessons for this class
    const less = await dataProvider.getLessons(undefined, classId, 'published');
    
    // Also get generic published lessons (no classId)
    const genericLess = await dataProvider.getLessons(undefined, undefined, 'published');
    
    // Combine and deduplicate
    const allPublishedLessonsMap = new Map<string, Lesson>();
    [...less, ...genericLess.filter(l => !l.classId)].forEach(l => {
      allPublishedLessonsMap.set(l.id, l);
    });
    const allPublishedLessons = Array.from(allPublishedLessonsMap.values());
    
    // Group by chapter
    const grouped: Record<string, Lesson[]> = {};
    allPublishedLessons.forEach(l => {
      if (!grouped[l.chapterId]) grouped[l.chapterId] = [];
      grouped[l.chapterId].push(l);
    });
    setLessonsByChapter(grouped);

    // Get progress
    const prog = await dataProvider.getProgress(studentId);
    const progMap: Record<string, Progress> = {};
    prog.forEach(p => { progMap[p.lessonId] = p; });
    setProgress(progMap);
    
    // Auto expand topics that have lessons
    const expTopics: Record<string, boolean> = {};
    allTopics.forEach(t => {
      const topicChaps = allChapters.filter(c => c.topicId === t.id);
      const hasLessons = topicChaps.some(c => grouped[c.id] && grouped[c.id].length > 0);
      if (hasLessons) {
        expTopics[t.id] = true;
      }
    });
    setExpandedTopics(expTopics);
  };

  const handleMarkCompleted = async () => {
    if (!selectedLesson || !user) return;
    
    const isCompleted = progress[selectedLesson.id]?.completed;
    if (!isCompleted) {
      await dataProvider.updateProgress(user.id, selectedLesson.id, true);
      await loadData();
    }
  };

  // Auto-complete slide after 5 seconds
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (selectedLesson && selectedLesson.mediaType === 'slide' && !progress[selectedLesson.id]?.completed) {
      timer = setTimeout(() => {
        handleMarkCompleted();
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [selectedLesson, progress]);

  const toggleTopic = (id: string) => {
    setExpandedTopics(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getEmbedUrl = (url?: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('watch?v=', 'embed/').split('&')[0];
    }
    if (url.includes('youtu.be/')) {
      return url.replace('youtu.be/', 'youtube.com/embed/').split('?')[0];
    }
    return url;
  };

  if (selectedLesson) {
    const isCompleted = progress[selectedLesson.id]?.completed;
    
    return (
      <div className="flex h-[calc(100vh-4rem)] -m-4 sm:-m-6 lg:-m-8 bg-gray-50 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden flex-shrink-0 hidden md:flex">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
            <h2 className="font-bold text-gray-900">Nội dung khóa học</h2>
            <button onClick={() => setSelectedLesson(null)} className="text-sm text-[#0078d4] hover:text-[#006cbd] font-medium">Thoát</button>
          </div>
          {/* List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {topics.map(topic => {
              const topicChapters = chapters.filter(c => c.topicId === topic.id);
              const hasAnyLesson = topicChapters.some(c => lessonsByChapter[c.id] && lessonsByChapter[c.id].length > 0);
              if (!hasAnyLesson) return null;
              
              return (
                <div key={topic.id} className="border-b border-gray-200">
                  {topicChapters.map(chapter => {
                    const chapterLessons = lessonsByChapter[chapter.id] || [];
                    if (chapterLessons.length === 0) return null;
                    
                    return (
                      <div key={chapter.id}>
                        <div className="px-4 py-3 bg-gray-50 font-semibold text-sm text-gray-700 flex justify-between items-center">
                          <span>{chapter.name}</span>
                          <span className="text-xs font-normal text-gray-500">
                            {chapterLessons.filter(l => progress[l.id]?.completed).length}/{chapterLessons.length} hoàn thành
                          </span>
                        </div>
                        <ul className="divide-y divide-gray-100">
                          {chapterLessons.map(lesson => {
                            const isLessonCompleted = progress[lesson.id]?.completed;
                            const isSelected = selectedLesson.id === lesson.id;
                            return (
                              <li 
                                key={lesson.id} 
                                className={`px-4 py-3 cursor-pointer transition-colors flex items-start ${isSelected ? 'bg-[#f0f6ff]' : 'hover:bg-gray-50'}`}
                                onClick={() => setSelectedLesson(lesson)}
                              >
                                <div className="mt-0.5 mr-3 flex-shrink-0">
                                  {isLessonCompleted ? (
                                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                                  ) : (
                                    <div className={`h-4 w-4 rounded-full border-2 ${isSelected ? 'border-[#0078d4]' : 'border-gray-300'}`}></div>
                                  )}
                                </div>
                                <div>
                                  <p className={`text-sm ${isSelected ? 'font-semibold text-[#0078d4]' : 'text-gray-700'}`}>
                                    {lesson.title}
                                  </p>
                                  {lesson.duration && (
                                    <p className="text-xs text-gray-500 mt-1 flex items-center">
                                      <PlayCircle className="w-3 h-3 mr-1" /> {lesson.duration}
                                    </p>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto">
            {/* Mobile Back Button */}
            <button 
              onClick={() => setSelectedLesson(null)}
              className="md:hidden text-[#0078d4] hover:text-[#006cbd] font-medium flex items-center mb-4"
            >
              &larr; Quay lại danh sách
            </button>

            {/* Lesson Title */}
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{selectedLesson.title}</h2>
            
            {/* Media Player */}
            {selectedLesson.mediaType === 'video' && selectedLesson.videoUrl && (
              <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6 shadow-md">
                <ReactPlayer
                  url={selectedLesson.videoUrl}
                  width="100%"
                  height="100%"
                  controls
                  onEnded={handleMarkCompleted}
                />
              </div>
            )}
            {selectedLesson.mediaType === 'slide' && selectedLesson.documentUrl && (
              <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden mb-6 shadow-md">
                <iframe 
                  src={selectedLesson.documentUrl.replace('/view', '/preview')} 
                  className="w-full h-full"
                  allowFullScreen
                ></iframe>
              </div>
            )}
            
            {/* Progress Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6 border border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-gray-900">Tiến độ bài học</span>
                <span className="text-sm font-bold text-[#0078d4]">{isCompleted ? '100%' : '0%'}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                <div className={`h-2.5 rounded-full transition-all duration-500 ${isCompleted ? 'bg-[#0078d4] w-full' : 'bg-[#0078d4] w-0'}`}></div>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm text-gray-500 gap-4">
                <span className="flex items-center">
                  <PlayCircle className="w-4 h-4 mr-1.5" />
                  {isCompleted ? 'Bạn đã hoàn thành bài học này.' : 'Xem hết video hoặc bài trình chiếu để hoàn thành.'}
                </span>
              </div>
            </div>
            
            {/* Content */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6">{selectedLesson.title}</h3>
              <div className="prose max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: selectedLesson.content }} />
              
              {selectedLesson.mediaType === 'document' && selectedLesson.documentUrl && (
                <div className="mt-8 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                  <a 
                    href={selectedLesson.documentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-[#0078d4] hover:text-[#006cbd] font-medium"
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    Tải xuống tài liệu đính kèm
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Bài giảng của tôi</h2>
      
      <div className="space-y-4">
        {topics.map(topic => {
          const topicChapters = chapters.filter(c => c.topicId === topic.id);
          const hasAnyLesson = topicChapters.some(c => lessonsByChapter[c.id] && lessonsByChapter[c.id].length > 0);
          
          if (!hasAnyLesson) return null;
          
          return (
            <div key={topic.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div 
                className="bg-emerald-50 px-4 py-3 flex items-center justify-between border-b border-emerald-100 cursor-pointer"
                onClick={() => toggleTopic(topic.id)}
              >
                <div className="flex items-center">
                  {expandedTopics[topic.id] ? (
                    <ChevronDown className="w-5 h-5 text-emerald-600 mr-2" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-emerald-600 mr-2" />
                  )}
                  <h3 className="text-lg font-bold text-emerald-800">{topic.name}</h3>
                </div>
              </div>
              
              {expandedTopics[topic.id] && (
                <div className="p-4 space-y-4">
                  {topicChapters.map(chapter => {
                    const chapterLessons = lessonsByChapter[chapter.id] || [];
                    if (chapterLessons.length === 0) return null;
                    
                    return (
                      <div key={chapter.id} className="border border-gray-200 rounded-md overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                          <h4 className="font-semibold text-gray-700">{chapter.name}</h4>
                        </div>
                        <ul className="divide-y divide-gray-100 bg-white">
                          {chapterLessons.map(lesson => {
                            const isCompleted = progress[lesson.id]?.completed;
                            return (
                              <li 
                                key={lesson.id} 
                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                onClick={() => setSelectedLesson(lesson)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    {isCompleted ? (
                                      <CheckCircle className="h-5 w-5 text-emerald-500 mr-3" />
                                    ) : (
                                      <BookOpen className="h-5 w-5 text-gray-400 mr-3" />
                                    )}
                                    <div>
                                      <p className={`text-sm font-medium ${isCompleted ? 'text-gray-500' : 'text-gray-900'}`}>
                                        {lesson.title}
                                      </p>
                                      {isCompleted && progress[lesson.id]?.completedAt && (
                                        <p className="text-xs text-gray-400 mt-1">
                                          Đã học: {new Date(progress[lesson.id].completedAt!).toLocaleDateString('vi-VN')}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-gray-400" />
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        
        {Object.keys(lessonsByChapter).length === 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center text-gray-500">
            Chưa có bài giảng nào được giao.
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { dataProvider } from '../../core/provider';
import { Lesson, Class, Subject, Topic, Chapter } from '../../core/types';
import { Modal } from '../../components/Modal';
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, CheckCircle, XCircle } from 'lucide-react';

export function Lessons() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  const [topics, setTopics] = useState<Topic[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  // Modals state
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);

  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const [activeTopicId, setActiveTopicId] = useState<string>('');
  const [activeChapterId, setActiveChapterId] = useState<string>('');

  const [topicForm, setTopicForm] = useState({ name: '', order: 1 });
  const [chapterForm, setChapterForm] = useState({ name: '', order: 1 });
  const [lessonForm, setLessonForm] = useState({
    title: '',
    classId: '',
    content: '',
    documentUrl: '',
    status: 'draft' as 'draft' | 'published',
    order: 1,
    courseStatus: 'locked',
    duration: '',
    mediaType: 'none'
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedSubjectId) {
      loadHierarchyData();
    }
  }, [selectedSubjectId, selectedClassId]);

  const loadInitialData = async () => {
    const cls = await dataProvider.getClasses();
    setClasses(cls);
    
    const subs = await dataProvider.getSubjects();
    setSubjects(subs);
    if (subs.length > 0) {
      setSelectedSubjectId(subs[0].id);
    }
  };

  const loadHierarchyData = async () => {
    if (!selectedSubjectId) return;

    const tps = await dataProvider.getTopics(selectedSubjectId);
    setTopics(tps);

    let allChaps: Chapter[] = [];
    for (const t of tps) {
      const chaps = await dataProvider.getChapters(t.id);
      allChaps = [...allChaps, ...chaps];
    }
    setChapters(allChaps);

    let allLess: Lesson[] = [];
    for (const c of allChaps) {
      const less = await dataProvider.getLessons(c.id, selectedClassId || undefined);
      allLess = [...allLess, ...less];
    }
    setLessons(allLess);
    
    // Auto expand all by default
    const expTopics: Record<string, boolean> = {};
    tps.forEach(t => expTopics[t.id] = true);
    setExpandedTopics(expTopics);
    
    const expChaps: Record<string, boolean> = {};
    allChaps.forEach(c => expChaps[c.id] = true);
    setExpandedChapters(expChaps);
  };

  const toggleTopic = (id: string) => setExpandedTopics(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleChapter = (id: string) => setExpandedChapters(prev => ({ ...prev, [id]: !prev[id] }));

  // --- Topic Handlers ---
  const openTopicModal = (topic?: Topic) => {
    if (topic) {
      setEditingTopic(topic);
      setTopicForm({ name: topic.name, order: topic.order });
    } else {
      setEditingTopic(null);
      const nextOrder = topics.length > 0 ? Math.max(...topics.map(t => t.order)) + 1 : 1;
      setTopicForm({ name: '', order: nextOrder });
    }
    setIsTopicModalOpen(true);
  };

  const handleTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTopic) {
      await dataProvider.updateTopic(editingTopic.id, topicForm);
    } else {
      await dataProvider.addTopic({ ...topicForm, subjectId: selectedSubjectId });
    }
    setIsTopicModalOpen(false);
    loadHierarchyData();
  };

  const handleDeleteTopic = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa chủ đề này và tất cả chương, bài giảng bên trong?')) {
      await dataProvider.deleteTopic(id);
      loadHierarchyData();
    }
  };

  // --- Chapter Handlers ---
  const openChapterModal = (topicId: string, chapter?: Chapter) => {
    setActiveTopicId(topicId);
    if (chapter) {
      setEditingChapter(chapter);
      setChapterForm({ name: chapter.name, order: chapter.order });
    } else {
      setEditingChapter(null);
      const chapsInTopic = chapters.filter(c => c.topicId === topicId);
      const nextOrder = chapsInTopic.length > 0 ? Math.max(...chapsInTopic.map(c => c.order)) + 1 : 1;
      setChapterForm({ name: '', order: nextOrder });
    }
    setIsChapterModalOpen(true);
  };

  const handleChapterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingChapter) {
      await dataProvider.updateChapter(editingChapter.id, chapterForm);
    } else {
      await dataProvider.addChapter({ ...chapterForm, topicId: activeTopicId });
    }
    setIsChapterModalOpen(false);
    loadHierarchyData();
  };

  const handleDeleteChapter = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa chương này và tất cả bài giảng bên trong?')) {
      await dataProvider.deleteChapter(id);
      loadHierarchyData();
    }
  };

  // --- Lesson Handlers ---
  const openLessonModal = (chapterId: string, lesson?: Lesson) => {
    setActiveChapterId(chapterId);
    if (lesson) {
      setEditingLesson(lesson);
      setLessonForm({
        title: lesson.title,
        classId: lesson.classId || '',
        content: lesson.content,
        documentUrl: lesson.documentUrl || '',
        status: lesson.status,
        order: lesson.order,
        courseStatus: lesson.courseStatus || 'locked',
        duration: lesson.duration || '',
        mediaType: lesson.mediaType || 'none'
      });
    } else {
      setEditingLesson(null);
      const lessInChap = lessons.filter(l => l.chapterId === chapterId);
      const nextOrder = lessInChap.length > 0 ? Math.max(...lessInChap.map(l => l.order)) + 1 : 1;
      setLessonForm({
        title: '',
        classId: selectedClassId || '',
        content: '',
        documentUrl: '',
        status: 'draft',
        order: nextOrder,
        courseStatus: 'locked',
        duration: '',
        mediaType: 'none'
      });
    }
    setIsLessonModalOpen(true);
  };

  const handleLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLesson) {
      await dataProvider.updateLesson(editingLesson.id, lessonForm);
    } else {
      await dataProvider.addLesson({ ...lessonForm, chapterId: activeChapterId });
    }
    setIsLessonModalOpen(false);
    loadHierarchyData();
  };

  const handleDeleteLesson = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa bài giảng này?')) {
      await dataProvider.deleteLesson(id);
      loadHierarchyData();
    }
  };

  const toggleLessonStatus = async (lesson: Lesson) => {
    const newStatus = lesson.status === 'published' ? 'draft' : 'published';
    await dataProvider.updateLesson(lesson.id, { status: newStatus });
    loadHierarchyData();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Quản lý Bài giảng</h2>
        {selectedSubjectId && (
          <button
            onClick={() => openTopicModal()}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Thêm chủ đề
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-md shadow-sm border border-gray-200">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Môn học</label>
          <select
            className="w-full p-2 border rounded-md outline-none focus:border-emerald-500"
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
          >
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Lọc theo lớp</label>
          <select
            className="w-full p-2 border rounded-md outline-none focus:border-emerald-500"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            <option value="">Tất cả lớp học (Chung)</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {topics.map(topic => (
          <div key={topic.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            {/* Topic Header */}
            <div className="bg-emerald-50 px-4 py-3 flex items-center justify-between border-b border-emerald-100">
              <div className="flex items-center cursor-pointer flex-1" onClick={() => toggleTopic(topic.id)}>
                {expandedTopics[topic.id] ? (
                  <ChevronDown className="w-5 h-5 text-emerald-600 mr-2" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-emerald-600 mr-2" />
                )}
                <h3 className="text-lg font-bold text-emerald-800">{topic.name}</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => openChapterModal(topic.id)} className="text-sm text-emerald-600 hover:text-emerald-800 flex items-center bg-white px-2 py-1 rounded border border-emerald-200">
                  <Plus className="w-4 h-4 mr-1" /> Thêm chương
                </button>
                <button onClick={() => openTopicModal(topic)} className="p-1 text-indigo-600 hover:text-indigo-800 bg-white rounded border border-indigo-200">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDeleteTopic(topic.id)} className="p-1 text-red-600 hover:text-red-800 bg-white rounded border border-red-200">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chapters List */}
            {expandedTopics[topic.id] && (
              <div className="p-4 space-y-4">
                {chapters.filter(c => c.topicId === topic.id).map(chapter => (
                  <div key={chapter.id} className="border border-gray-200 rounded-md">
                    {/* Chapter Header */}
                    <div className="bg-gray-50 px-4 py-2 flex items-center justify-between border-b border-gray-200">
                      <div className="flex items-center cursor-pointer flex-1" onClick={() => toggleChapter(chapter.id)}>
                        {expandedChapters[chapter.id] ? (
                          <ChevronDown className="w-4 h-4 text-gray-500 mr-2" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500 mr-2" />
                        )}
                        <h4 className="font-semibold text-gray-700">{chapter.name}</h4>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button onClick={() => openLessonModal(chapter.id)} className="text-xs text-blue-600 hover:text-blue-800 flex items-center">
                          <Plus className="w-3 h-3 mr-1" /> Thêm bài
                        </button>
                        <button onClick={() => openChapterModal(topic.id, chapter)} className="text-indigo-600 hover:text-indigo-800">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteChapter(chapter.id)} className="text-red-600 hover:text-red-800">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Lessons List */}
                    {expandedChapters[chapter.id] && (
                      <div className="bg-white divide-y divide-gray-100">
                        {lessons.filter(l => l.chapterId === chapter.id).map(lesson => (
                          <div key={lesson.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                            <div className="flex items-center">
                              <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold mr-3">
                                {lesson.order}
                              </span>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{lesson.title}</p>
                                <p className="text-xs text-gray-500">
                                  {lesson.classId ? `Lớp: ${classes.find(c => c.id === lesson.classId)?.name}` : 'Chung cho tất cả lớp'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <button
                                onClick={() => toggleLessonStatus(lesson)}
                                className={`inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white ${
                                  lesson.status === 'published' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-400 hover:bg-gray-500'
                                }`}
                              >
                                {lesson.status === 'published' ? (
                                  <><CheckCircle className="w-3 h-3 mr-1" /> Đã xuất bản</>
                                ) : (
                                  <><XCircle className="w-3 h-3 mr-1" /> Bản nháp</>
                                )}
                              </button>
                              <button onClick={() => openLessonModal(chapter.id, lesson)} className="text-indigo-600 hover:text-indigo-900">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteLesson(lesson.id)} className="text-red-600 hover:text-red-900">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {lessons.filter(l => l.chapterId === chapter.id).length === 0 && (
                          <div className="px-4 py-3 text-sm text-gray-500 italic text-center">
                            Chưa có bài giảng nào trong chương này.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {chapters.filter(c => c.topicId === topic.id).length === 0 && (
                  <div className="text-sm text-gray-500 italic text-center py-2">
                    Chưa có chương nào trong chủ đề này.
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {topics.length === 0 && selectedSubjectId && (
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
            <p className="text-gray-500 mb-4">Môn học này chưa có chủ đề nào.</p>
            <button
              onClick={() => openTopicModal()}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Thêm chủ đề đầu tiên
            </button>
          </div>
        )}
      </div>

      {/* Topic Modal */}
      <Modal isOpen={isTopicModalOpen} onClose={() => setIsTopicModalOpen(false)} title={editingTopic ? 'Sửa chủ đề' : 'Thêm chủ đề mới'}>
        <form onSubmit={handleTopicSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tên chủ đề</label>
            <input type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border" value={topicForm.name} onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Thứ tự</label>
            <input type="number" required min="1" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border" value={topicForm.order} onChange={(e) => setTopicForm({ ...topicForm, order: parseInt(e.target.value) || 1 })} />
          </div>
          <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-emerald-600 text-base font-medium text-white hover:bg-emerald-700 sm:ml-3 sm:w-auto sm:text-sm">Lưu</button>
            <button type="button" onClick={() => setIsTopicModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm">Hủy</button>
          </div>
        </form>
      </Modal>

      {/* Chapter Modal */}
      <Modal isOpen={isChapterModalOpen} onClose={() => setIsChapterModalOpen(false)} title={editingChapter ? 'Sửa chương' : 'Thêm chương mới'}>
        <form onSubmit={handleChapterSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tên chương</label>
            <input type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border" value={chapterForm.name} onChange={(e) => setChapterForm({ ...chapterForm, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Thứ tự</label>
            <input type="number" required min="1" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border" value={chapterForm.order} onChange={(e) => setChapterForm({ ...chapterForm, order: parseInt(e.target.value) || 1 })} />
          </div>
          <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-emerald-600 text-base font-medium text-white hover:bg-emerald-700 sm:ml-3 sm:w-auto sm:text-sm">Lưu</button>
            <button type="button" onClick={() => setIsChapterModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm">Hủy</button>
          </div>
        </form>
      </Modal>

      {/* Lesson Modal */}
      <Modal isOpen={isLessonModalOpen} onClose={() => setIsLessonModalOpen(false)} title={editingLesson ? 'Sửa bài giảng' : 'Thêm Tiết học mới'}>
        <form onSubmit={handleLessonSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tiêu đề</label>
            <input type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border" value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Trạng thái khóa học</label>
              <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border" value={lessonForm.courseStatus} onChange={(e) => setLessonForm({ ...lessonForm, courseStatus: e.target.value })}>
                <option value="locked">Khóa (Phải mua)</option>
                <option value="free">Miễn phí</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Thời lượng (VD: 10:30)</label>
              <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border" value={lessonForm.duration} onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">Loại Media</label>
              <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border" value={lessonForm.mediaType} onChange={(e) => setLessonForm({ ...lessonForm, mediaType: e.target.value })}>
                <option value="none">Không có</option>
                <option value="video">Video (YouTube/MP4)</option>
                <option value="slide">Slide Trình chiếu</option>
                <option value="document">Tài liệu tải về</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Link liên kết (Tùy chọn)</label>
              <input type="url" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border" value={lessonForm.documentUrl} onChange={(e) => setLessonForm({ ...lessonForm, documentUrl: e.target.value })} placeholder="https://..." />
            </div>
          </div>

          <div>
            <textarea required rows={6} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border" value={lessonForm.content} onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })} placeholder="Nội dung bài giảng..." />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Lớp học</label>
              <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border" value={lessonForm.classId} onChange={(e) => setLessonForm({ ...lessonForm, classId: e.target.value })}>
                <option value="">Chung (Tất cả)</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Thứ tự</label>
              <input type="number" required min="1" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border" value={lessonForm.order} onChange={(e) => setLessonForm({ ...lessonForm, order: parseInt(e.target.value) || 1 })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
              <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border" value={lessonForm.status} onChange={(e) => setLessonForm({ ...lessonForm, status: e.target.value as 'draft' | 'published' })}>
                <option value="draft">Bản nháp</option>
                <option value="published">Xuất bản</option>
              </select>
            </div>
          </div>

          <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#0078d4] text-base font-medium text-white hover:bg-[#006cbd] sm:ml-3 sm:w-auto sm:text-sm">Lưu</button>
            <button type="button" onClick={() => setIsLessonModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm">Hủy</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


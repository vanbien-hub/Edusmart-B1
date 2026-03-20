import React, { useState, useEffect } from 'react';
import { dataProvider } from '../../core/provider';
import { Assignment, Class, Lesson, Submission, User, Question, Subject, Topic, Chapter } from '../../core/types';
import { Modal } from '../../components/Modal';
import { Plus, Edit2, Trash2, Search, CheckCircle, FileText, Users } from 'lucide-react';
import { format } from 'date-fns';

export function Assignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  
  const [search, setSearch] = useState('');
  const [questionSubjectFilter, setQuestionSubjectFilter] = useState('');
  const [questionTopicFilter, setQuestionTopicFilter] = useState('');
  const [questionChapterFilter, setQuestionChapterFilter] = useState('');
  const [questionTypeFilter, setQuestionTypeFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classId: '',
    lessonId: '',
    dueDate: '',
    maxScore: 10,
    type: 'text' as 'text' | 'file' | 'quiz',
    rubric: '',
    questionIds: [] as string[]
  });

  const [gradingData, setGradingData] = useState({
    submissionId: '',
    score: 0,
    feedback: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const cls = await dataProvider.getClasses();
    setClasses(cls);
    
    const less = await dataProvider.getLessons();
    setLessons(less);
    
    const assigns = await dataProvider.getAssignments();
    setAssignments(assigns);

    const users = await dataProvider.getUsers();
    setStudents(users.filter(u => u.role === 'student'));

    const allQuestions = await dataProvider.getQuestions();
    setQuestions(allQuestions);

    const allSubjects = await dataProvider.getSubjects();
    setSubjects(allSubjects);
  };

  useEffect(() => {
    if (questionSubjectFilter) {
      dataProvider.getTopics(questionSubjectFilter).then(setTopics);
    } else {
      setTopics([]);
    }
    setQuestionTopicFilter('');
    setQuestionChapterFilter('');
  }, [questionSubjectFilter]);

  useEffect(() => {
    if (questionTopicFilter) {
      dataProvider.getChapters(questionTopicFilter).then(setChapters);
    } else {
      setChapters([]);
    }
    setQuestionChapterFilter('');
  }, [questionTopicFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      dueDate: new Date(formData.dueDate).toISOString()
    };
    
    if (editingAssignment) {
      await dataProvider.updateAssignment(editingAssignment.id, dataToSave);
    } else {
      await dataProvider.addAssignment(dataToSave);
    }
    setIsModalOpen(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa bài tập này?')) {
      await dataProvider.deleteAssignment(id);
      loadData();
    }
  };

  const openModal = (assignment?: Assignment) => {
    if (assignment) {
      setEditingAssignment(assignment);
      setFormData({
        title: assignment.title,
        description: assignment.description,
        classId: assignment.classId || '',
        lessonId: assignment.lessonId || '',
        dueDate: new Date(assignment.dueDate).toISOString().slice(0, 16),
        maxScore: assignment.maxScore,
        type: assignment.type,
        rubric: assignment.rubric || '',
        questionIds: assignment.questionIds || []
      });
    } else {
      setEditingAssignment(null);
      setFormData({
        title: '',
        description: '',
        classId: classes[0]?.id || '',
        lessonId: '',
        dueDate: new Date().toISOString().slice(0, 16),
        maxScore: 10,
        type: 'text',
        rubric: '',
        questionIds: []
      });
    }
    setIsModalOpen(true);
  };

  const openGrading = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    const subs = await dataProvider.getSubmissions(assignment.id);
    setSubmissions(subs);
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await dataProvider.gradeSubmission(gradingData.submissionId, gradingData.score, gradingData.feedback);
    setIsGradingModalOpen(false);
    if (selectedAssignment) {
      const subs = await dataProvider.getSubmissions(selectedAssignment.id);
      setSubmissions(subs);
    }
  };

  const filteredAssignments = assignments.filter(a => 
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  if (selectedAssignment) {
    const classStudents = students.filter(s => s.classId === selectedAssignment.classId);
    
    return (
      <div className="space-y-6">
        <button 
          onClick={() => setSelectedAssignment(null)}
          className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center"
        >
          &larr; Quay lại danh sách bài tập
        </button>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedAssignment.title}</h2>
          <div className="flex space-x-4 text-sm text-gray-500 mb-6">
            <span>Hạn nộp: {format(new Date(selectedAssignment.dueDate), 'dd/MM/yyyy HH:mm')}</span>
            <span>Điểm tối đa: {selectedAssignment.maxScore}</span>
            <span>Loại: {selectedAssignment.type === 'text' ? 'Tự luận' : selectedAssignment.type === 'file' ? 'Nộp file' : 'Trắc nghiệm'}</span>
          </div>
          
          <h3 className="text-lg font-medium mb-4">Danh sách nộp bài ({submissions.length}/{classStudents.length})</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Học sinh</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian nộp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Điểm</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {classStudents.map(student => {
                  const submission = submissions.find(s => s.studentId === student.id);
                  const isLate = submission && new Date(submission.submittedAt) > new Date(selectedAssignment.dueDate);
                  
                  return (
                    <tr key={student.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {submission ? format(new Date(submission.submittedAt), 'dd/MM/yyyy HH:mm') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {!submission ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Chưa nộp</span>
                        ) : isLate ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Nộp muộn</span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Đã nộp</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {submission?.score !== undefined ? `${submission.score}/${selectedAssignment.maxScore}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {submission && (
                          <button 
                            onClick={() => {
                              setGradingData({
                                submissionId: submission.id,
                                score: submission.score || 0,
                                feedback: submission.feedback || ''
                              });
                              setIsGradingModalOpen(true);
                            }}
                            className="text-emerald-600 hover:text-emerald-900"
                          >
                            Chấm bài
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <Modal
          isOpen={isGradingModalOpen}
          onClose={() => setIsGradingModalOpen(false)}
          title="Chấm điểm bài làm"
        >
          {(() => {
            const sub = submissions.find(s => s.id === gradingData.submissionId);
            if (!sub) return null;
            
            return (
              <form onSubmit={handleGradeSubmit} className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md mb-4">
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Bài làm của học sinh:</h4>
                  {selectedAssignment.type === 'text' ? (
                    <div className="text-sm text-gray-900 whitespace-pre-wrap">{sub.content}</div>
                  ) : (
                    <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline flex items-center">
                      <FileText className="w-4 h-4 mr-1" /> Xem file đính kèm
                    </a>
                  )}
                </div>
                
                {selectedAssignment.rubric && (
                  <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800 mb-4">
                    <strong>Tiêu chí chấm:</strong> {selectedAssignment.rubric}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Điểm số (Tối đa: {selectedAssignment.maxScore})</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max={selectedAssignment.maxScore}
                    step="0.5"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
                    value={gradingData.score}
                    onChange={(e) => setGradingData({ ...gradingData, score: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Lời phê</label>
                  <textarea
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
                    value={gradingData.feedback}
                    onChange={(e) => setGradingData({ ...gradingData, feedback: e.target.value })}
                  />
                </div>
                <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                  <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-emerald-600 text-base font-medium text-white hover:bg-emerald-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm">
                    Lưu điểm
                  </button>
                  <button type="button" onClick={() => setIsGradingModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm">
                    Hủy
                  </button>
                </div>
              </form>
            );
          })()}
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Quản lý Bài tập</h2>
        <button
          onClick={() => openModal()}
          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Tạo bài tập
        </button>
      </div>

      <div className="flex items-center bg-white p-2 rounded-md shadow-sm border border-gray-200 w-full max-w-md">
        <Search className="w-5 h-5 text-gray-400 ml-2" />
        <input
          type="text"
          placeholder="Tìm kiếm bài tập..."
          className="w-full p-2 outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssignments.map((assignment) => {
          const cls = classes.find(c => c.id === assignment.classId);
          return (
            <div key={assignment.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{assignment.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${assignment.type === 'text' ? 'bg-blue-100 text-blue-800' : assignment.type === 'file' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'}`}>
                    {assignment.type === 'text' ? 'Tự luận' : assignment.type === 'file' ? 'Nộp file' : 'Trắc nghiệm'}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-500 line-clamp-2">{assignment.description}</p>
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2 text-gray-400" />
                    Lớp: {cls?.name || 'Chung'}
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-gray-400" />
                    Hạn nộp: {format(new Date(assignment.dueDate), 'dd/MM/yyyy HH:mm')}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex justify-between items-center">
                <button 
                  onClick={() => openGrading(assignment)}
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-800"
                >
                  Xem & Chấm bài
                </button>
                <div className="flex space-x-3">
                  <button onClick={() => openModal(assignment)} className="text-gray-400 hover:text-indigo-600">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(assignment.id)} className="text-gray-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAssignment ? 'Sửa bài tập' : 'Tạo bài tập mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tiêu đề</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mô tả / Yêu cầu</label>
            <textarea
              required
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Lớp học</label>
              <select
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Bài giảng liên quan (Tùy chọn)</label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
                value={formData.lessonId}
                onChange={(e) => setFormData({ ...formData, lessonId: e.target.value })}
              >
                <option value="">Không có</option>
                {lessons.map(l => (
                  <option key={l.id} value={l.id}>{l.title}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Hạn nộp</label>
              <input
                type="datetime-local"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Điểm tối đa</label>
              <input
                type="number"
                required
                min="1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
                value={formData.maxScore}
                onChange={(e) => setFormData({ ...formData, maxScore: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Loại bài tập</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'text' | 'file' | 'quiz' })}
            >
              <option value="text">Nhập văn bản (Tự luận)</option>
              <option value="file">Nộp link/file</option>
              <option value="quiz">Trắc nghiệm</option>
            </select>
          </div>
          
          {formData.type === 'quiz' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Chọn câu hỏi trắc nghiệm ({formData.questionIds.length} đã chọn)</label>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <select
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
                  value={questionSubjectFilter}
                  onChange={(e) => setQuestionSubjectFilter(e.target.value)}
                >
                  <option value="">Tất cả môn học</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                
                <select
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
                  value={questionTopicFilter}
                  onChange={(e) => setQuestionTopicFilter(e.target.value)}
                  disabled={!questionSubjectFilter}
                >
                  <option value="">Tất cả chủ đề</option>
                  {topics.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>

                <select
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
                  value={questionChapterFilter}
                  onChange={(e) => setQuestionChapterFilter(e.target.value)}
                  disabled={!questionTopicFilter}
                >
                  <option value="">Tất cả bài/chương</option>
                  {chapters.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <select
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
                  value={questionTypeFilter}
                  onChange={(e) => setQuestionTypeFilter(e.target.value)}
                >
                  <option value="">Tất cả dạng câu hỏi</option>
                  <option value="multiple_choice">Trắc nghiệm nhiều lựa chọn</option>
                  <option value="true_false">Đúng/Sai</option>
                  <option value="short_answer">Trả lời ngắn</option>
                  <option value="fill_blank">Điền khuyết</option>
                  <option value="ordering">Sắp xếp</option>
                </select>
              </div>

              <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-2">
                {questions
                  .filter(q => !questionTypeFilter ? true : q.type === questionTypeFilter)
                  .filter(q => !questionSubjectFilter || q.subjectId === questionSubjectFilter)
                  .filter(q => !questionChapterFilter || q.chapterId === questionChapterFilter)
                  .map(q => (
                  <label key={q.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-md cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                      checked={formData.questionIds.includes(q.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, questionIds: [...formData.questionIds, q.id] });
                        } else {
                          setFormData({ ...formData, questionIds: formData.questionIds.filter(id => id !== q.id) });
                        }
                      }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">{q.content}</p>
                      <p className="text-xs text-gray-500">Độ khó: {q.difficulty === 'easy' ? 'Dễ' : q.difficulty === 'medium' ? 'Trung bình' : 'Khó'}</p>
                    </div>
                  </label>
                ))}
                {questions
                  .filter(q => !questionTypeFilter ? true : q.type === questionTypeFilter)
                  .filter(q => !questionSubjectFilter || q.subjectId === questionSubjectFilter)
                  .filter(q => !questionChapterFilter || q.chapterId === questionChapterFilter)
                  .length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">Không có câu hỏi nào phù hợp.</p>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Tiêu chí chấm (Rubric)</label>
            <textarea
              rows={2}
              placeholder="VD: Trình bày 2đ, Nội dung 8đ..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
              value={formData.rubric}
              onChange={(e) => setFormData({ ...formData, rubric: e.target.value })}
            />
          </div>
          <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-emerald-600 text-base font-medium text-white hover:bg-emerald-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm">
              Lưu
            </button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm">
              Hủy
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

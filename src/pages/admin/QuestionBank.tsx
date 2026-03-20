import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Search, Filter, Upload, Download, X, Check } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { dataProvider } from '../../core/provider';
import { Question, Subject, Chapter, QuestionType } from '../../core/types';
import * as XLSX from 'xlsx';

export function QuestionBank() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Form State
  const [questionForm, setQuestionForm] = useState<Partial<Question>>({
    type: 'multiple_choice',
    difficulty: 'medium',
    options: ['', '', '', ''],
    correctAnswer: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      loadChapters(selectedSubject);
    } else {
      setChapters([]);
      setSelectedChapter('');
    }
    loadQuestions();
  }, [selectedSubject, selectedChapter]);

  const loadInitialData = async () => {
    try {
      const subs = await dataProvider.getSubjects();
      setSubjects(subs);
      if (subs.length > 0) {
        setSelectedSubject(subs[0].id);
      }
    } catch (err) {
      setError('Không thể tải dữ liệu ban đầu');
    } finally {
      setLoading(false);
    }
  };

  const loadChapters = async (subjectId: string) => {
    try {
      // We need to get topics first, then chapters for those topics
      const topics = await dataProvider.getTopics(subjectId);
      let allChapters: Chapter[] = [];
      for (const topic of topics) {
        const chaps = await dataProvider.getChapters(topic.id);
        allChapters = [...allChapters, ...chaps];
      }
      setChapters(allChapters);
    } catch (err) {
      console.error('Error loading chapters:', err);
    }
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const data = await dataProvider.getQuestions(selectedSubject, selectedChapter || undefined);
      setQuestions(data);
    } catch (err) {
      setError('Không thể tải danh sách câu hỏi');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) {
      alert('Vui lòng chọn môn học');
      return;
    }

    try {
      const questionData = {
        ...questionForm,
        subjectId: selectedSubject,
        chapterId: selectedChapter || undefined,
      } as Omit<Question, 'id' | 'createdAt'>;

      // Clean up options based on type
      if (questionData.type === 'true_false') {
        questionData.options = undefined;
        // Ensure correctAnswer is boolean
        questionData.correctAnswer = questionData.correctAnswer === 'true' || questionData.correctAnswer === true;
      } else if (questionData.type === 'short_answer' || questionData.type === 'fill_blank') {
        questionData.options = undefined;
      }

      if (editingQuestion) {
        await dataProvider.updateQuestion(editingQuestion.id, questionData);
      } else {
        await dataProvider.addQuestion(questionData);
      }
      
      setIsQuestionModalOpen(false);
      loadQuestions();
      resetForm();
    } catch (err) {
      alert('Lỗi khi lưu câu hỏi');
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
      try {
        await dataProvider.deleteQuestion(id);
        loadQuestions();
      } catch (err) {
        alert('Lỗi khi xóa câu hỏi');
      }
    }
  };

  const resetForm = () => {
    setEditingQuestion(null);
    setQuestionForm({
      type: 'multiple_choice',
      difficulty: 'medium',
      options: ['', '', '', ''],
      correctAnswer: '',
      content: '',
      explanation: ''
    });
  };

  const openEditModal = (question: Question) => {
    setEditingQuestion(question);
    setQuestionForm({ ...question });
    setIsQuestionModalOpen(true);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(questionForm.options || [])];
    newOptions[index] = value;
    setQuestionForm({ ...questionForm, options: newOptions });
  };

  const addOption = () => {
    setQuestionForm({ ...questionForm, options: [...(questionForm.options || []), ''] });
  };

  const removeOption = (index: number) => {
    const newOptions = [...(questionForm.options || [])];
    newOptions.splice(index, 1);
    setQuestionForm({ ...questionForm, options: newOptions });
  };

  // Excel Import/Export
  const downloadTemplate = () => {
    const templateData = [
      {
        'Loại câu hỏi (multiple_choice, short_answer, true_false, fill_blank, ordering)': 'multiple_choice',
        'Nội dung câu hỏi': 'Thủ đô của Việt Nam là gì?',
        'Lựa chọn 1 (nếu có)': 'Hà Nội',
        'Lựa chọn 2 (nếu có)': 'Hồ Chí Minh',
        'Lựa chọn 3 (nếu có)': 'Đà Nẵng',
        'Lựa chọn 4 (nếu có)': 'Hải Phòng',
        'Đáp án đúng (Ghi rõ nội dung đáp án hoặc TRUE/FALSE)': 'Hà Nội',
        'Độ khó (easy, medium, hard)': 'easy',
        'Giải thích (tùy chọn)': 'Hà Nội là thủ đô của nước CHXHCN Việt Nam.'
      },
      {
        'Loại câu hỏi (multiple_choice, short_answer, true_false, fill_blank, ordering)': 'true_false',
        'Nội dung câu hỏi': 'Mặt trời quay quanh trái đất.',
        'Lựa chọn 1 (nếu có)': '',
        'Lựa chọn 2 (nếu có)': '',
        'Lựa chọn 3 (nếu có)': '',
        'Lựa chọn 4 (nếu có)': '',
        'Đáp án đúng (Ghi rõ nội dung đáp án hoặc TRUE/FALSE)': 'FALSE',
        'Độ khó (easy, medium, hard)': 'easy',
        'Giải thích (tùy chọn)': 'Trái đất quay quanh mặt trời.'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'Mau_Nhap_Cau_Hoi.xlsx');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedSubject) {
      alert('Vui lòng chọn môn học trước khi import');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const newQuestions: Omit<Question, 'id' | 'createdAt'>[] = data.map(row => {
          const type = row['Loại câu hỏi (multiple_choice, short_answer, true_false, fill_blank, ordering)'] || 'multiple_choice';
          
          let options: string[] | undefined = undefined;
          if (type === 'multiple_choice' || type === 'ordering') {
            options = [];
            if (row['Lựa chọn 1 (nếu có)']) options.push(String(row['Lựa chọn 1 (nếu có)']));
            if (row['Lựa chọn 2 (nếu có)']) options.push(String(row['Lựa chọn 2 (nếu có)']));
            if (row['Lựa chọn 3 (nếu có)']) options.push(String(row['Lựa chọn 3 (nếu có)']));
            if (row['Lựa chọn 4 (nếu có)']) options.push(String(row['Lựa chọn 4 (nếu có)']));
          }

          let correctAnswer: any = String(row['Đáp án đúng (Ghi rõ nội dung đáp án hoặc TRUE/FALSE)']);
          if (type === 'true_false') {
            correctAnswer = correctAnswer.toUpperCase() === 'TRUE';
          }

          return {
            subjectId: selectedSubject,
            chapterId: selectedChapter || undefined,
            type: type as QuestionType,
            content: String(row['Nội dung câu hỏi']),
            options,
            correctAnswer,
            difficulty: (row['Độ khó (easy, medium, hard)'] || 'medium') as 'easy' | 'medium' | 'hard',
            explanation: row['Giải thích (tùy chọn)'] ? String(row['Giải thích (tùy chọn)']) : undefined
          };
        });

        await dataProvider.addQuestionsBulk(newQuestions);
        alert(`Đã import thành công ${newQuestions.length} câu hỏi!`);
        setIsImportModalOpen(false);
        loadQuestions();
      } catch (error) {
        console.error(error);
        alert('Có lỗi xảy ra khi đọc file. Vui lòng kiểm tra lại định dạng.');
      }
    };
    reader.readAsBinaryString(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const filteredQuestions = questions.filter(q => {
    const matchType = selectedType ? q.type === selectedType : true;
    const matchSearch = q.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  const getTypeName = (type: QuestionType) => {
    switch (type) {
      case 'multiple_choice': return 'Trắc nghiệm';
      case 'short_answer': return 'Trả lời ngắn';
      case 'true_false': return 'Đúng/Sai';
      case 'fill_blank': return 'Điền khuyết';
      case 'ordering': return 'Sắp xếp';
      default: return type;
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && subjects.length === 0) {
    return <div className="p-6 text-center">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Ngân hàng câu hỏi</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Excel
          </button>
          <button
            onClick={() => {
              resetForm();
              setIsQuestionModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm câu hỏi
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Môn học</label>
          <select
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Chương (Tùy chọn)</label>
          <select
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
            value={selectedChapter}
            onChange={(e) => setSelectedChapter(e.target.value)}
          >
            <option value="">-- Tất cả chương --</option>
            {chapters.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Loại câu hỏi</label>
          <select
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="">-- Tất cả loại --</option>
            <option value="multiple_choice">Trắc nghiệm</option>
            <option value="short_answer">Trả lời ngắn</option>
            <option value="true_false">Đúng/Sai</option>
            <option value="fill_blank">Điền khuyết</option>
            <option value="ordering">Sắp xếp</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
              placeholder="Nội dung câu hỏi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Question List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredQuestions.length === 0 ? (
            <li className="p-6 text-center text-gray-500">Không tìm thấy câu hỏi nào.</li>
          ) : (
            filteredQuestions.map((question) => (
              <li key={question.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getTypeName(question.type)}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                        {question.difficulty === 'easy' ? 'Dễ' : question.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-2">{question.content}</p>
                    
                    {/* Display options for multiple choice */}
                    {question.type === 'multiple_choice' && question.options && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {question.options.map((opt, idx) => (
                          <div key={idx} className={`text-sm p-2 rounded border ${opt === question.correctAnswer ? 'bg-green-50 border-green-200 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                            {String.fromCharCode(65 + idx)}. {opt}
                            {opt === question.correctAnswer && <Check className="inline h-4 w-4 ml-1 text-green-600" />}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Display answer for other types */}
                    {question.type !== 'multiple_choice' && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Đáp án: </span>
                        {question.type === 'true_false' ? (question.correctAnswer ? 'Đúng' : 'Sai') : String(question.correctAnswer)}
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex-shrink-0 flex space-x-2">
                    <button
                      onClick={() => openEditModal(question)}
                      className="text-indigo-600 hover:text-indigo-900 p-1"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="text-red-600 hover:text-red-900 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Question Modal */}
      <Modal
        isOpen={isQuestionModalOpen}
        onClose={() => setIsQuestionModalOpen(false)}
        title={editingQuestion ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveQuestion}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Loại câu hỏi</label>
                        <select
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
                          value={questionForm.type}
                          onChange={(e) => setQuestionForm({ ...questionForm, type: e.target.value as QuestionType })}
                        >
                          <option value="multiple_choice">Trắc nghiệm</option>
                          <option value="short_answer">Trả lời ngắn</option>
                          <option value="true_false">Đúng/Sai</option>
                          <option value="fill_blank">Điền khuyết</option>
                          <option value="ordering">Sắp xếp</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Độ khó</label>
                        <select
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
                          value={questionForm.difficulty}
                          onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value as any })}
                        >
                          <option value="easy">Dễ</option>
                          <option value="medium">Trung bình</option>
                          <option value="hard">Khó</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nội dung câu hỏi</label>
                      <textarea
                        required
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
                        value={questionForm.content}
                        onChange={(e) => setQuestionForm({ ...questionForm, content: e.target.value })}
                      />
                    </div>

                    {/* Dynamic fields based on question type */}
                    {(questionForm.type === 'multiple_choice' || questionForm.type === 'ordering') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Các lựa chọn</label>
                        {questionForm.options?.map((opt, idx) => (
                          <div key={idx} className="flex items-center space-x-2 mb-2">
                            <span className="text-sm font-medium w-6">{String.fromCharCode(65 + idx)}.</span>
                            <input
                              type="text"
                              required
                              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
                              value={opt}
                              onChange={(e) => handleOptionChange(idx, e.target.value)}
                            />
                            <button type="button" onClick={() => removeOption(idx)} className="text-red-500 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </button>
                            {questionForm.type === 'multiple_choice' && (
                              <label className="flex items-center space-x-1 ml-2">
                                <input
                                  type="radio"
                                  name="correctAnswer"
                                  checked={questionForm.correctAnswer === opt && opt !== ''}
                                  onChange={() => setQuestionForm({ ...questionForm, correctAnswer: opt })}
                                />
                                <span className="text-xs text-gray-500">Đáp án</span>
                              </label>
                            )}
                          </div>
                        ))}
                        <button type="button" onClick={addOption} className="text-sm text-emerald-600 hover:text-emerald-700 mt-1">
                          + Thêm lựa chọn
                        </button>
                      </div>
                    )}

                    {questionForm.type === 'true_false' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Đáp án đúng</label>
                        <div className="flex space-x-4">
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="tfAnswer"
                              checked={questionForm.correctAnswer === true || questionForm.correctAnswer === 'true'}
                              onChange={() => setQuestionForm({ ...questionForm, correctAnswer: true })}
                              className="form-radio text-emerald-600"
                            />
                            <span className="ml-2">Đúng (True)</span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="tfAnswer"
                              checked={questionForm.correctAnswer === false || questionForm.correctAnswer === 'false'}
                              onChange={() => setQuestionForm({ ...questionForm, correctAnswer: false })}
                              className="form-radio text-emerald-600"
                            />
                            <span className="ml-2">Sai (False)</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {(questionForm.type === 'short_answer' || questionForm.type === 'fill_blank') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Đáp án đúng</label>
                        <input
                          type="text"
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
                          value={String(questionForm.correctAnswer || '')}
                          onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Giải thích (Tùy chọn)</label>
                      <textarea
                        rows={2}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
                        value={questionForm.explanation || ''}
                        onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                      />
                    </div>
          </div>
          <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-emerald-600 text-base font-medium text-white hover:bg-emerald-700 sm:ml-3 sm:w-auto sm:text-sm">
              Lưu
            </button>
            <button type="button" onClick={() => setIsQuestionModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm">
              Hủy
            </button>
          </div>
        </form>
      </Modal>

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setIsImportModalOpen(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="relative z-20 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Import câu hỏi từ Excel
                  </h3>
                  <button type="button" onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Vui lòng tải file mẫu về, điền dữ liệu theo đúng định dạng và upload lên hệ thống.
                    Các câu hỏi sẽ được thêm vào môn học đang chọn: <span className="font-semibold text-gray-900">{subjects.find(s => s.id === selectedSubject)?.name}</span>.
                  </p>
                  
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={downloadTemplate}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Tải file mẫu (.xlsx)
                    </button>
                  </div>

                  <div className="mt-4 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-2">
                      <label htmlFor="file-upload" className="cursor-pointer font-medium text-emerald-600 hover:text-emerald-500">
                        <span>Tải file lên</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          accept=".xlsx, .xls"
                          className="sr-only"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Chỉ chấp nhận file Excel (.xlsx, .xls)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

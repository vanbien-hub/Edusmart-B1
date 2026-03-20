import React, { useState, useEffect } from 'react';
import { dataProvider } from '../../core/provider';
import { Subject, Topic } from '../../core/types';
import { Modal } from '../../components/Modal';
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

export function Subjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Record<string, Topic[]>>({});
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [activeSubjectId, setActiveSubjectId] = useState<string>('');

  const [subjectForm, setSubjectForm] = useState({ name: '', description: '' });
  const [topicForm, setTopicForm] = useState({ name: '', order: 1 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const subs = await dataProvider.getSubjects();
    setSubjects(subs);
    
    const topicsMap: Record<string, Topic[]> = {};
    for (const sub of subs) {
      topicsMap[sub.id] = await dataProvider.getTopics(sub.id);
    }
    setTopics(topicsMap);
  };

  const toggleSubject = (id: string) => {
    setExpandedSubjects(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSubject) {
      await dataProvider.updateSubject(editingSubject.id, subjectForm);
    } else {
      await dataProvider.addSubject(subjectForm);
    }
    setIsSubjectModalOpen(false);
    loadData();
  };

  const handleTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTopic) {
      await dataProvider.updateTopic(editingTopic.id, topicForm);
    } else {
      await dataProvider.addTopic({ ...topicForm, subjectId: activeSubjectId });
    }
    setIsTopicModalOpen(false);
    loadData();
  };

  const handleDeleteSubject = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa môn học này và tất cả chủ đề bên trong?')) {
      await dataProvider.deleteSubject(id);
      loadData();
    }
  };

  const handleDeleteTopic = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa chủ đề này?')) {
      await dataProvider.deleteTopic(id);
      loadData();
    }
  };

  const openSubjectModal = (subject?: Subject) => {
    if (subject) {
      setEditingSubject(subject);
      setSubjectForm({ name: subject.name, description: subject.description || '' });
    } else {
      setEditingSubject(null);
      setSubjectForm({ name: '', description: '' });
    }
    setIsSubjectModalOpen(true);
  };

  const openTopicModal = (subjectId: string, topic?: Topic) => {
    setActiveSubjectId(subjectId);
    if (topic) {
      setEditingTopic(topic);
      setTopicForm({ name: topic.name, order: topic.order });
    } else {
      setEditingTopic(null);
      const nextOrder = (topics[subjectId]?.length || 0) + 1;
      setTopicForm({ name: '', order: nextOrder });
    }
    setIsTopicModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Quản lý Môn học & Chủ đề</h2>
        <button
          onClick={() => openSubjectModal()}
          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Thêm môn học
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {subjects.map((subject) => (
            <li key={subject.id} className="block hover:bg-gray-50">
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center cursor-pointer" onClick={() => toggleSubject(subject.id)}>
                    {expandedSubjects[subject.id] ? (
                      <ChevronDown className="w-5 h-5 text-gray-400 mr-2" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400 mr-2" />
                    )}
                    <p className="text-lg font-medium text-emerald-600 truncate">{subject.name}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button onClick={() => openTopicModal(subject.id)} className="text-sm text-emerald-600 hover:text-emerald-900 flex items-center">
                      <Plus className="w-4 h-4 mr-1" /> Thêm chủ đề
                    </button>
                    <button onClick={() => openSubjectModal(subject)} className="text-indigo-600 hover:text-indigo-900">
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDeleteSubject(subject.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      {subject.description}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Topics List */}
              {expandedSubjects[subject.id] && (
                <div className="bg-gray-50 px-4 py-3 sm:px-6 border-t border-gray-200">
                  <ul className="divide-y divide-gray-200">
                    {topics[subject.id]?.map((topic) => (
                      <li key={topic.id} className="py-3 flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold mr-3">
                            {topic.order}
                          </span>
                          <span className="text-sm font-medium text-gray-900">{topic.name}</span>
                        </div>
                        <div className="flex space-x-3">
                          <button onClick={() => openTopicModal(subject.id, topic)} className="text-indigo-600 hover:text-indigo-900">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteTopic(topic.id)} className="text-red-600 hover:text-red-900">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                    {(!topics[subject.id] || topics[subject.id].length === 0) && (
                      <li className="py-3 text-sm text-gray-500 italic">Chưa có chủ đề nào.</li>
                    )}
                  </ul>
                </div>
              )}
            </li>
          ))}
          {subjects.length === 0 && (
            <li className="px-4 py-4 sm:px-6 text-sm text-gray-500 text-center">
              Chưa có môn học nào.
            </li>
          )}
        </ul>
      </div>

      {/* Subject Modal */}
      <Modal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        title={editingSubject ? 'Sửa môn học' : 'Thêm môn học mới'}
      >
        <form onSubmit={handleSubjectSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tên môn học</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
              value={subjectForm.name}
              onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mô tả</label>
            <textarea
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
              rows={3}
              value={subjectForm.description}
              onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
            />
          </div>
          <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-emerald-600 text-base font-medium text-white hover:bg-emerald-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm">
              Lưu
            </button>
            <button type="button" onClick={() => setIsSubjectModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm">
              Hủy
            </button>
          </div>
        </form>
      </Modal>

      {/* Topic Modal */}
      <Modal
        isOpen={isTopicModalOpen}
        onClose={() => setIsTopicModalOpen(false)}
        title={editingTopic ? 'Sửa chủ đề' : 'Thêm chủ đề mới'}
      >
        <form onSubmit={handleTopicSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tên chủ đề</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
              value={topicForm.name}
              onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Thứ tự</label>
            <input
              type="number"
              required
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
              value={topicForm.order}
              onChange={(e) => setTopicForm({ ...topicForm, order: parseInt(e.target.value) })}
            />
          </div>
          <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-emerald-600 text-base font-medium text-white hover:bg-emerald-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm">
              Lưu
            </button>
            <button type="button" onClick={() => setIsTopicModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm">
              Hủy
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { dataProvider } from '../../core/provider';
import { Announcement, Class, User } from '../../core/types';
import { Modal } from '../../components/Modal';
import { Plus, Trash2, Bell, Users, UserCircle } from 'lucide-react';
import { format } from 'date-fns';

export function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    classId: '',
    target: 'all' as 'student' | 'parent' | 'all',
    authorId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const currentUser = await dataProvider.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setFormData(prev => ({ ...prev, authorId: currentUser.id }));
    }

    const cls = await dataProvider.getClasses();
    setClasses(cls);
    
    const anns = await dataProvider.getAnnouncements();
    setAnnouncements(anns);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await dataProvider.addAnnouncement(formData);
    setIsModalOpen(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa thông báo này?')) {
      await dataProvider.deleteAnnouncement(id);
      loadData();
    }
  };

  const openModal = () => {
    setFormData({
      title: '',
      content: '',
      classId: '',
      target: 'all',
      authorId: user?.id || ''
    });
    setIsModalOpen(true);
  };

  const getTargetLabel = (target: string) => {
    switch (target) {
      case 'student': return { label: 'Học sinh', icon: Users, color: 'bg-blue-100 text-blue-800' };
      case 'parent': return { label: 'Phụ huynh', icon: UserCircle, color: 'bg-purple-100 text-purple-800' };
      default: return { label: 'Tất cả', icon: Bell, color: 'bg-emerald-100 text-emerald-800' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Quản lý Thông báo</h2>
        <button
          onClick={openModal}
          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Tạo thông báo
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {announcements.map((ann) => {
            const cls = classes.find(c => c.id === ann.classId);
            const targetInfo = getTargetLabel(ann.target);
            
            return (
              <li key={ann.id} className="px-4 py-5 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${targetInfo.color}`}>
                      <targetInfo.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{ann.title}</h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1 space-x-4">
                        <span>{format(new Date(ann.createdAt), 'dd/MM/yyyy HH:mm')}</span>
                        <span>•</span>
                        <span>Lớp: {cls?.name || 'Tất cả các lớp'}</span>
                        <span>•</span>
                        <span>Gửi đến: {targetInfo.label}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(ann.id)} className="text-red-600 hover:text-red-900 p-2">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="mt-4 text-sm text-gray-700 whitespace-pre-wrap pl-12">
                  {ann.content}
                </div>
              </li>
            );
          })}
          {announcements.length === 0 && (
            <li className="px-4 py-8 text-center text-gray-500">
              Chưa có thông báo nào.
            </li>
          )}
        </ul>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tạo thông báo mới"
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
            <label className="block text-sm font-medium text-gray-700">Nội dung</label>
            <textarea
              required
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Lớp học</label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
              >
                <option value="">Tất cả các lớp</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Đối tượng nhận</label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
                value={formData.target}
                onChange={(e) => setFormData({ ...formData, target: e.target.value as any })}
              >
                <option value="all">Tất cả (Học sinh & Phụ huynh)</option>
                <option value="student">Chỉ Học sinh</option>
                <option value="parent">Chỉ Phụ huynh</option>
              </select>
            </div>
          </div>
          <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-emerald-600 text-base font-medium text-white hover:bg-emerald-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm">
              Gửi thông báo
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

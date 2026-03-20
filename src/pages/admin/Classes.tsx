import React, { useState, useEffect } from 'react';
import { dataProvider } from '../../core/provider';
import { Class, User } from '../../core/types';
import { Modal } from '../../components/Modal';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';

export function Classes() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    academicYear: '',
    teacherId: '',
    joinCode: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const cls = await dataProvider.getClasses();
    setClasses(cls);
    const users = await dataProvider.getUsers();
    setTeachers(users.filter(u => u.role === 'teacher'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClass) {
      await dataProvider.updateClass(editingClass.id, formData);
    } else {
      await dataProvider.addClass({ ...formData, studentIds: [] });
    }
    setIsModalOpen(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa lớp học này?')) {
      await dataProvider.deleteClass(id);
      loadData();
    }
  };

  const openModal = (cls?: Class) => {
    if (cls) {
      setEditingClass(cls);
      setFormData({
        name: cls.name,
        academicYear: cls.academicYear || '',
        teacherId: cls.teacherId,
        joinCode: cls.joinCode || ''
      });
    } else {
      setEditingClass(null);
      setFormData({ name: '', academicYear: '', teacherId: teachers[0]?.id || '', joinCode: '' });
    }
    setIsModalOpen(true);
  };

  const filteredClasses = classes.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.joinCode?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Quản lý Lớp học</h2>
        <button
          onClick={() => openModal()}
          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Thêm lớp học
        </button>
      </div>

      <div className="flex items-center bg-white p-2 rounded-md shadow-sm border border-gray-200 w-full max-w-md">
        <Search className="w-5 h-5 text-gray-400 ml-2" />
        <input
          type="text"
          placeholder="Tìm kiếm lớp học..."
          className="w-full p-2 outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên lớp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Niên khóa</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GVCN</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã tham gia</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sĩ số</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredClasses.map((cls) => {
              const teacher = teachers.find(t => t.id === cls.teacherId);
              return (
                <tr key={cls.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cls.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cls.academicYear}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher?.name || 'Chưa có'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cls.joinCode}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cls.studentIds?.length || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openModal(cls)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(cls.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClass ? 'Sửa lớp học' : 'Thêm lớp học mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tên lớp</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Niên khóa</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
              value={formData.academicYear}
              onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Giáo viên chủ nhiệm</label>
            <select
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
              value={formData.teacherId}
              onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
            >
              <option value="">Chọn giáo viên</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mã tham gia</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
              value={formData.joinCode}
              onChange={(e) => setFormData({ ...formData, joinCode: e.target.value })}
            />
          </div>
          <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-emerald-600 text-base font-medium text-white hover:bg-emerald-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
            >
              Lưu
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
            >
              Hủy
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

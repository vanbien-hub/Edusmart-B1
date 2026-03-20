import React, { useState, useEffect, useRef } from 'react';
import { dataProvider } from '../../core/provider';
import { User, Class } from '../../core/types';
import { Modal } from '../../components/Modal';
import { Plus, Edit2, Trash2, Search, Grid, List, Download, MoreVertical, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

export function Students() {
  const [students, setStudents] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    dateOfBirth: '',
    parentPhone: '',
    classId: '',
    gender: 'male' as 'male' | 'female',
    status: 'active' as 'active' | 'inactive',
    avatar: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const users = await dataProvider.getUsers();
    setStudents(users.filter(u => u.role === 'student'));
    const cls = await dataProvider.getClasses();
    setClasses(cls);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStudent) {
      const updateData = { ...formData };
      if (!updateData.password) {
        delete (updateData as any).password;
      }
      await dataProvider.updateStudent(editingStudent.id, updateData);
    } else {
      await dataProvider.addStudent({ ...formData, role: 'student' });
    }
    setIsModalOpen(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa học sinh này?')) {
      await dataProvider.deleteStudent(id);
      loadData();
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Họ tên': 'Nguyễn Văn A',
        'Tên đăng nhập': 'nguyenvana',
        'Mật khẩu': '123456',
        'Ngày sinh (YYYY-MM-DD)': '2008-01-15',
        'SĐT Phụ huynh': '0901234567',
        'Giới tính (Nam/Nữ)': 'Nam',
        'Tên lớp': '10A1'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'Mau_Nhap_Hoc_Sinh.xlsx');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        let successCount = 0;
        for (const row of data as any[]) {
          if (!row['Họ tên'] || !row['Tên đăng nhập']) continue;

          let classId = '';
          if (row['Tên lớp']) {
            const cls = classes.find(c => c.name.toLowerCase() === row['Tên lớp'].toLowerCase().trim());
            if (cls) classId = cls.id;
          }

          const gender = row['Giới tính (Nam/Nữ)']?.toLowerCase() === 'nữ' ? 'female' : 'male';

          await dataProvider.addStudent({
            name: row['Họ tên'],
            username: row['Tên đăng nhập'],
            password: row['Mật khẩu'] || '123456',
            dateOfBirth: row['Ngày sinh (YYYY-MM-DD)'] || '',
            parentPhone: row['SĐT Phụ huynh'] || '',
            classId: classId,
            gender: gender,
            status: 'active',
            role: 'student'
          });
          successCount++;
        }
        
        alert(`Đã nhập thành công ${successCount} học sinh.`);
        loadData();
      } catch (error) {
        console.error('Error importing students:', error);
        alert('Có lỗi xảy ra khi đọc file. Vui lòng kiểm tra lại định dạng file.');
      }
      
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const openModal = (student?: User) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        name: student.name,
        username: student.username,
        password: '',
        dateOfBirth: student.dateOfBirth || '',
        parentPhone: student.parentPhone || '',
        classId: student.classId || '',
        gender: student.gender || 'male',
        status: student.status || 'active',
        avatar: student.avatar || ''
      });
    } else {
      setEditingStudent(null);
      setFormData({ 
        name: '', 
        username: '', 
        password: '', 
        dateOfBirth: '', 
        parentPhone: '', 
        classId: selectedClassId !== 'all' && selectedClassId !== 'unassigned' ? selectedClassId : (classes[0]?.id || ''),
        gender: 'male',
        status: 'active',
        avatar: ''
      });
    }
    setIsModalOpen(true);
  };

  const filteredStudents = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                        s.username.toLowerCase().includes(search.toLowerCase()) ||
                        s.parentPhone?.includes(search);
    const matchClass = selectedClassId === 'all' ? true : 
                       selectedClassId === 'unassigned' ? !s.classId : 
                       s.classId === selectedClassId;
    const matchStatus = statusFilter === 'all' ? true : 
                        statusFilter === 'active' ? (s.status === 'active' || !s.status) : 
                        s.status === statusFilter;
    
    return matchSearch && matchClass && matchStatus;
  });

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Quản lý Học sinh</h2>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden shrink-0">
          <div className="p-4 font-bold text-gray-800 border-b border-gray-100">
            Danh sách lớp
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            <button 
              onClick={() => setSelectedClassId('all')}
              className={`w-full text-left px-3 py-2.5 rounded-lg flex flex-col transition-colors ${selectedClassId === 'all' ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-gray-50 text-gray-700'}`}
            >
              <span className="font-semibold text-sm">Toàn trường</span>
              <span className="text-xs opacity-70 mt-0.5">{students.length} học sinh</span>
            </button>
            
            <div className="my-2 border-t border-gray-100"></div>
            
            {classes.map(c => {
              const count = students.filter(s => s.classId === c.id).length;
              return (
                <button 
                  key={c.id}
                  onClick={() => setSelectedClassId(c.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg flex flex-col transition-colors ${selectedClassId === c.id ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-gray-50 text-gray-700'}`}
                >
                  <span className="font-semibold text-sm">{c.name}</span>
                  <span className="text-xs opacity-70 mt-0.5">{count} học sinh</span>
                </button>
              );
            })}
            
            <div className="my-2 border-t border-gray-100"></div>
            
            <button 
              onClick={() => setSelectedClassId('unassigned')}
              className={`w-full text-left px-3 py-2.5 rounded-lg flex flex-col transition-colors ${selectedClassId === 'unassigned' ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-gray-50 text-gray-700'}`}
            >
              <span className="font-semibold text-sm">Chưa xếp lớp</span>
              <span className="text-xs opacity-70 mt-0.5">{students.filter(s => !s.classId).length} học sinh</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top bar */}
          <div className="flex flex-wrap gap-3 justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-200 mb-4 shrink-0">
            <div className="flex items-center gap-3 flex-1 min-w-[300px]">
              <div className="flex items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 flex-1 max-w-md focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
                <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Tìm kiếm học sinh..."
                  className="bg-transparent border-none outline-none w-full text-sm text-gray-700 placeholder-gray-400"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select 
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 outline-none text-gray-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="active">Đang học</option>
                <option value="inactive">Đã nghỉ</option>
                <option value="all">Tất cả</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleDownloadTemplate}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center transition-colors"
                title="Tải file mẫu"
              >
                <Download className="w-4 h-4 mr-1.5" /> Tải mẫu
              </button>
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 text-sm font-medium flex items-center transition-colors"
              >
                <Upload className="w-4 h-4 mr-1.5" /> Nhập danh sách học sinh
              </button>
              <button
                onClick={() => openModal()}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium flex items-center shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Thêm học sinh
              </button>
              <div className="flex border border-gray-200 rounded-lg overflow-hidden ml-1 shadow-sm">
                 <button 
                   onClick={() => setViewMode('grid')}
                   className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-gray-100 text-gray-800' : 'bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                 >
                   <Grid className="w-4 h-4" />
                 </button>
                 <button 
                   onClick={() => setViewMode('list')}
                   className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-gray-100 text-gray-800' : 'bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                 >
                   <List className="w-4 h-4" />
                 </button>
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ml-1">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
                {filteredStudents.map(student => {
                  const cls = classes.find(c => c.id === student.classId);
                  const isFemale = student.gender === 'female';
                  const isActive = student.status === 'active' || !student.status;
                  
                  // Generate a deterministic avatar if none provided
                  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random&color=fff&size=128`;
                  
                  return (
                    <div key={student.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all relative group">
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <img 
                          src={student.avatar || defaultAvatar} 
                          alt={student.name} 
                          className="w-16 h-16 rounded-xl object-cover border border-gray-100 shadow-sm"
                          referrerPolicy="no-referrer"
                        />
                        <div className={`absolute -bottom-2 -right-2 text-[10px] font-bold px-2 py-0.5 rounded-md border-2 border-white shadow-sm ${isFemale ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                          {isFemale ? 'Nữ' : 'Nam'}
                        </div>
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0 py-1">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-bold text-gray-900 text-sm leading-tight break-words">{student.name}</h3>
                          <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                            {isActive ? 'Đang học' : 'Đã nghỉ'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1.5 truncate flex items-center gap-1">
                          <span className="font-medium text-gray-700">{student.username}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
                          <span>{cls?.name || 'Chưa xếp lớp'}</span>
                          {student.dateOfBirth && (
                            <span className="opacity-70">{new Date(student.dateOfBirth).toLocaleDateString('vi-VN')}</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions (visible on hover) */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/90 backdrop-blur-sm p-1 rounded-lg shadow-sm border border-gray-100">
                        <button onClick={() => openModal(student)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Sửa">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(student.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Xóa">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {filteredStudents.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100 border-dashed">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                      <Search className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-sm">Không tìm thấy học sinh nào phù hợp.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white shadow-sm border border-gray-200 overflow-hidden sm:rounded-xl">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Học sinh</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lớp</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên đăng nhập</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày sinh</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SĐT Phụ huynh</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.map((student) => {
                      const cls = classes.find(c => c.id === student.classId);
                      const isFemale = student.gender === 'female';
                      const isActive = student.status === 'active' || !student.status;
                      const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random&color=fff&size=128`;

                      return (
                        <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 relative">
                                <img className="h-10 w-10 rounded-full object-cover" src={student.avatar || defaultAvatar} alt="" referrerPolicy="no-referrer" />
                                <div className={`absolute -bottom-1 -right-1 text-[8px] font-bold px-1.5 py-0.5 rounded-md border-2 border-white ${isFemale ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                                  {isFemale ? 'Nữ' : 'Nam'}
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                <div className="text-xs text-gray-500">
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {isActive ? 'Đang học' : 'Đã nghỉ'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cls?.name || 'Chưa xếp lớp'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.username}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('vi-VN') : ''}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.parentPhone}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => openModal(student)} className="text-indigo-600 hover:text-indigo-900 mr-4 transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(student.id)} className="text-red-600 hover:text-red-900 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? 'Sửa thông tin học sinh' : 'Thêm học sinh mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tên đăng nhập</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
            <input
              type="text"
              required={!editingStudent}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={editingStudent ? "Để trống nếu không muốn đổi mật khẩu" : "Nhập mật khẩu"}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Ngày sinh</label>
            <input
              type="date"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">SĐT Phụ huynh</label>
            <input
              type="tel"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
              value={formData.parentPhone}
              onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Lớp học</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
              value={formData.classId}
              onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
            >
              <option value="">Chưa xếp lớp</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Giới tính</label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
              >
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
              >
                <option value="active">Đang học</option>
                <option value="inactive">Đã nghỉ</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Ảnh đại diện (URL)</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
              value={formData.avatar}
              onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
              placeholder="https://..."
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

import React, { useState, useEffect } from 'react';
import { dataProvider } from '../../core/provider';
import { User, Class } from '../../core/types';
import { User as UserIcon, Camera, Save, Pencil, Lock, Star, Clock, Award, Trophy, Medal } from 'lucide-react';

const BADGES = [
  { id: 'b1', name: 'Ong Chăm Chỉ', icon: '🐝', earned: true },
  { id: 'b2', name: 'Cây Bút Vàng', icon: '✍️', earned: true },
  { id: 'b3', name: 'Thần Đồng Ngữ Pháp', icon: '🧠', earned: false },
  { id: 'b4', name: 'Nhà Phê Bình', icon: '🧐', earned: false },
  { id: 'b5', name: 'Mọt Sách', icon: '📚', earned: false },
];

const LEADERBOARD = [
  { rank: 1, name: 'Nguyễn Văn An', score: 1250, isCurrentUser: true },
  { rank: 2, name: 'Trần Thị Bích', score: 1120, isCurrentUser: false },
  { rank: 3, name: 'Lê Hoàng Cường', score: 1050, isCurrentUser: false },
  { rank: 4, name: 'Phạm Thu Dung', score: 980, isCurrentUser: false },
  { rank: 5, name: 'Hoàng Minh Tuấn', score: 950, isCurrentUser: false },
];

export function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [userClass, setUserClass] = useState<Class | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = await dataProvider.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setFormData(currentUser);
      if (currentUser.classId) {
        const classes = await dataProvider.getClasses();
        const cls = classes.find(c => c.id === currentUser.classId);
        if (cls) setUserClass(cls);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 5MB before compression)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ text: 'Kích thước ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.', type: 'error' });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        // Create an image element to draw and compress
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 300;
          const MAX_HEIGHT = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 0.7 quality
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setFormData({ ...formData, avatar: compressedDataUrl });
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      const updatedUser = await dataProvider.updateCurrentUser(formData);
      setUser(updatedUser);
      setIsEditing(false);
      setMessage({ text: 'Cập nhật thông tin thành công!', type: 'success' });
      
      // Reload page to update header
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error(error);
      if (error.name === 'QuotaExceededError') {
        setMessage({ text: 'Lỗi: Dung lượng ảnh quá lớn, không thể lưu trữ.', type: 'error' });
      } else {
        setMessage({ text: 'Có lỗi xảy ra khi cập nhật: ' + (error.message || ''), type: 'error' });
      }
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
  };

  const handleSavePassword = async () => {
    if (passwordData.new !== passwordData.confirm) {
      setMessage({ text: 'Mật khẩu mới không khớp.', type: 'error' });
      return;
    }
    
    if (passwordData.new.length < 6) {
      setMessage({ text: 'Mật khẩu mới phải có ít nhất 6 ký tự.', type: 'error' });
      return;
    }

    try {
      // In a real app, you would verify the current password here
      // For this demo, we'll just update it
      await dataProvider.updateCurrentUser({ password: passwordData.new });
      setIsChangingPassword(false);
      setPasswordData({ current: '', new: '', confirm: '' });
      setMessage({ text: 'Đổi mật khẩu thành công!', type: 'success' });
    } catch (error) {
      setMessage({ text: 'Có lỗi xảy ra khi đổi mật khẩu.', type: 'error' });
    }
  };

  if (!user) return null;

  // If editing or changing password, show the old form layout
  if (isEditing || isChangingPassword) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {isChangingPassword ? 'Đổi mật khẩu' : 'Chỉnh sửa hồ sơ'}
          </h2>
          <button
            onClick={() => {
              setIsEditing(false);
              setIsChangingPassword(false);
              setMessage({ text: '', type: '' });
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            Quay lại
          </button>
        </div>

        {message.text && (
          <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <div className="bg-white shadow rounded-lg overflow-hidden">
          {isChangingPassword ? (
            <div className="p-6 sm:p-8 max-w-md mx-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    name="current"
                    value={passwordData.current}
                    onChange={handlePasswordChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0078d4]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                  <input
                    type="password"
                    name="new"
                    value={passwordData.new}
                    onChange={handlePasswordChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0078d4]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    name="confirm"
                    value={passwordData.confirm}
                    onChange={handlePasswordChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0078d4]"
                  />
                </div>
                
                <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100 mt-6">
                  <button
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordData({ current: '', new: '', confirm: '' });
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSavePassword}
                    className="flex items-center px-4 py-2 bg-[#0078d4] text-white rounded-md hover:bg-[#006cbd] transition-colors"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Lưu mật khẩu
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-8">
                {/* Avatar Section */}
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-4xl uppercase overflow-hidden border-4 border-white shadow-lg">
                      {formData.avatar ? (
                        <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        user.name.charAt(0)
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#0078d4] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#006cbd] transition-colors shadow-md border-2 border-white">
                      <Pencil className="w-4 h-4 text-white" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
                </div>

                {/* Info Section */}
                <div className="flex-1 w-full space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0078d4]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
                      <div className="px-3 py-2 bg-gray-100 rounded-md text-gray-500 cursor-not-allowed">
                        {user.username}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0078d4]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
                      <select
                        name="gender"
                        value={formData.gender || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0078d4]"
                      >
                        <option value="">Chọn giới tính</option>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại phụ huynh</label>
                      <input
                        type="text"
                        name="parentPhone"
                        value={formData.parentPhone || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0078d4]"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100 mt-6">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setFormData(user);
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex items-center px-4 py-2 bg-[#0078d4] text-white rounded-md hover:bg-[#006cbd] transition-colors"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Lưu thay đổi
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#2196F3] to-[#673AB7] rounded-xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center sm:justify-between relative overflow-hidden shadow-md">
        <div className="flex items-center space-x-6 z-10">
          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-[#2196F3] font-bold text-4xl uppercase overflow-hidden border-4 border-white shadow-lg flex-shrink-0">
            {user.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              user.name.charAt(0)
            )}
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-2">{user.name}</h2>
            <div className="flex items-center space-x-4 text-sm text-blue-100">
              <span className="flex items-center">
                <UserIcon className="w-4 h-4 mr-1" />
                Lớp {userClass?.name || 'Chưa cập nhật'}
              </span>
              <span>•</span>
              <span>Ngày sinh: {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-6 sm:mt-0 flex space-x-3 z-10">
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-white text-sm font-medium transition-colors flex items-center"
          >
            <Pencil className="w-4 h-4 mr-2" />
            Sửa hồ sơ
          </button>
          <button
            onClick={() => setIsChangingPassword(true)}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-white text-sm font-medium transition-colors flex items-center"
          >
            <Lock className="w-4 h-4 mr-2" />
            Đổi mật khẩu
          </button>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-1/2 w-60 h-60 bg-blue-400 opacity-20 rounded-full blur-3xl"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#fffdf0] border border-[#f5e6b3] rounded-xl p-6 flex items-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-[#fff5cc] flex items-center justify-center mr-4 flex-shrink-0">
            <Star className="w-6 h-6 text-[#f5a623]" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">ĐIỂM TÍCH LŨY</p>
            <p className="text-3xl font-bold text-gray-900">1250</p>
          </div>
        </div>
        
        <div className="bg-[#f0f7ff] border border-[#d1e5f9] rounded-xl p-6 flex items-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-[#e0f0ff] flex items-center justify-center mr-4 flex-shrink-0">
            <Clock className="w-6 h-6 text-[#0078d4]" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">THỜI GIAN HỌC TẬP</p>
            <p className="text-3xl font-bold text-gray-900">5 giờ 45 phút</p>
          </div>
        </div>
        
        <div className="bg-[#faf5ff] border border-[#e9d5ff] rounded-xl p-6 flex items-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-[#f3e8ff] flex items-center justify-center mr-4 flex-shrink-0">
            <Award className="w-6 h-6 text-[#9333ea]" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">HUY HIỆU ĐẠT ĐƯỢC</p>
            <p className="text-3xl font-bold text-gray-900">2 / 5</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Badges Collection */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Bộ sưu tập Huy hiệu</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {BADGES.map(badge => (
                <div 
                  key={badge.id} 
                  className={`flex flex-col items-center justify-center p-6 rounded-xl border ${
                    badge.earned 
                      ? 'bg-white border-gray-200 shadow-sm' 
                      : 'bg-gray-50 border-gray-100 opacity-60 grayscale'
                  }`}
                >
                  <div className="text-4xl mb-3">{badge.icon}</div>
                  <p className="text-sm font-bold text-gray-900 text-center mb-2">{badge.name}</p>
                  {badge.earned ? (
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Đã đạt</span>
                  ) : (
                    <span className="text-xs font-medium text-gray-400">Khóa</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center">
            <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
            <div>
              <h3 className="text-lg font-bold text-gray-900">Bảng Vinh Danh</h3>
              <p className="text-xs text-gray-500">Top 5 học sinh có điểm cao nhất</p>
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {LEADERBOARD.map((student, index) => (
                <div 
                  key={index} 
                  className={`flex items-center p-3 rounded-lg border ${
                    student.isCurrentUser 
                      ? 'bg-[#fffdf0] border-[#f5e6b3]' 
                      : 'bg-white border-gray-100'
                  }`}
                >
                  <div className="w-8 flex justify-center mr-2">
                    {student.rank === 1 ? (
                      <span className="text-2xl">👑</span>
                    ) : student.rank === 2 ? (
                      <span className="text-2xl">🥈</span>
                    ) : student.rank === 3 ? (
                      <span className="text-2xl">🥉</span>
                    ) : (
                      <span className="text-gray-400 font-bold">{student.rank}</span>
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs mr-3 flex-shrink-0">
                    {student.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${student.isCurrentUser ? 'text-gray-900' : 'text-gray-700'}`}>
                      {student.name} {student.isCurrentUser && '(Bạn)'}
                    </p>
                  </div>
                  <div className="font-bold text-[#0078d4] ml-2">
                    {student.score}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Certificates */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Giấy chứng nhận & Bằng khen</h3>
        </div>
        <div className="p-8 text-center text-gray-500">
          <Medal className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p>Bạn chưa có giấy chứng nhận nào.</p>
          <p className="text-sm mt-1">Hãy hoàn thành các khóa học để nhận chứng nhận nhé!</p>
        </div>
      </div>
    </div>
  );
}

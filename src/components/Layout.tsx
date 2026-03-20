import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BookOpen, Users, LayoutDashboard, FileText, Bell, LogOut, Menu, User as UserIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { dataProvider } from '../core/provider';
import { User } from '../core/types';

interface LayoutProps {
  role: 'teacher' | 'student';
}

export function Layout({ role }: LayoutProps) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await dataProvider.getCurrentUser();
      if (!currentUser) {
        navigate('/');
      } else if (role === 'teacher' && currentUser.role === 'student') {
        navigate('/app');
      } else if (role === 'student' && currentUser.role !== 'student') {
        navigate('/admin');
      } else {
        setUser(currentUser);
      }
    };
    checkAuth();
  }, [navigate, role]);

  const handleLogout = async () => {
    await dataProvider.logout();
    navigate('/');
  };

  const teacherLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Bảng điều khiển' },
    { to: '/admin/classes', icon: Users, label: 'Lớp học' },
    { to: '/admin/students', icon: Users, label: 'Học sinh' },
    { to: '/admin/subjects', icon: BookOpen, label: 'Môn học & Chủ đề' },
    { to: '/admin/lessons', icon: BookOpen, label: 'Bài giảng' },
    { to: '/admin/questions', icon: BookOpen, label: 'Ngân hàng câu hỏi' },
    { to: '/admin/assignments', icon: FileText, label: 'Bài tập' },
    { to: '/admin/gradebook', icon: FileText, label: 'Sổ điểm' },
    { to: '/admin/announcements', icon: Bell, label: 'Thông báo' },
    { to: '/admin/reports', icon: LayoutDashboard, label: 'Báo cáo' },
  ];

  const studentLinks = [
    { to: '/app', icon: LayoutDashboard, label: 'Bảng điều khiển' },
    { to: '/app/lessons', icon: BookOpen, label: 'Bài giảng' },
    { to: '/app/assignments', icon: FileText, label: 'Bài tập' },
    { to: '/app/profile', icon: UserIcon, label: 'Hồ sơ & Thành tích' },
  ];

  const links = role === 'teacher' ? teacherLinks : studentLinks;

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-emerald-50/40 text-gray-900">
      {/* Sidebar */}
      <aside
        className={clsx(
          'bg-white border-r border-gray-200 transition-all duration-300 flex flex-col',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
          <BookOpen className="w-8 h-8 text-emerald-600" />
          {sidebarOpen && <span className="ml-3 font-bold text-lg">Quản lý học sinh</span>}
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/admin' || link.to === '/app'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center px-3 py-2.5 rounded-lg transition-colors',
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )
              }
            >
              <link.icon className={clsx('w-5 h-5 flex-shrink-0', sidebarOpen ? 'mr-3' : 'mx-auto')} />
              {sidebarOpen && <span>{link.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className={clsx(
              'flex items-center w-full px-3 py-2.5 text-gray-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors',
              !sidebarOpen && 'justify-center'
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="ml-3">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {role === 'student' && (
          <div className="bg-emerald-600 text-white py-1.5 overflow-hidden flex items-center">
            <div className="animate-marquee whitespace-nowrap text-sm font-medium">
              <span className="mx-8">🌟 Hiền tài là nguyên khí quốc gia</span>
              <span className="mx-8">📚 Học, học nữa, học mãi</span>
              <span className="mx-8">🎓 Tiên học lễ, hậu học văn</span>
              <span className="mx-8">🎉 Chào mừng ngày nhà giáo Việt Nam 20/11/2026</span>
              <span className="mx-8">💡 Tri thức là sức mạnh</span>
            </div>
          </div>
        )}
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="ml-4 text-xl font-semibold text-gray-900">
              {role === 'teacher' ? 'Cổng Giáo Viên' : 'Cổng Học Sinh'}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-500 relative">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1.5 right-1.5 block w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-right hidden sm:block">
                <p className="font-medium text-gray-900">{user.name}</p>
                <p className="text-gray-500 text-xs">{user.username}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold uppercase overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0)
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

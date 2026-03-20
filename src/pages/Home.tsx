import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, User, Lock, Eye, EyeOff } from 'lucide-react';
import { dataProvider } from '../core/provider';

export function Home() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await dataProvider.login(username, password);
      if (user) {
        if (user.role === 'teacher') {
          navigate('/admin');
        } else {
          navigate('/app');
        }
      } else {
        setError('Tên đăng nhập hoặc mật khẩu không chính xác.');
      }
    } catch (err) {
      setError('Đã xảy ra lỗi khi đăng nhập.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans bg-cover bg-center bg-no-repeat"
      style={{ 
        // Thay thế URL này bằng đường dẫn tới hình ảnh thực tế của bạn
        // Bạn có thể tải ảnh lên thư mục public và dùng url('/ten-anh.jpg')
        backgroundImage: `url('https://images.unsplash.com/photo-1588072432836-e10032774350?q=80&w=2072&auto=format&fit=crop')`,
        backgroundColor: '#87CEEB' // Màu nền dự phòng (xanh da trời)
      }}
    >
      {/* Lớp phủ mờ nhẹ để làm nổi bật form đăng nhập */}
      <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white/30 backdrop-blur-sm rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.2)] p-8 sm:p-10 relative z-10 mt-16 border border-white/40">
        
        {/* Logo Circle */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-32 h-32 bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-2xl rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.15)] border border-white/50 z-20">
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-transparent to-green-100/50"></div>
          <svg viewBox="0 0 120 120" className="w-24 h-24 relative z-10 drop-shadow-md">
            {/* Sun Rays */}
            <g stroke="#ffc107" strokeWidth="1.5" strokeLinecap="round">
              {/* Center ray */}
              <line x1="60" y1="40" x2="60" y2="5" />
              {/* Left rays */}
              <line x1="56" y1="41" x2="48" y2="8" />
              <line x1="52" y1="42" x2="38" y2="15" />
              <line x1="48" y1="45" x2="28" y2="25" />
              <line x1="45" y1="48" x2="20" y2="35" />
              <line x1="43" y1="52" x2="15" y2="48" />
              <line x1="42" y1="56" x2="12" y2="58" />
              {/* Right rays */}
              <line x1="64" y1="41" x2="72" y2="8" />
              <line x1="68" y1="42" x2="82" y2="15" />
              <line x1="72" y1="45" x2="92" y2="25" />
              <line x1="75" y1="48" x2="100" y2="35" />
              <line x1="77" y1="52" x2="105" y2="48" />
              <line x1="78" y1="56" x2="108" y2="58" />
            </g>

            {/* Sun Body */}
            <path d="M 35 60 C 35 45 45 35 60 35 C 75 35 85 45 85 60 Z" fill="#ffc107" />

            {/* Book Base / Outer Pages */}
            <path d="M 60 110 C 40 95 20 90 5 90 L 15 75 C 30 75 45 80 60 95 C 75 80 90 75 105 75 L 115 90 C 100 90 80 95 60 110 Z" fill="#2563eb" />
            
            {/* Book Middle Pages */}
            <path d="M 60 102 C 45 88 25 82 12 82 L 22 68 C 35 68 48 75 60 88 C 72 75 85 68 98 68 L 108 82 C 95 82 75 88 60 102 Z" fill="#1d4ed8" />
            
            {/* Book Inner Pages */}
            <path d="M 60 94 C 48 82 32 75 20 75 L 30 62 C 40 62 50 68 60 80 C 70 68 80 62 90 62 L 100 75 C 88 75 72 82 60 94 Z" fill="#1e40af" />
          </svg>
        </div>

        {/* Title & Subtitle */}
        <div className="text-center mt-12 mb-8">
          <h2 className="text-[2.5rem] sm:text-[3rem] font-black tracking-tight mb-2">
            <span className="text-[#ff5722]">Edu</span>
            <span className="text-[#e91e63]">Smart</span>
            <span className="text-[#9c27b0]">++</span>
          </h2>
          <h3 className="text-[0.65rem] sm:text-[0.95rem] font-black text-[#004d40] uppercase tracking-wider w-full whitespace-nowrap drop-shadow-[0_1px_2px_rgba(255,255,255,1)]">
            HỆ THỐNG QUẢN LÍ HỌC TẬP THÔNG MINH
          </h3>
        </div>

        {/* Login Form */}
        <form className="space-y-5" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-md">
              <p className="text-sm text-red-700 text-center">{error}</p>
            </div>
          )}

          {/* Username Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-600 drop-shadow-sm" strokeWidth={2.5} />
            </div>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="block w-full pl-12 pr-4 py-3.5 border border-white/60 rounded-full bg-white/60 backdrop-blur-md text-gray-900 placeholder-gray-700 focus:outline-none focus:border-white focus:bg-white/80 transition-all font-bold shadow-sm"
              placeholder="Tên đăng nhập"
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-600 drop-shadow-sm" strokeWidth={2.5} />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-12 pr-12 py-3.5 border border-white/60 rounded-full bg-white/60 backdrop-blur-md text-gray-900 placeholder-gray-700 focus:outline-none focus:border-white focus:bg-white/80 transition-all font-bold shadow-sm"
              placeholder="Mật khẩu"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-4 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-600 hover:text-gray-900 transition-colors drop-shadow-sm" strokeWidth={2.5} />
              ) : (
                <Eye className="h-5 w-5 text-gray-600 hover:text-gray-900 transition-colors drop-shadow-sm" strokeWidth={2.5} />
              )}
            </button>
          </div>

          {/* Options */}
          <div className="flex items-center justify-between px-2 pt-1 pb-2">
            <div className="flex items-center">
              <input
                id="show-password"
                name="show-password"
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="h-4 w-4 text-[#ff9800] focus:ring-[#ff9800] border-gray-400 rounded cursor-pointer"
              />
              <label htmlFor="show-password" className="ml-2 block text-sm text-gray-800 cursor-pointer font-bold drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
                Hiển thị mật khẩu
              </label>
            </div>
            <div className="text-sm">
              <a href="#" className="font-bold text-gray-800 hover:text-black transition-colors drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
                Quên mật khẩu
              </a>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-full shadow-[0_4px_14px_0_rgba(46,125,50,0.39)] text-base font-bold text-white bg-gradient-to-r from-[#388e3c] to-[#4caf50] hover:from-[#2e7d32] hover:to-[#43a047] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#388e3c] disabled:opacity-50 transition-all uppercase tracking-wide"
            >
              {loading ? 'Đang đăng nhập...' : 'ĐĂNG NHẬP'}
            </button>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-white font-bold z-10 tracking-wide drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] flex flex-col items-center gap-2">
        <div>Thiết kế & phát triển bởi: Văn Biển</div>
        <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/30 hover:bg-white/30 transition-colors cursor-pointer">
          <svg viewBox="0 0 100 100" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" rx="22" fill="#0068FF"/>
            <path d="M15 91 L36.5 82.5 L50 100 L25 100 Z" fill="#0055d4"/>
            <path d="M50 14C25.7 14 6 30.1 6 50C6 61.5 12.5 71.7 22.6 78C21.5 84.5 15 91 15 91C15 91 27.5 89.5 36.5 82.5C40.6 83.7 45.2 84.5 50 84.5C74.3 84.5 94 68.4 94 48.5C94 28.6 74.3 14 50 14Z" fill="white"/>
            <text x="50" y="61" fill="#0068FF" fontFamily="Arial, sans-serif" fontSize="34" fontWeight="bold" textAnchor="middle" letterSpacing="-1">Zalo</text>
          </svg>
          <span className="text-white font-bold tracking-wider">0335.6565.97</span>
        </div>
      </div>
    </div>
  );
}

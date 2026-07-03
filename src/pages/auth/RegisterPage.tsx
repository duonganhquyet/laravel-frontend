import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import { authApi } from '../../api/auth.api';
import { useToastStore } from '../../store/toast.store';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', confirmPassword: '', otp: ''
  });
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSendOtp = async () => {
    if (!formData.email) {
      setError('Vui lòng nhập email trước!');
      useToastStore.getState().warning('Vui lòng nhập email trước!');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await authApi.sendOtp({ email: formData.email });
      setIsOtpSent(true);
      useToastStore.getState().success('Mã OTP đã được gửi đến email của bạn!');
    } catch (err: unknown) {
      let errMsg = 'Lỗi khi gửi OTP';
      if (err instanceof AxiosError) {
        errMsg = err.response?.data?.message || errMsg;
      }
      setError(errMsg);
      useToastStore.getState().error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      useToastStore.getState().warning('Mật khẩu xác nhận không khớp!');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.register(formData);
      useToastStore.getState().success('Đăng ký tài khoản thành công!');
      navigate('/login');
    } catch (err: unknown) {
      let errMsg = 'Đăng ký thất bại!';
      if (err instanceof AxiosError) {
        errMsg = err.response?.data?.message || errMsg;
      }
      setError(errMsg);
      useToastStore.getState().error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center mesh-bg p-4 relative overflow-hidden py-10">
      {/* Abstract background shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/20 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-400/20 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md animate-fade-in-up z-10">
        <div className="glass-card p-8 md:p-10 text-center">
          {/* Logo */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30 transform transition-transform hover:scale-105">
            <span className="text-3xl text-white">✨</span>
          </div>

          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-800 to-pink-800 mb-2">
            Tạo tài khoản
          </h1>
          <p className="text-slate-500 mb-8 font-medium">Tham gia và bắt đầu trò chuyện ngay hôm nay</p>

          <form onSubmit={handleRegister} className="space-y-4 text-left">
            {error && (
              <div className="p-3 bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 rounded-xl text-sm font-medium animate-fade-in-up">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Họ và tên</label>
              <input
                name="fullName"
                type="text"
                placeholder="Nguyễn Văn A"
                className="w-full px-4 py-3 rounded-2xl glass-input text-slate-800 placeholder:text-slate-400"
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Email</label>
              <div className="flex gap-2">
                <input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  className="flex-1 px-4 py-3 rounded-2xl glass-input text-slate-800 placeholder:text-slate-400"
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isLoading}
                  className="px-4 py-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 font-semibold rounded-2xl transition-colors border border-indigo-100 shrink-0"
                >
                  {isOtpSent ? 'Gửi lại' : 'Gửi OTP'}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Mã OTP</label>
              <input
                name="otp"
                type="text"
                placeholder="Nhập mã 6 chữ số"
                className="w-full px-4 py-3 rounded-2xl glass-input text-slate-800 placeholder:text-slate-400 text-center tracking-widest font-mono text-lg"
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Mật khẩu</label>
              <input
                name="password"
                type="password"
                placeholder="Tối thiểu 8 ký tự"
                className="w-full px-4 py-3 rounded-2xl glass-input text-slate-800 placeholder:text-slate-400"
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Xác nhận mật khẩu</label>
              <input
                name="confirmPassword"
                type="password"
                placeholder="Nhập lại mật khẩu"
                className="w-full px-4 py-3 rounded-2xl glass-input text-slate-800 placeholder:text-slate-400"
                onChange={handleChange}
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-2xl shadow-lg shadow-purple-500/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : 'Tạo tài khoản'}
            </button>
            
            <div className="text-center mt-6 text-sm text-slate-500 font-medium pt-4 border-t border-slate-100">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-purple-600 hover:text-purple-700 font-bold hover:underline underline-offset-4 transition-all">
                Đăng nhập
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
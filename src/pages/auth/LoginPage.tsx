import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth.store'; 
import type { User } from '../../types/user.type';
import { useToastStore } from '../../store/toast.store';
import { ForgotPasswordModal } from './ForgotPasswordModal';

interface AuthResponse {
  user: User;
  accessToken: string;
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.login({ email, password });
      const { user, accessToken } = response.data as unknown as AuthResponse; 
      
      setAuth(user, accessToken);
      useToastStore.getState().success('Đăng nhập thành công! Chào mừng bạn quay trở lại.');
      navigate("/");

    } catch (err: unknown) {
      let errMsg = 'Đăng nhập thất bại. Vui lòng kiểm tra lại.';
      if (err instanceof AxiosError) {
        errMsg = err.response?.data?.message || errMsg;
      }
      setError(errMsg);
      useToastStore.getState().error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center mesh-bg p-4 relative overflow-hidden">
      {/* Abstract background shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/20 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-400/20 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md animate-fade-in-up z-10">
        <div className="glass-card p-8 md:p-10 text-center">
          {/* Logo */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 transform transition-transform hover:scale-105">
            <span className="text-3xl text-white">✨</span>
          </div>

          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-800 to-purple-800 mb-2">
            Chào mừng trở lại
          </h1>
          <p className="text-slate-500 mb-8 font-medium">Đăng nhập để tiếp tục trò chuyện</p>

          <form onSubmit={handleLogin} className="space-y-5 text-left">
            {error && (
              <div className="p-3 bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 rounded-xl text-sm font-medium animate-fade-in-up">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Email</label>
              <input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl glass-input text-slate-800 placeholder:text-slate-400"
                required
              />
            </div>

            <div className="space-y-1.5 relative">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-semibold text-slate-700">Mật khẩu</label>
                <button 
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:underline transition-all"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl glass-input text-slate-800 placeholder:text-slate-400 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 focus:outline-none"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            <button 
              id="login-submit"
              type="submit" 
              disabled={isLoading}
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-500/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : 'Đăng nhập'}
            </button>
            
            <div className="text-center mt-6 text-sm text-slate-500 font-medium pt-4 border-t border-slate-100">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-bold hover:underline underline-offset-4 transition-all">
                Đăng ký ngay
              </Link>
            </div>
          </form>
        </div>
      </div>
      
      <ForgotPasswordModal 
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
    </div>
  );
};
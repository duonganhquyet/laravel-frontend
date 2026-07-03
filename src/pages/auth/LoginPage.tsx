import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth.store'; 
import type { User } from '../../types/user.type';
import { useToastStore } from '../../store/toast.store';

interface AuthResponse {
  user: User;
  accessToken: string;
}

interface LoginApiResponse {
  data: AuthResponse;
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

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

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Mật khẩu</label>
              <input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl glass-input text-slate-800 placeholder:text-slate-400"
                required
              />
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
    </div>
  );
};
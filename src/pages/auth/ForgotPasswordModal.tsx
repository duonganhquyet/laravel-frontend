import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { AxiosError } from 'axios';
import { authApi } from '../../api/auth.api';
import { useToastStore } from '../../store/toast.store';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setStep(2);
      useToastStore.getState().success('Gửi yêu cầu thành công! Vui lòng kiểm tra email của bạn để lấy mã OTP.');
    } catch (err: unknown) {
      let errorMessage = 'Đã xảy ra lỗi không xác định.';
      if (err instanceof AxiosError) {
        errorMessage = err.response?.data?.message || 'Lỗi khi gửi yêu cầu khôi phục mật khẩu.';
      }
      useToastStore.getState().error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !password || !confirmPassword) return;

    if (password !== confirmPassword) {
      useToastStore.getState().error('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword(otp, { password, confirmPassword });
      useToastStore.getState().success('Đổi mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.');
      handleClose();
    } catch (err: unknown) {
      let errorMessage = 'Đã xảy ra lỗi không xác định.';
      if (err instanceof AxiosError) {
        errorMessage = err.response?.data?.message || 'Lỗi khi đặt lại mật khẩu.';
      }
      useToastStore.getState().error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setEmail('');
    setOtp('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/40 backdrop-blur-md transition-all duration-300"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="glass-card shadow-2xl w-[95%] sm:w-[90%] max-w-md p-8 transform transition-all duration-300 relative overflow-hidden animate-fade-in-up border border-white/20">
        
        {/* Glow effect backdrops */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[60px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-purple-500/10 blur-[60px] pointer-events-none"></div>

        {/* Header */}
        <div className="flex justify-between items-center mb-6 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔒</span>
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-800 to-purple-800">
              Quên mật khẩu
            </h2>
          </div>
          <button 
            onClick={handleClose} 
            className="p-2 hover:bg-slate-100/80 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-5 text-left relative z-10">
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Vui lòng nhập địa chỉ email đã đăng ký. Chúng tôi sẽ gửi một mã OTP xác thực qua email để hỗ trợ bạn đặt lại mật khẩu.
            </p>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 ml-1">Email của bạn</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </span>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl glass-input text-slate-800 placeholder:text-slate-400 outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold rounded-2xl transition-colors text-sm"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isLoading || !email}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 text-sm"
              >
                {isLoading && (
                  <svg className="animate-spin w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                Gửi mã OTP
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5 text-left relative z-10">
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Mã OTP đã được gửi đến <strong className="text-indigo-600">{email}</strong>. Hãy điền mã OTP và tạo mật khẩu mới.
            </p>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 ml-1">Mã bảo mật OTP</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.952 11.952 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Nhập mã 6 chữ số"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.toUpperCase())}
                  className={`w-full pr-4 py-3 rounded-2xl glass-input text-slate-800 placeholder:text-slate-400 outline-none transition-all ${
                    otp 
                      ? 'pl-4 text-center tracking-[0.5em] font-mono text-xl font-black' 
                      : 'pl-12 text-left tracking-normal font-sans text-sm font-medium'
                  }`}
                  maxLength={6}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 ml-1">Mật khẩu mới</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Tối thiểu 8 ký tự"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 rounded-2xl glass-input text-slate-800 placeholder:text-slate-400 outline-none"
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

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 ml-1">Xác nhận mật khẩu mới</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 rounded-2xl glass-input text-slate-800 placeholder:text-slate-400 outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 focus:outline-none"
                >
                  {showConfirmPassword ? (
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

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold rounded-2xl transition-colors text-sm"
              >
                Quay lại
              </button>
              <button
                type="submit"
                disabled={isLoading || !otp || !password || !confirmPassword}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-2xl transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 text-sm"
              >
                {isLoading && (
                  <svg className="animate-spin w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                Đặt lại mật khẩu
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};

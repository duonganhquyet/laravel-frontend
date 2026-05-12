import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import { authApi } from '../../api/auth.api';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', confirmPassword: '', otp: ''
  });
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSendOtp = async () => {
    if (!formData.email) {
      setError('Vui lòng nhập email trước!');
      return;
    }
    setError('');
    try {
      await authApi.sendOtp({ email: formData.email });
      setIsOtpSent(true);
      alert('Mã OTP đã được gửi đến email của bạn!');
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || 'Lỗi khi gửi OTP');
      } else {
        setError('Lỗi không xác định khi gửi OTP');
      }
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }

    try {
      await authApi.register(formData);
      alert('Đăng ký thành công!');
      navigate('/login');
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || 'Đăng ký thất bại!');
      } else {
        setError('Lỗi không xác định khi đăng ký.');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleRegister} className="w-96 bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-green-600">Đăng Ký</h2>
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
        
        <input name="fullName" type="text" placeholder="Họ và tên" className="w-full mb-3 p-2 border rounded" onChange={handleChange} required />
        
        <div className="flex mb-3 gap-2">
          <input name="email" type="email" placeholder="Email" className="w-full p-2 border rounded" onChange={handleChange} required />
          <button type="button" onClick={handleSendOtp} className="bg-gray-200 px-3 rounded whitespace-nowrap text-sm hover:bg-gray-300">
            {isOtpSent ? 'Gửi lại OTP' : 'Gửi OTP'}
          </button>
        </div>

        <input name="otp" type="text" placeholder="Mã OTP" className="w-full mb-3 p-2 border rounded" onChange={handleChange} required />
        <input name="password" type="password" placeholder="Mật khẩu" className="w-full mb-3 p-2 border rounded" onChange={handleChange} required />
        <input name="confirmPassword" type="password" placeholder="Xác nhận mật khẩu" className="w-full mb-6 p-2 border rounded" onChange={handleChange} required />
        
        <button type="submit" className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">Đăng ký</button>
        
        <div className="mt-4 text-center text-sm">
          Đã có tài khoản? <Link to="/login" className="text-green-600 hover:underline">Đăng nhập</Link>
        </div>
      </form>
    </div>
  );
};
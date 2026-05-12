import { useAuthStore } from "../store/auth.store";
import type { LoginPayload, RegisterPayload } from "../api/auth.api";

export function useAuth() {
  const { setAuth, logout } = useAuthStore();

  const loginHandler = async (data: LoginPayload) => {
    // MOCK
    setAuth({
      UserId: 1,
      FullName: "User Demo",
      Email: data.email,
      Avatar: "",
      IsOnline: true,
      LastActive: new Date().toISOString(),
      Role: "user",
      IsActive: true,
      CreateAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
    }, "mock-token");
  };

  const registerHandler = async (data: RegisterPayload) => {
    // MOCK
    setAuth({
      UserId: 1,
      FullName: data.fullName,
      Email: data.email,
      Avatar: "",
      IsOnline: true,
      LastActive: new Date().toISOString(),
      Role: "user",
      IsActive: true,
      CreateAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
    }, "mock-token");
  };

  return {
    loginHandler,
    registerHandler,
    logout,
  };
}

import { useAuthStore } from '../store/auth.store';
import { authApi }      from '../api/auth.api';
import type { LoginPayload, RegisterPayload } from '../api/auth.api';
import type { User } from '../types/user.type';

function normalizeUser(raw: any): User {
  return {
    _id:      raw._id ?? String(raw.id),
    id:       raw.id  ?? raw._id,
    fullName: raw.fullName ?? raw.full_name ?? '',
    email:    raw.email ?? '',
    avatar:   raw.avatar ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export function useAuth() {
  const { setAuth, logout: storeLogout } = useAuthStore();

  const loginHandler = async (data: LoginPayload) => {
    const res = await authApi.login(data);
    const body = res.data as any;

    const user         = normalizeUser(body.data?.user ?? body.user);
    const accessToken  = body.data?.accessToken  ?? body.accessToken;
    const refreshToken = body.data?.refreshToken ?? body.refreshToken;

    setAuth(user, accessToken, refreshToken);
    return user;
  };

  const registerHandler = async (data: RegisterPayload) => {
    const res = await authApi.register(data);
    const body = res.data as any;

    const user         = normalizeUser(body.data?.user ?? body.user);
    const accessToken  = body.data?.accessToken  ?? body.accessToken;
    const refreshToken = body.data?.refreshToken ?? body.refreshToken;

    setAuth(user, accessToken, refreshToken);
    return user;
  };

  const logout = async () => {
    try {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        await authApi.logout({ refreshToken });
      }
    } catch (_) {
      // ignore logout errors
    } finally {
      storeLogout();
    }
  };

  return {
    loginHandler,
    registerHandler,
    logout,
  };
}

import { api, unwrap } from '../api/http';
import { User } from '../api/types';

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthResult = {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt?: string;
  };
};

export const authService = {
  login: (payload: LoginPayload) => unwrap<AuthResult>(api.post('/auth/login', payload)),
  logout: (refreshToken: string) => unwrap<null>(api.post('/auth/logout', { refreshToken })),
  profile: () => unwrap<User>(api.get('/auth/profile')),
  changePassword: (payload: { currentPassword: string; newPassword: string }) => (
    unwrap<null>(api.patch('/auth/change-password', payload))
  ),
};

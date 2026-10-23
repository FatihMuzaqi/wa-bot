import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService, LoginPayload } from '../services/auth.service';
import { clearTokens, getRefreshToken, isAuthenticated, setTokens } from '../api/authStorage';

export const useProfile = () => useQuery({
  queryKey: ['auth', 'profile'],
  queryFn: authService.profile,
  enabled: isAuthenticated(),
});

export const useLogin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: async (data) => {
      setTokens(data.tokens);
      await queryClient.invalidateQueries({ queryKey: ['auth'] });
      navigate('/dashboard', { replace: true });
    },
  });
};

export const useLogout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(getRefreshToken() || ''),
    onSettled: async () => {
      clearTokens();
      queryClient.clear();
      navigate('/login', { replace: true });
    },
  });
};

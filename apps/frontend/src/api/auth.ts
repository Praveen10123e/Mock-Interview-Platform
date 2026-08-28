import api from './axios/instance';

export const authApi = {
  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    const response = await api.post('/auth/change-password', data);
    return response.data;
  },
  deleteAccount: async () => {
    const response = await api.delete('/auth/account');
    return response.data;
  },
};

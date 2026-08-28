import axios from 'axios';
import { requestInterceptor, requestErrorInterceptor } from '../interceptors/request';
import { responseInterceptor, responseErrorInterceptor } from '../interceptors/response';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(requestInterceptor, requestErrorInterceptor);
api.interceptors.response.use(responseInterceptor, responseErrorInterceptor);

export default api;

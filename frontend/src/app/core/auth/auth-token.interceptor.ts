import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MockCurrentUserStore } from './mock-current-user.store';

const API_BASE_URL = 'http://localhost:8080/api';

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const userStore = inject(MockCurrentUserStore);
  const accessToken = userStore.getAccessToken();
  const isApiRequest = request.url.startsWith(API_BASE_URL);

  if (!accessToken && !isApiRequest) {
    return next(request);
  }

  return next(request.clone({
    ...(accessToken ? { setHeaders: { Authorization: `Bearer ${accessToken}` } } : {}),
    withCredentials: isApiRequest || request.withCredentials
  }));
};

import { HttpInterceptorFn } from '@angular/common/http';

const ACCESS_TOKEN_KEY = 'vob.accessToken';

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

  if (!accessToken) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`
      }
    })
  );
};

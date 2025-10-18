import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth-service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Get token from AuthService
  const token = authService.getToken();

  // Skip auth for public endpoints
  const publicEndpoints = [
    '/api/v1/auth/login',
    '/api/v1/auth/org-register',
    '/api/v1/auth/verify-email'
  ];

  const isPublicEndpoint = publicEndpoints.some(endpoint => req.url.includes(endpoint));
  
  // Don't add auth headers to external URLs or public endpoints
  const isExternalUrl = req.url.includes('cloudinary.com') || 
                        (req.url.includes('http://') && !req.url.includes('localhost')) ||
                        (req.url.includes('https://') && !req.url.includes('localhost'));

  if (token && !isExternalUrl && !isPublicEndpoint) {
  // Check if token is expired before sending the request
  if (authService.isTokenExpired()) {
    console.warn('Token expired. Logging out user...');
    authService.logout();
    router.navigate(['/login']);
    return throwError(() => new Error('Token expired'));
  }

  // Don't override Content-Type if it's multipart/form-data (for file uploads)
  const headers: any = {
    Authorization: `Bearer ${token}`
  };

  if (!req.headers.has('Content-Type') && !(req.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  req = req.clone({
    setHeaders: headers
  });

  console.log('Request with token:', {
    url: req.url,
    hasToken: !!token,
    headers: req.headers.keys()
  });
}


  // Handle response and errors
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('HTTP Error:', {
        status: error.status,
        message: error.message,
        url: req.url
      });

      // Handle 401 Unauthorized
      if (error.status === 401) {
        console.warn('Unauthorized: Token expired or invalid');
        authService.logout();
        router.navigate(['/login']);
      }

      // Handle 403 Forbidden
      if (error.status === 403) {
        console.error('Forbidden: Insufficient permissions or onboarding incomplete');
        console.error('User roles:', authService.getUserRoles());
        console.error('Requested URL:', req.url);
      }

      return throwError(() => error);
    })
  );
  
};

import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth-service';


export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  // Check if organization is verified
  if (!authService.isVerified()) {
    router.navigate(['/pending-verification']);
    return false;
  }

  // Check required roles if specified in route data
  const requiredRoles = route.data['roles'] as string[];
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => authService.hasRole(role));
    if (!hasRequiredRole) {
      router.navigate(['/unauthorized']);
      return false;
    }
  }

  return true;
};
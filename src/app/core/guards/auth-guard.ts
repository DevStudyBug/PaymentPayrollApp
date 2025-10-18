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

  //  Redirect first-time login users
  if (authService.isFirstTimeLogin() && state.url !== '/change-password') {
    alert('You must change your password before accessing your dashboard.');
    router.navigate(['/change-password']);
    return false;
  }

  //  Check org verification
  if (!authService.isVerified()) {
    router.navigate(['/pending-verification']);
    return false;
  }

  //  Role-based check
  const requiredRoles = route.data['roles'] as string[];
  if (requiredRoles?.length > 0) {
    const hasRole = requiredRoles.some(role => authService.hasRole(role));
    if (!hasRole) {
      router.navigate(['/unauthorized']);
      return false;
    }
  }

  return true;
};

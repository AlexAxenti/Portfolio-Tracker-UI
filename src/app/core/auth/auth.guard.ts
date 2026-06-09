import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

const requireAuthenticatedSession = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const session = authService.session() ?? await authService.getSession();

  if (session) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

export const authGuard: CanActivateFn = requireAuthenticatedSession;
export const authChildGuard: CanActivateChildFn = requireAuthenticatedSession;

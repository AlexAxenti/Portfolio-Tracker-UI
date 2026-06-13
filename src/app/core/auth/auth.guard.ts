import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

const requireAuthenticatedSession = async (_route: unknown, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = await authService.getUser();

  if (user) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: {
      returnUrl: state.url,
    },
  });
};

const redirectAuthenticatedSession = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = await authService.getUser();

  return user ? router.createUrlTree(['/dashboard']) : true;
};

export const authGuard: CanActivateFn = requireAuthenticatedSession;
export const authChildGuard: CanActivateChildFn = requireAuthenticatedSession;
export const guestGuard: CanActivateFn = redirectAuthenticatedSession;

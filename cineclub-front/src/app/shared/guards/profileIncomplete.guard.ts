import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { TokenService } from '../../auth/services/token.service';

/**
 * Guard que verifica si el usuario NO tiene un perfil completo.
 * Si ya tiene rol válido, redirige al home (porque ya completó su perfil)
 * Este guard se usa para proteger /profile/register-profile
 */
export const profileIncompleteGuard = () => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  const userRole = tokenService.getUserRole();

  if (userRole && userRole !== '') {
    return router.createUrlTree(['/']);
  }

  return true;
};

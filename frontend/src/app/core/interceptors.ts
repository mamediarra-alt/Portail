import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Sur 401, renvoie vers l'écran de connexion (qui décide ensuite SSO ou code de démo).
 *
 * La protection CSRF (cookie {@code XSRF-TOKEN} → en-tête {@code X-XSRF-TOKEN}) est
 * assurée automatiquement par le support XSRF intégré de {@code HttpClient}.
 */
export const erreurAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.endsWith('/bff/session') && !req.url.endsWith('/bff/mode')) {
        router.navigateByUrl('/connexion');
      }
      return throwError(() => err);
    }),
  );
};

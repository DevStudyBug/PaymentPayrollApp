import { Component, effect, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth-service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = 'PaymentPayrollApp';

  private authService = inject(AuthService);
  private router = inject(Router);

  // Run effect immediately when app starts
  constructor() {
    effect(() => {
      const token = this.authService.getToken();

      if (token && this.authService.isTokenExpired()) {
        console.warn('Token expired on app load. Redirecting to login...');
        this.authService.logout();
        this.router.navigate(['/login']);
      }
    });
  }
}
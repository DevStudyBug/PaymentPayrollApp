import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth-service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './changepassword-component.html',
  styleUrls: ['./changepassword-component.css'],
})
export class ChangePasswordComponent {
  changePasswordForm: FormGroup;
  errorMessage = '';
  successMessage = '';
  isLoading = false;
  cdr = inject(ChangeDetectorRef);
  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.changePasswordForm = this.fb.group({
      username: [{ value: sessionStorage.getItem('tempEmail') || '', disabled: true }], // pre-filled email
      oldPassword: ['', [Validators.required, Validators.minLength(8)]],
      newPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).+$/),
        ],
      ],
      confirmPassword: ['', [Validators.required]],
    });
  }

  onSubmit(): void {
    this.errorMessage = '';
    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      return;
    }

    const { oldPassword, newPassword, confirmPassword } = this.changePasswordForm.getRawValue();
    const username = sessionStorage.getItem('tempEmail');

    if (!username) {
      this.errorMessage = 'Session expired. Please log in again.';
      this.router.navigate(['/login']);
      return;
    }

    if (newPassword !== confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.isLoading = true;

    this.authService.changePassword(username, oldPassword, newPassword).subscribe({
      next: (res: string) => {
        this.isLoading = false;
        this.successMessage = res || 'Password changed successfully! Please login again.';
        sessionStorage.clear();
        this.authService.clearFirstTimeLogin();
        this.cdr.detectChanges();
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to change password.';
        this.cdr.detectChanges();
      },
    });
  }
}

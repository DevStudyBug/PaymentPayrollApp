import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RecaptchaModule } from 'ng-recaptcha';
import { LoginRequest } from '../../../core/models/auth.models';
import { AuthService } from '../../../core/services/auth-service';

@Component({
  selector: 'app-login-component',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RecaptchaModule],
  templateUrl: './login-component.html',
  styleUrls: ['./login-component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage: string = '';
  captchaError: string = '';
  isLoading: boolean = false;
  captchaResponse: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      userName: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      recaptcha: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loginForm.valueChanges.subscribe(() => {
      if (this.errorMessage) this.errorMessage = '';
      if (this.captchaError) this.captchaError = '';
    });
  }

  onCaptchaResolved(token: string | null): void {
    if (token) {
      this.captchaResponse = token;
      this.captchaError = '';
      this.loginForm.patchValue({ recaptcha: token });
    } else {
      this.captchaResponse = null;
    }
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.captchaError = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    if (!this.captchaResponse) {
      this.captchaError = 'Please verify the reCAPTCHA before logging in.';
      return;
    }

    this.isLoading = true;

    const credentials: LoginRequest = {
      userName: this.loginForm.value.userName,
      password: this.loginForm.value.password
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.isLoading = false;

        if (response.status === 'FIRST_TIME_LOGIN') {
          sessionStorage.setItem('tempUserId', response.userId.toString());
          sessionStorage.setItem('tempEmail', response.email);
          sessionStorage.setItem('firstTimeLogin', 'true');
          this.router.navigate(['/change-password']);
          return;
        }

        if (response.orgStatus === 'PENDING') {
          this.errorMessage = 'Your organization is pending verification. Please wait for admin approval.';
          this.authService.logout();
          return;
        }

        const roles = Array.from(response.roles);
        if (roles.includes('BANK_ADMIN')) this.router.navigate(['/BANK_ADMIN']);
        else if (roles.includes('ORG_ADMIN')) this.router.navigate(['/ORG_ADMIN']);
        else if (roles.includes('EMPLOYEE')) this.router.navigate(['/EMPLOYEE']);
        else this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Invalid username or password!';
      }
    });
  }

  navigateToRegister(): void {
    this.router.navigate(['/organization/register']);
  }

  navigateToHome(): void {
    this.router.navigate(['/']);
  }
}

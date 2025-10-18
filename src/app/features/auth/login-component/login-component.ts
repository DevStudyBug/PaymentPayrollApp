import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
  captchaError: string = ''; // ✅ Added
  isLoading: boolean = false;
  captchaResponse: string | null = null; // store captcha token

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef 
  ) {
    this.loginForm = this.fb.group({
      userName: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      recaptcha: ['', Validators.required] // Add captcha field
    });
  }

  ngOnInit(): void {
    this.loginForm.valueChanges.subscribe(() => {
      if (this.errorMessage) this.errorMessage = '';
      if (this.captchaError) this.captchaError = '';
    });
  }

  //  When captcha is resolved
onCaptchaResolved(token: string | null): void {
  if (token) {
    this.captchaResponse = token;
    this.captchaError = '';
    this.loginForm.patchValue({ recaptcha: token });
     this.cdr.detectChanges();
  } else {
    this.captchaResponse = null;
  }
}

  onSubmit(): void {
    this.errorMessage = '';
    this.captchaError = '';

    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
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

        if (response.orgStatus === 'PENDING') {
          this.errorMessage = 'Your organization is pending verification. Please wait for admin approval.';
          this.authService.logout();
          this.cdr.detectChanges();
          return;
        }

        const roles = Array.from(response.roles);
        if (roles.includes('BANK_ADMIN')) this.router.navigate(['/BANK_ADMIN']);
        else if (roles.includes('ORG_ADMIN')) this.router.navigate(['/ORG_ADMIN']);
        else if (roles.includes('EMPLOYEE')) this.router.navigate(['/EMPLOYEE']);
        else this.router.navigate(['/dashboard']);

        if (response.message) console.log(response.message);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error || err.error?.message || 'Invalid username or password!';
        this.cdr.detectChanges();
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



//6LdJr-srAAAAAHU_JPUJoGGjtZNZJl9rrDpTXiGd  
// Use this secret key for communication between your site and reCAPTCHA.

//6LdJr-srAAAAAF1476eJrhpXbpAeAqLbqSIAxBkT 
//  Use this site key in the HTML code your site serves to users.

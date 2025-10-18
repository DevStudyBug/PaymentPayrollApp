// register-organization.component.ts
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth-service';


@Component({
  selector: 'app-register-organization',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register-organization.html',
  styleUrl: './register-organization.css'
})
export class RegisterOrganization implements OnInit {
  registrationForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef  
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.registrationForm = this.fb.group({
      orgName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      registrationNo: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(20)]],
      address: ['', [Validators.required, Validators.minLength(10)]],
      contactNo: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(10)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
  this.errorMessage = '';
  this.successMessage = '';

  if (this.registrationForm.invalid) {
    this.errorMessage = 'Please fill all fields correctly';
    return;
  }

  this.isLoading = true;

  const formData = {
    orgName: this.registrationForm.get('orgName')?.value,
    registrationNo: this.registrationForm.get('registrationNo')?.value,
    address: this.registrationForm.get('address')?.value,
    contactNo: this.registrationForm.get('contactNo')?.value,
    email: this.registrationForm.get('email')?.value,
    username: this.registrationForm.get('username')?.value,
    password: this.registrationForm.get('password')?.value
  };

  this.authService.registerOrganization(formData).subscribe(
    (response: any) => {
      this.isLoading = false;
      this.successMessage = response.message || 'Registration successful!';

      // ✅ Show pop-up alert
      alert('Registration successful! Please verify your email before logging !');

      // ✅ Redirect to login page after alert
      this.router.navigate(['/login']);
    },
    (error: any) => {
      this.isLoading = false;

      if (error.status === 409) {
        const errorMsg = error.error?.message || error.error?.error || '';
        if (errorMsg.toLowerCase().includes('email')) {
          this.errorMessage = 'This email address is already registered. Please use a different email.';
          this.cdr.detectChanges();
        } else if (errorMsg.toLowerCase().includes('username')) {
          this.errorMessage = 'This username is already taken. Please choose a different username.';
          this.cdr.detectChanges();
        } else if (errorMsg.toLowerCase().includes('registration')) {
          this.errorMessage = 'This registration number already exists. Please check your registration number.';
          this.cdr.detectChanges();
        } else {
          this.errorMessage = errorMsg || 'Organization already exists. Please check your email, username, or registration number.';
          this.cdr.detectChanges();
        }
      } else if (error.status === 400) {
        this.errorMessage = error.error?.message || 'Invalid data provided. Please check all fields.';
        this.cdr.detectChanges();
      } else if (error.status === 500) {
        this.errorMessage = 'Server error occurred. Please try again later.';
        this.cdr.detectChanges();
      } else if (error.status === 0) {
        this.errorMessage = 'Network error. Please check your internet connection.';
        this.cdr.detectChanges();
      } else {
        this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
        this.cdr.detectChanges();
      }

      console.error('Registration error:', error);
      this.cdr.detectChanges();
    }
  );
}

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  getErrorMessage(fieldName: string): string {
    const field = this.registrationForm.get(fieldName);
    if (!field || !field.errors || !field.touched) {
      return '';
    }

    if (field.errors['required']) {
      return `${this.formatFieldName(fieldName)} is required`;
    }
    if (field.errors['minlength']) {
      return `${this.formatFieldName(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
    }
    if (field.errors['maxlength']) {
      return `${this.formatFieldName(fieldName)} cannot exceed ${field.errors['maxlength'].requiredLength} characters`;
    }
    if (field.errors['email']) {
      return 'Please enter a valid email address';
    }
    if (field.errors['pattern']) {
      return `${this.formatFieldName(fieldName)} format is invalid`;
    }
    return '';
  }

  private formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registrationForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  get passwordMismatch(): boolean {
    return !!(this.registrationForm.errors && this.registrationForm.errors['passwordMismatch'] && this.registrationForm.touched);
  }
}
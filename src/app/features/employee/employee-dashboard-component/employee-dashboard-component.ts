
// employee-dashboard.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { EmployeeService } from '../../../core/services/employee-service';
import { AuthService } from '../../../core/services/auth-service';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employee-dashboard-component.html',
  styleUrl: './employee-dashboard-component.css'
})
export class EmployeeDashboardComponent implements OnInit, OnDestroy {
  // State
  activeTab: string = 'dashboard';
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  // Data
  onboardingStatus: any = null;
  concerns: any[] = [];
  salarySlip: any = null;
  bankDetails: any = null;

  // Forms
  bankDetailsForm!: FormGroup;
  concernForm!: FormGroup;

  // File uploads
  selectedDocFiles: { [key: string]: File } = {};
  concernFile: File | null = null;

  // Required documents
  requiredDocuments = ['PAN_CARD', 'AADHAR_CARD', 'PROFILE_PHOTO'];

  private destroy$ = new Subject<void>();

  constructor(
    private employeeService: EmployeeService,
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadOnboardingStatus();
    this.loadConcerns();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeForms(): void {
    this.bankDetailsForm = this.fb.group({
      accountHolderName: ['', [Validators.required, Validators.minLength(3)]],
      accountNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{9,18}$/)]],
      ifscCode: ['', [Validators.required, Validators.pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)]],
      bankName: ['', Validators.required],
      branchName: [''],
      accountType: ['SAVINGS', Validators.required]
    });

    this.concernForm = this.fb.group({
      category: ['', Validators.required],
      priority: ['MEDIUM', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  loadOnboardingStatus(): void {
    this.employeeService.getOnboardingStatus()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => console.log('Onboarding status loaded'))
      )
      .subscribe({
        next: (data) => {
          console.log('Onboarding Status:', data);
          this.onboardingStatus = data;
          this.cdr.detectChanges(); // Ensure UI updates
          
        },
        error: (error) => {
          console.error('Failed to load onboarding status', error);
          this.showError('Failed to load onboarding status');
          this.cdr.detectChanges();
        }
      });
  }

  loadConcerns(): void {
    this.employeeService.getMyConcerns()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => console.log('Concerns loaded'))
      )
      .subscribe({
        next: (data) => {
          console.log('Concerns:', data);
          this.concerns = data || [];
           this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Failed to load concerns', error);
          this.concerns = [];
          this.cdr.detectChanges();
        }
      });
  }

  // Document Upload
  onDocumentSelect(event: any, docType: string): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedDocFiles[docType] = file;
      console.log(`Selected ${docType}:`, file.name);
    }
  }

  uploadDocuments(): void {
    const files = Object.values(this.selectedDocFiles);
    const docTypes = Object.keys(this.selectedDocFiles);

    if (files.length === 0) {
      this.showError('Please select at least one document to upload');
      this.cdr.detectChanges();
      return;
    }

    if (!confirm(`Upload ${files.length} document(s)?`)) {
      return;
    }

    this.isLoading = true;
    this.employeeService.uploadDocuments(files, docTypes)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          console.log('Upload response:', response);
          this.showSuccess(`✅ ${response.uploadedDocuments?.length || 0} documents uploaded successfully`);
          this.selectedDocFiles = {};
          this.loadOnboardingStatus();
           this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Upload failed:', error);
          this.showError(error.error?.message || 'Failed to upload documents');
          this.cdr.detectChanges();
        }
      });
  }

  reuploadDocument(documentId: number, event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    if (!confirm('Reupload this document?')) {
      event.target.value = '';
      return;
    }

    this.isLoading = true;
    this.employeeService.reuploadDocument(documentId, file)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          event.target.value = '';
        })
      )
      .subscribe({
        next: (response) => {
          this.showSuccess('✅ Document reuploaded successfully');
          this.loadOnboardingStatus();
           this.cdr.detectChanges();
           console.log('Reupload response:', response);
        },
        error: (error) => {
          this.showError(error.error?.message || 'Failed to reupload document');
          this.cdr.detectChanges();
        }
      });
  }

  // Bank Details
  submitBankDetails(): void {
    if (this.bankDetailsForm.invalid) {
      this.showError('Please fill all required fields correctly');
      return;
    }

    if (!confirm('Submit bank details for verification?')) {
      return;
    }

    this.isLoading = true;
    const request = this.bankDetailsForm.value;
    
    this.employeeService.addBankDetails(request)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          this.showSuccess('✅ Bank details submitted successfully');
          this.bankDetailsForm.reset();
          this.loadOnboardingStatus();
          this.cdr.detectChanges();
          console.log('Bank details response:', response);
   
        },
        error: (error) => {
          this.showError(error.error?.message || 'Failed to submit bank details');
          this.cdr.detectChanges();
        }
      });
  }

  loadBankDetails(): void {
    this.employeeService.getBankDetails()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.bankDetails = data;
           this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Failed to load bank details', error);
          this.cdr.detectChanges();
        
        }
      });
  }

  // Salary Slip
  viewSalarySlip(month: string): void {
    if (!month) {
      this.showError('Please enter a month');
      return;
    }

    this.isLoading = true;
    this.employeeService.getSalarySlip(month)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (data) => {
          this.salarySlip = data;
          this.showSuccess('✅ Salary slip loaded');
           this.cdr.detectChanges();
        },
        error: (error) => {
          this.showError(error.error?.message || 'Salary slip not found for this month');
            this.cdr.detectChanges();
        }
      });
  }

  downloadSalarySlip(month: string): void {
    if (!month) {
      this.showError('Please enter a month');
      return;
    }

    this.isLoading = true;
    this.employeeService.downloadSalarySlipPDF(month)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `salary-slip-${month}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
          this.showSuccess('✅ Salary slip downloaded');
           this.cdr.detectChanges();
        },
        error: (error) => {
          this.showError('Failed to download salary slip');
            this.cdr.detectChanges();
        }
      });
  }

  // Concerns
  onConcernFileSelect(event: any): void {
    this.concernFile = event.target.files[0];
  }

  raiseConcern(): void {
    if (this.concernForm.invalid) {
      this.showError('Please fill all required fields');
      return;
    }

    if (!confirm('Submit this concern?')) {
      return;
    }

    this.isLoading = true;
    const concernData = this.concernForm.value;

    this.employeeService.raiseConcern(concernData, this.concernFile || undefined)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          this.showSuccess(`✅ Concern raised. Ticket: ${response.ticketNumber}`);
          this.concernForm.reset({ priority: 'MEDIUM' });
          this.concernFile = null;
          this.loadConcerns();
           this.cdr.detectChanges();
        },
        error: (error) => {
          this.showError(error.error?.message || 'Failed to raise concern');
            this.cdr.detectChanges();
        }
      });
  }

  acknowledgeConcern(ticketNumber: string): void {
    if (!confirm('Close this concern?')) {
      return;
    }

    this.employeeService.acknowledgeConcern(ticketNumber)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess('✅ Concern closed');
          this.loadConcerns();
           this.cdr.detectChanges();
        },
        error: (error) => {
          this.showError(error.error?.message || 'Failed to close concern');
            this.cdr.detectChanges();
        }
      });
  }

  reopenConcern(ticketNumber: string): void {
    const reason = prompt('Enter reason for reopening:');
    if (!reason) return;

    this.employeeService.reopenConcern(ticketNumber, reason)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess('✅ Concern reopened');
          this.loadConcerns();
           this.cdr.detectChanges();
        },
        error: (error) => {
          this.showError(error.error?.message || 'Failed to reopen concern');
            this.cdr.detectChanges();
        }
      });
  }

  // Utility
  switchTab(tab: string): void {
    this.activeTab = tab;
    this.clearMessages();

    if (tab === 'bank' && !this.bankDetails) {
      this.loadBankDetails();
    }
  }

  getProgress(): number {
    return this.onboardingStatus?.overallProgress || 0;
  }

  showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    this.autoHideMessages();
  }

  showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    this.autoHideMessages();
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  autoHideMessages(): void {
    setTimeout(() => this.clearMessages(), 5000);
  }

  logout(): void {
    if (confirm('Logout?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }
}

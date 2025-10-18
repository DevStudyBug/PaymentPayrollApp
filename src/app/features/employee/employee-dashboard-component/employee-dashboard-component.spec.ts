import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
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
  styleUrl: './employee-dashboard-component.css',
})
export class EmployeeDashboardComponent implements OnInit, OnDestroy {
  // ==========================
  // STATE
  // ==========================
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
  documentUploadForm!: FormGroup;

  // Modals
  showDocumentModal = false;
  showBankModal = false;

  // Allowed document types
  allowedDocumentTypes = ['PAN_CARD', 'AADHAR_CARD', 'PROFILE_PHOTO'];

  // Concern attachment file
  concernFile: File | null = null;

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

  // ==========================
  // FORM INITIALIZATION
  // ==========================
  initializeForms(): void {
    this.bankDetailsForm = this.fb.group({
      accountHolderName: ['', [Validators.required, Validators.minLength(3)]],
      accountNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{9,18}$/)]],
      ifscCode: ['', [Validators.required, Validators.pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)]],
      bankName: ['', [Validators.required, Validators.minLength(3)]],
      branchName: ['', [Validators.required, Validators.minLength(3)]],
      accountType: ['SAVINGS', Validators.required],
    });

    this.concernForm = this.fb.group({
      category: ['', Validators.required],
      priority: ['MEDIUM', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]],
    });

    this.documentUploadForm = this.fb.group({
      documents: this.fb.array([this.createDocumentFormGroup()]),
    });
  }

  createDocumentFormGroup(fileType?: string): FormGroup {
    return this.fb.group({
      file: [null, Validators.required],
      fileName: [
        { value: fileType ? `${fileType} Document` : '', disabled: true },
        Validators.required,
      ],
      fileType: [{ value: fileType || '', disabled: true }, Validators.required],
    });
  }

  get documentsArray(): FormArray {
    return this.documentUploadForm.get('documents') as FormArray;
  }

  addDocumentField(): void {
    if (this.documentsArray.length >= 3) {
      this.showError('You can upload a maximum of 3 documents only (PAN, AADHAR, PROFILE PHOTO).');
      return;
    }
    this.documentsArray.push(this.createDocumentFormGroup());
  }

  removeDocumentField(index: number): void {
    if (this.documentsArray.length > 1) this.documentsArray.removeAt(index);
  }

  onFileSelected(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) this.documentsArray.at(index).patchValue({ file });
  }

  // ==========================
  // ONBOARDING STATUS
  // ==========================
  loadOnboardingStatus(): void {
    this.isLoading = true;
    this.employeeService
      .getOnboardingStatus()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (data) => {
          this.onboardingStatus = data;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Failed to load onboarding status', error);
          this.showError('Failed to load onboarding status');
        },
      });
  }

  // ==========================
  // DOCUMENT UPLOAD (ORG STYLE)
  // ==========================
  openDocumentModal(): void {
    const docs = this.onboardingStatus?.documents || [];

    if (!this.onboardingStatus) {
      this.showError('Onboarding status not available. Please refresh.');
      return;
    }

    const hasRejected = docs.some((d: any) => d.status?.toUpperCase() === 'REJECTED');
    if (hasRejected) {
      this.showError('One or more documents were rejected. Please re-upload them individually.');
      return;
    }

    const uploadedTypes = docs.map((d: any) => d.fileType?.toUpperCase());
    const missingDocs = this.allowedDocumentTypes.filter(
      (type) => !uploadedTypes.includes(type.toUpperCase())
    );

    if (missingDocs.length === 0) {
      this.showError('All documents are already uploaded or under review.');
      return;
    }

    this.showDocumentModal = true;
    this.documentUploadForm = this.fb.group({ documents: this.fb.array([]) });
    missingDocs.forEach((type) => this.documentsArray.push(this.createDocumentFormGroup(type)));
  }

  closeDocumentModal(): void {
    this.showDocumentModal = false;
  }

  uploadDocuments(): void {
    if (this.documentUploadForm.invalid) {
      this.showError('Please fill all required fields correctly');
      return;
    }

    if (!confirm('Are you sure you want to upload these documents?')) return;

    this.isLoading = true;
    const files: File[] = [];
    const docTypes: string[] = [];

    this.documentsArray.controls.forEach((control) => {
      const file = control.get('file')?.value;
      const fileType = control.get('fileType')?.value;
      if (file && fileType) {
        files.push(file);
        docTypes.push(fileType);
      }
    });

    this.employeeService
      .uploadDocuments(files, docTypes)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: () => {
          this.showSuccess('✅ Documents uploaded successfully');
          this.closeDocumentModal();
          this.loadOnboardingStatus();
          this.cdr.detectChanges();
        },
        error: (error) => this.showError(error.error?.message || 'Failed to upload documents'),
      });
  }

  reuploadDocument(documentId: number, file: File, meta: any): void {
    if (!file) {
      this.showError('Please select a valid file to re-upload');
      return;
    }

    if (!confirm(`Re-upload ${meta.fileName || meta.fileType}?`)) return;

    this.isLoading = true;

    this.employeeService
      .reuploadDocument(documentId, file)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: () => {
          this.showSuccess(`✅ ${meta.fileType} re-uploaded successfully`);
          this.loadOnboardingStatus();
          this.cdr.detectChanges();
        },
        error: (error) => this.showError(error.error?.message || 'Failed to re-upload document'),
      });
  }

  onRejectedFileSelected(event: any, doc: any): void {
    const file = event.target.files[0];
    if (!file) return;
    const meta = { fileName: doc.documentName, fileType: doc.fileType };
    this.reuploadDocument(doc.documentId, file, meta);
  }

  // ==========================
  // BANK DETAILS
  // ==========================
  openBankModal(): void {
    this.showBankModal = true;

    if (this.onboardingStatus?.bankStage !== 'NOT_PROVIDED' && this.bankDetails) {
      this.bankDetailsForm.patchValue(this.bankDetails);
    } else {
      this.bankDetailsForm.reset({ accountType: 'SAVINGS' });
    }
  }

  closeBankModal(): void {
    this.showBankModal = false;
  }

  submitBankDetails(): void {
    if (this.bankDetailsForm.invalid) {
      this.showError('⚠️ Please fill all required bank fields correctly');
      return;
    }

    const bankData = this.bankDetailsForm.value;
    const bankStage = this.onboardingStatus?.bankStage?.toUpperCase();
    const isReupload = bankStage === 'REJECTED';

    if (!confirm(isReupload ? 'Resubmit updated bank details?' : 'Submit bank details?')) return;

    this.isLoading = true;
    const apiCall = isReupload
      ? this.employeeService.reuploadBankDetails(bankData)
      : this.employeeService.addBankDetails(bankData);

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: () => {
          this.showSuccess(
            isReupload
              ? '✅ Bank details updated and resubmitted for review'
              : '✅ Bank details submitted successfully'
          );
          this.closeBankModal();
          this.loadOnboardingStatus();
          this.cdr.detectChanges();
        },
        error: (error) =>
          this.showError(error.error?.message || '❌ Failed to submit bank details'),
      });
  }

  // ==========================
  // SALARY SLIPS
  // ==========================
  viewSalarySlip(month: string): void {
    if (!month) {
      this.showError('Please select a month');
      return;
    }

    this.isLoading = true;
    this.employeeService
      .getSalarySlip(month)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (data) => {
          this.salarySlip = data;
          this.showSuccess('✅ Salary slip loaded');
          this.cdr.detectChanges();
        },
        error: (error) =>
          this.showError(error.error?.message || 'Salary slip not found for this month'),
      });
  }

  downloadSalarySlip(month: string): void {
    if (!month) {
      this.showError('Please select a month');
      return;
    }

    this.isLoading = true;
    this.employeeService
      .downloadSalarySlipPDF(month)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `salary-slip-${month}.pdf`;
          link.click();
          this.isLoading = false;
          window.URL.revokeObjectURL(url);
          this.showSuccess('✅ Salary slip downloaded');
        },
        error: () => this.showError('Failed to download salary slip'),
      });
  }

  // ==========================
  // CONCERNS
  // ==========================
  loadConcerns(): void {
    this.employeeService
      .getMyConcerns()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.concerns = data || [];
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Failed to load concerns', error);
          this.concerns = [];
        },
      });
  }

  onConcernFileSelect(event: any): void {
    this.concernFile = event.target.files[0];
  }

  raiseConcern(): void {
    if (this.concernForm.invalid) {
      this.showError('Please fill all required fields');
      return;
    }

    if (!confirm('Submit this concern?')) return;

    this.isLoading = true;
    const concernData = this.concernForm.value;

    this.employeeService
      .raiseConcern(concernData, this.concernFile || undefined)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (response) => {
          this.showSuccess(`✅ Concern raised. Ticket: ${response.ticketNumber}`);
          this.concernForm.reset({ priority: 'MEDIUM' });
          this.concernFile = null;
          this.loadConcerns();
          this.cdr.detectChanges();
        },
        error: (error) => this.showError(error.error?.message || 'Failed to raise concern'),
      });
  }

  acknowledgeConcern(ticketNumber: string): void {
    if (!confirm('Close this concern?')) return;

    this.employeeService
      .acknowledgeConcern(ticketNumber)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess('✅ Concern closed');
          this.loadConcerns();
          this.cdr.detectChanges();
        },
        error: (error) => this.showError(error.error?.message || 'Failed to close concern'),
      });
  }

  reopenConcern(ticketNumber: string): void {
    const reason = prompt('Enter reason for reopening:');
    if (!reason) return;

    this.employeeService
      .reopenConcern(ticketNumber, reason)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess('✅ Concern reopened');
          this.loadConcerns();
          this.cdr.detectChanges();
        },
        error: (error) => this.showError(error.error?.message || 'Failed to reopen concern'),
      });
  }
  expandedTicket: string | null = null;

  toggleConcern(ticketNumber: string) {
    this.expandedTicket = this.expandedTicket === ticketNumber ? null : ticketNumber;
  }

  // ==========================
  // HELPERS
  // ==========================
  getProgress(): number {
    if (!this.onboardingStatus) return 0;
    let progress = 0;
    if (this.onboardingStatus.documentStage === 'APPROVED') progress += 70;
    if (this.onboardingStatus.bankStage === 'APPROVED') progress += 20;
    if (this.onboardingStatus.employeeStatus === 'ACTIVE') progress += 10;
    return progress;
  }

  isOnboardingComplete(): boolean {
    return this.getProgress() === 100;
  }

  isDocumentUploadDisabled(): boolean {
    if (!this.onboardingStatus) return false;
    return ['UNDER_REVIEW', 'APPROVED'].includes(this.onboardingStatus.documentStage);
  }

  isBankDetailsDisabled(): boolean {
    if (!this.onboardingStatus) return false;
    const stage = this.onboardingStatus.bankStage?.toUpperCase();
    return ['UNDER_REVIEW', 'APPROVED', 'PROVIDED'].includes(stage);
  }

  switchTab(tab: string): void {
    if (!this.isOnboardingComplete() && tab !== 'dashboard') {
      this.showError('Complete your onboarding (100%) to access this feature');
      return;
    }

    this.activeTab = tab;
    this.clearMessages();

    if (tab === 'bank' && !this.bankDetails) this.loadBankDetails();
  }

  loadBankDetails(): void {
    this.employeeService
      .getBankDetails()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.bankDetails = data;
          this.cdr.detectChanges();
        },
        error: (error) => console.error('Failed to load bank details', error),
      });
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

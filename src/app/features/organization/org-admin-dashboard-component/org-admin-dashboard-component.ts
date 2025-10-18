// org-admin-dashboard-component.ts
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { OrganizationService } from '../../../core/services/organization-service';
import { AuthService } from '../../../core/services/auth-service';
import { finalize, Subject, takeUntil } from 'rxjs';
import { VendorService } from '../../../core/services/vendor-service';

@Component({
  selector: 'app-org-admin-dashboard-component',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './org-admin-dashboard-component.html',
  styleUrl: './org-admin-dashboard-component.css',
})
export class OrgAdminDashboardComponent implements OnInit {
  // State Management
  activeTab: string = 'dashboard';
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  // Modal States
  showDocumentModal = false;
  showBankModal = false;

  // Data
  onboardingStatus: any = null;
  designations: any[] = [];
  salaryTemplates: any[] = [];
  employees: any[] = [];
  concerns: any[] = [];

  // Forms
  designationForm!: FormGroup;
  salaryTemplateForm!: FormGroup;
  employeeForm!: FormGroup;
  documentUploadForm!: FormGroup;
  bankDetailsForm!: FormGroup;

  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  allowedDocumentTypes = ['PAN', 'GST', 'LICENSE'];

  // view salary template with other properties
showSalaryTemplateModal = false;
selectedSalaryTemplate: any = null;

//view register employee with other properties
showEmployeeModal = false;
selectedEmployee: any = null;


 //vendor properties section
vendors: any[] = [];
vendorPaymentRequests: any[] = [];
showVendorModal = false;
showVendorPaymentModal = false;
showVendorDetailModal = false;
selectedVendor: any = null;
vendorForm!: FormGroup;
vendorPaymentForm!: FormGroup;

// view payment with other properties
showPaymentDetailModal = false;
selectedPaymentRequest: any = null;

  private destroy$ = new Subject<void>();

  constructor(
    private orgService: OrganizationService,
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router,
    private vendorService: VendorService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadOnboardingStatus();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Form Initialization
  initializeForms(): void {
    this.designationForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
    });

    this.salaryTemplateForm = this.fb.group({
      designation: ['', Validators.required],
      basicSalary: ['', [Validators.required, Validators.min(0)]],
      hra: ['', [Validators.required, Validators.min(0)]],
      da: ['', [Validators.required, Validators.min(0)]],
      pf: ['', [Validators.required, Validators.min(0)]],
      otherAllowances: ['', [Validators.required, Validators.min(0)]],
    });

    this.employeeForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      dob: ['', Validators.required],
      department: ['', Validators.required],
      designation: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
    });

    // Document Upload Form with FormArray for multiple documents
    this.documentUploadForm = this.fb.group({
      documents: this.fb.array([this.createDocumentFormGroup()]),
    });

    // Bank Details Form
    this.bankDetailsForm = this.fb.group({
      accountNumber: ['', [Validators.required, Validators.minLength(9)]],
      ifscCode: ['', [Validators.required, Validators.pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)]],
      bankName: ['', [Validators.required, Validators.minLength(3)]],
      accountHolderName: ['', [Validators.required, Validators.minLength(3)]],
      branchName: ['', Validators.minLength(3)],
    });

    //vendor initializeForms() method
// Vendor Form
// Vendor Form
this.vendorForm = this.fb.group({
  name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
  contactPerson: ['', [Validators.maxLength(100)]],
  email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
  phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
  address: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
  bankName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
  bankAccountNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{12}$/)]],
  ifscCode: ['', [Validators.required, Validators.pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)]],
// type: ['VENDOR', Validators.required]
});

// Vendor Payment Request Form
this.vendorPaymentForm = this.fb.group({
  vendorId: ['', Validators.required],
  amount: ['', [Validators.required, Validators.min(1)]],
  description: ['', [Validators.required, Validators.minLength(10)]],
  requestType: ['VENDOR', Validators.required]
});
  }

  // Create a single document form group
 createDocumentFormGroup(fileType?: string): FormGroup {
  return this.fb.group({
    file: [null, Validators.required],
    fileName: [{ value: fileType ? `${fileType} Document` : '', disabled: true }, Validators.required],
    fileType: [{ value: fileType || '', disabled: true }, Validators.required]
  });
}
  // Check if onboarding is complete    
  isOrganizationActive(): boolean {
    return this.onboardingStatus?.organizationStatus === 'ACTIVE';
  }
  // Get documents form array
  get documentsArray(): FormArray {
    return this.documentUploadForm.get('documents') as FormArray;
  }

  // Add document field (limit to 3)
  addDocumentField(): void {
    if (this.documentsArray.length >= 3) {
      this.showError('You can upload a maximum of 3 documents only (PAN, GST, LICENSE).');
      return;
    }
    this.documentsArray.push(this.createDocumentFormGroup());
  }

  // Remove document field
  removeDocumentField(index: number): void {
    if (this.documentsArray.length > 1) {
      this.documentsArray.removeAt(index);
    }
  }

  // Handle file selection
  onFileSelected(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      this.documentsArray.at(index).patchValue({ file: file });
    }
  }

  // Load Onboarding Status
  loadOnboardingStatus(): void {
    this.isLoading = true;
    this.orgService
      .getOnboardingStatus()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (data) => {
          console.log('Onboarding Status:', data);
          this.onboardingStatus = data;
          this.cdr.detectChanges();

          // Load other data only if onboarding is complete
          if (this.isOnboardingComplete()) {
            this.loadDesignations();
            this.loadSalaryTemplates();
            this.loadEmployees();
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          console.error('Failed to load onboarding status', error);
          this.showError('Failed to load onboarding status');
        },
      });
  }

  loadDesignations(): void {
    this.orgService
      .getAllDesignations()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.designations = data || [];
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Failed to load designations', error);
        },
      });
  }

  loadSalaryTemplates(): void {
    this.orgService
      .getAllSalaryTemplates(this.currentPage, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.salaryTemplates = data.content || [];
          this.totalElements = data.totalElements || 0;
          this.totalPages = data.totalPages || 0;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Failed to load salary templates', error);
          this.cdr.detectChanges();
        },
      });
  }

  loadEmployees(status: string = 'ALL'): void {
    this.orgService
      .getEmployeesByStatus(status)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.employees = data || [];
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Failed to load employees', error);
          this.cdr.detectChanges();
        },
      });
  }

  loadConcerns(): void {
    this.orgService
      .getAllConcerns(undefined, undefined, undefined, this.currentPage, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.concerns = data.content || [];
          this.totalElements = data.totalElements || 0;
          this.totalPages = data.totalPages || 0;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Failed to load concerns', error);
        },
      });
  }

  // Document Upload
openDocumentModal(): void {
  const docs = this.onboardingStatus?.documents || [];

  // ✅ 1. If no onboarding data, don't open
  if (!this.onboardingStatus) {
    this.showError('Onboarding status not available. Please refresh the page.');
    return;
  }

  // ✅ 2. If any document is rejected, prevent modal
  const hasRejected = docs.some((d: any) => d.status?.toUpperCase() === 'REJECTED');
  if (hasRejected) {
    this.showError('One or more documents were rejected. Please reupload them individually.');
    return;
  }

  // ✅ 3. Determine which documents are missing (for first-time upload)
  const uploadedTypes = docs.map((d: any) => d.fileType?.toUpperCase());
  const missingDocs = this.allowedDocumentTypes.filter(
    (type) => !uploadedTypes.includes(type.toUpperCase())
  );

  // ✅ 4. If all required documents exist, block modal
  if (missingDocs.length === 0) {
    this.showError('All documents have already been uploaded or are under review.');
    return;
  }

  // ✅ 5. Otherwise, proceed to open modal for missing docs only
  this.showDocumentModal = true;

  this.documentUploadForm = this.fb.group({
    documents: this.fb.array([])
  });

  // Create form groups for missing docs
  missingDocs.forEach((type) => {
    this.documentsArray.push(this.createDocumentFormGroup(type));
  });
}




  closeDocumentModal(): void {
    this.showDocumentModal = false;
  }

  uploadDocuments(): void {
    if (this.documentUploadForm.invalid) {
      this.showError('Please fill all required fields correctly');
      return;
    }

    if (!confirm('Are you sure you want to upload these documents?')) {
      return;
    }
    if (this.documentsArray.length > 3) {
      this.showError('You can only upload a maximum of 3 documents.');
      return;
    }

    this.isLoading = true;
    const formData = new FormData();
    const metaArray: any[] = [];

    // Build FormData and meta array
    this.documentsArray.controls.forEach((control, index) => {
      const file = control.get('file')?.value;
      const fileName = control.get('fileName')?.value;
      const fileType = control.get('fileType')?.value;

      if (file) {
        formData.append('file', file);
        metaArray.push({ fileName, fileType });
      }
    });

    // Append meta as JSON string
    formData.append('meta', JSON.stringify(metaArray));

    this.orgService
      .uploadDocument(
        this.documentsArray.controls.map((c) => c.get('file')?.value).filter((f) => f),
        metaArray
      )
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (response) => {
          console.log('Documents uploaded:', response);
          this.showSuccess('✅ Documents uploaded successfully');
          this.closeDocumentModal();
          this.loadOnboardingStatus();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Failed to upload documents:', error);
          this.showError(error.error?.message || 'Failed to upload documents');
        },
      });
  }

  // Re-upload a specific rejected document
  reuploadDocument(documentId: number, file: File, meta: any): void {
    if (!file) {
      this.showError('Please select a valid file to re-upload');
      return;
    }

    if (!confirm(`Are you sure you want to re-upload ${meta.fileName || meta.documentName}?`)) {
      return;
    }

    this.isLoading = true;

    this.orgService
      .reuploadDocument(documentId, file, meta)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (response) => {
          this.showSuccess(`✅ ${meta.fileName || meta.documentName} re-uploaded successfully`);
          this.loadOnboardingStatus();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Failed to re-upload document:', error);
          this.showError(
            error.error?.message || `Failed to re-upload ${meta.fileName || meta.documentName}`
          );
        },
      });
  }
  onRejectedFileSelected(event: any, doc: any): void {
    const file = event.target.files[0];
    if (!file) return;

    // Create metadata for backend

    const meta = {
      fileName: doc.documentName,
      fileType: doc.fileType,
    };

    this.reuploadDocument(doc.documentId, file, meta);
  }

  // Bank Details Submission
  openBankModal(): void {
    this.showBankModal = true;
    this.bankDetailsForm.reset();
  }

  closeBankModal(): void {
    this.showBankModal = false;
  }

  submitBankDetails(): void {
    if (this.bankDetailsForm.invalid) {
      this.showError('Please fill all required bank details correctly');
      this.cdr.detectChanges();
      return;
    }

    if (!confirm('Are you sure you want to submit these bank details?')) {
      return;
    }

    this.isLoading = true;
    const bankData = this.bankDetailsForm.value;

    // Determine if it's first submission or reupload
    const isReupload = this.onboardingStatus?.bankStage === 'REJECTED';
    const apiCall = isReupload
      ? this.orgService.reuploadBankDetails(bankData)
      : this.orgService.addBankDetails(bankData);

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (response) => {
          console.log('Bank details submitted:', response);
          this.showSuccess('✅ Bank details submitted successfully');
          this.closeBankModal();
          this.loadOnboardingStatus();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Failed to submit bank details:', error);
          this.showError(error.error?.message || 'Failed to submit bank details');
        },
      });
  }

  // Designation Management
  addDesignation(): void {
    if (this.designationForm.invalid) {
      this.showError('Please fill all required fields correctly');
      return;
    }

    if (!confirm('Are you sure you want to add this designation?')) {
      return;
    }

    this.isLoading = true;
    const name = this.designationForm.get('name')?.value;

    this.orgService
      .addDesignation(name)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (response) => {
          this.showSuccess('✅ Designation added successfully');
          this.designationForm.reset();
          this.loadDesignations();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.showError(error.error?.message || 'Failed to add designation');
        },
      });
  }

  // Salary Template Management
  createSalaryTemplate(): void {
    if (this.salaryTemplateForm.invalid) {
      this.showError('Please fill all required fields correctly');
      return;
    }

    if (!confirm('Are you sure you want to create this salary template?')) {
      return;
    }

    this.isLoading = true;
    this.orgService
      .createSalaryTemplate(this.salaryTemplateForm.value)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (response) => {
          this.showSuccess('✅ Salary template created successfully');
          this.salaryTemplateForm.reset();
          this.loadSalaryTemplates();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.showError(error.error?.message || 'Failed to create salary template');
           this.cdr.detectChanges();
        },
      });
  }
//view salary   
  viewSalaryTemplate(template: any): void {
  // Use the template data from the list instead of making API call
  this.selectedSalaryTemplate = template;
  this.showSalaryTemplateModal = true;
  this.cdr.detectChanges();
}

closeSalaryTemplateModal(): void {
  this.showSalaryTemplateModal = false;
  this.selectedSalaryTemplate = null;
}



  // Employee Management 
 registerEmployee(): void {
    if (this.employeeForm.invalid) {
      this.showError('Please fill all required fields correctly');
      return;
    }

    if (!confirm('Are you sure you want to register this employee?')) {
      return;
    }

    this.isLoading = true;

    this.orgService
      .registerEmployee(this.employeeForm.value)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (response) => {
          this.showSuccess(`✅ Employee registered successfully. Username: ${response.username}`);
          this.employeeForm.reset();
          this.loadEmployees();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Register employee error:', error);
          this.isLoading = false;

          const errorMessage =
            error?.error?.message || error?.message || 'Failed to register employee';

          this.showError(errorMessage);
          this.cdr.detectChanges();
        },
      });
  }

  uploadEmployeesExcel(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      this.showError('Please upload a valid Excel file (.xlsx or .xls)');
      return;
    }

    if (!confirm('Are you sure you want to upload this Excel file with employee data?')) {
      event.target.value = '';
      return;
    }

    this.isLoading = true;
    this.orgService
      .uploadEmployeesExcel(file)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          event.target.value = '';
        })
      )
      .subscribe({
        next: (response) => {
          const successCount = response.successfulRegistrations?.length || 0;
          const failedCount = response.failedRegistrations?.length || 0;

          if (successCount > 0) {
            this.showSuccess(`✅ ${successCount} employees registered successfully`);
            this.cdr.detectChanges(); 
          }
          if (failedCount > 0) {
            this.showError(`⚠️ ${failedCount} employees failed to register`);
            this.cdr.detectChanges();
          }

          this.loadEmployees();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.showError(error.error?.message || 'Failed to upload employees');
          this.cdr.detectChanges();
        },
      });
  }


  // View Employee Details START
  viewEmployee(employeeId: number): void {
  this.isLoading = true;
  this.orgService.getEmployeeDetails(employeeId)
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    )
    .subscribe({
      next: (data) => {
        this.selectedEmployee = data;
        this.showEmployeeModal = true;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load employee details', error);
        this.showError('Failed to load employee details');
      }
    });
}
closeEmployeeModal(): void {
  this.showEmployeeModal = false;
  this.selectedEmployee = null;
}

// Add after closeEmployeeModal() method

viewDocument(fileUrl: string): void {
  if (!fileUrl) {
    this.showError('Document URL not available');
    return;
  }
  window.open(fileUrl, '_blank');
}

verifyEmployeeDocument(employeeId: number, documentId: number): void {
  if (!confirm('Are you sure you want to approve this document?')) {
    return;
  }

  this.isLoading = true;
  const request = { verified: true };

  this.orgService.verifyEmployeeDocument(employeeId, documentId, request)
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    )
    .subscribe({
      next: (response) => {
        this.showSuccess('✅ Document approved successfully');
        this.viewEmployee(employeeId);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.showError(error.error?.message || 'Failed to approve document');
      }
    });
}

rejectEmployeeDocument(employeeId: number, documentId: number): void {
  const reason = prompt('Please provide a reason for rejection:');
  
  if (!reason || reason.trim() === '') {
    this.showError('Rejection reason is required');
    return;
  }

  if (!confirm('Are you sure you want to reject this document?')) {
    return;
  }

  this.isLoading = true;
  const request = { verified: false, reason: reason };

  this.orgService.verifyEmployeeDocument(employeeId, documentId, request)
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    )
    .subscribe({
      next: (response) => {
        this.showSuccess('Document rejected');
        this.viewEmployee(employeeId);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.showError(error.error?.message || 'Failed to reject document');
      }
    });
}

verifyEmployeeBankDetails(employeeId: number): void {
  if (!confirm('Are you sure you want to approve bank details?')) {
    return;
  }

  this.isLoading = true;
  const request = { verified: true };

  this.orgService.verifyEmployeeBankDetails(employeeId, request)
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    )
    .subscribe({
      next: (response) => {
        this.showSuccess('✅ Bank details approved successfully');
        this.viewEmployee(employeeId);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.showError(error.error?.message || 'Failed to approve bank details');
      }
    });
}

rejectEmployeeBankDetails(employeeId: number): void {
  const reason = prompt('Please provide a reason for rejection:');
  
  if (!reason || reason.trim() === '') {
    this.showError('Rejection reason is required');
    return;
  }

  if (!confirm('Are you sure you want to reject bank details?')) {
    return;
  }

  this.isLoading = true;
  const request = { verified: false, reason: reason };

  this.orgService.verifyEmployeeBankDetails(employeeId, request)
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    )
    .subscribe({
      next: (response) => {
        this.showSuccess('Bank details rejected');
        this.viewEmployee(employeeId);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.showError(error.error?.message || 'Failed to reject bank details');
      }
    });
}

completeEmployeeOnboarding(employeeId: number): void {
  if (!confirm('Are you sure you want to approve and activate this employee?')) {
    return;
  }

  this.isLoading = true;

  this.orgService.completeEmployeeOnboarding(employeeId)
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    )
    .subscribe({
      next: (response) => {
        this.showSuccess('✅ Employee activated successfully!');
        this.closeEmployeeModal();
        this.loadEmployees();
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.showError(error.error?.message || 'Failed to activate employee');
      }
    });
}

canActivateEmployee(): boolean {
  if (!this.selectedEmployee) return false;
  
  const allDocsApproved = this.selectedEmployee.documents?.every((doc: any) => doc.status === 'APPROVED') || false;
  const bankApproved = this.selectedEmployee.bankVerificationStatus === 'APPROVED';
  
  return allDocsApproved && bankApproved && this.selectedEmployee.status !== 'ACTIVE';
}



//END EMployee DETAILS


  // Payroll Management
  generatePayroll(month: string): void {
    if (!month) {
      this.showError('Please select a month');
      return;
    }

    if (!confirm(`Are you sure you want to generate payroll for ${month}?`)) {
      return;
    }

    this.isLoading = true;
    this.orgService
      .generatePayroll(month)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (response) => {
          this.showSuccess(response.message || '✅ Payroll generated successfully');
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.showError(error.error?.message || 'Failed to generate payroll');
          this.cdr.detectChanges();
        },
      });
  }

  submitPayroll(month: string): void {
    if (!month) {
      this.showError('Please select a month');
      return;
    }

    if (!confirm(`Are you sure you want to submit payroll for ${month} to the bank?`)) {
      return;
    }

    this.isLoading = true;
    this.orgService
      .submitPayrollToBank(month)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (response) => {
          this.showSuccess(response.message || '✅ Payroll submitted to bank successfully');
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.showError(error.error?.message || 'Failed to submit payroll');
          this.cdr.detectChanges();
        },
      });
  }

// vendor management section
 // ========== VENDOR MANAGEMENT METHODS ==========

/**
 * Load all vendors
 */
loadVendors(): void {
  this.orgService.getAllVendors()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        this.vendors = data || [];
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load vendors', error);
        this.showError('Failed to load vendors');
      }
    });
}

/**
 * Open vendor modal for create/edit
 */
openVendorModal(vendor?: any): void {
  this.showVendorModal = true;
  this.selectedVendor = vendor;
  
  if (vendor) {
    // Edit mode - patch form with vendor data
    this.vendorForm.patchValue(vendor);
  } else {
    // Create mode - reset form
    this.vendorForm.reset();
  }
}

/**
 * Close vendor modal
 */
closeVendorModal(): void {
  this.showVendorModal = false;
  this.selectedVendor = null;
  this.vendorForm.reset();
}

/**
 * Save vendor (create or update)
 */
saveVendor(): void {
  if (this.vendorForm.invalid) {
    this.showError('Please fill all required fields correctly');
    return;
  }

  const action = this.selectedVendor ? 'update' : 'create';
  if (!confirm(`Are you sure you want to ${action} this vendor?`)) {
    return;
  }

  this.isLoading = true;
  const vendorData = this.vendorForm.value;

  const apiCall = this.selectedVendor
    ? this.orgService.updateVendor(this.selectedVendor.id, vendorData)
    : this.orgService.createVendor(vendorData);

  apiCall
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    )
    .subscribe({
      next: (response) => {
        this.showSuccess(`✅ Vendor ${action}d successfully`);
        this.closeVendorModal();
        this.loadVendors();
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.showError(error.error?.message || `Failed to ${action} vendor`);
        this.cdr.detectChanges();
      }
    });
}

/**
 * View vendor details
 */
viewVendorDetails(vendorId: number): void {
  this.isLoading = true;
  this.orgService.getVendorById(vendorId)
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    )
    .subscribe({
      next: (data) => {
        this.selectedVendor = data;
        this.showVendorDetailModal = true;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.showError('Failed to load vendor details');
        console.error(error);
      }
    });
}

/**
 * Close vendor detail modal
 */
closeVendorDetailModal(): void {
  this.showVendorDetailModal = false;
  this.selectedVendor = null;
}

/**
 * Delete vendor
 */
deleteVendor(vendorId: number, vendorName: string): void {
  if (!confirm(`Are you sure you want to delete vendor "${vendorName}"? This action cannot be undone.`)) {
    return;
  }

  this.isLoading = true;
  this.orgService.deleteVendor(vendorId)
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    )
    .subscribe({
      next: () => {
        this.showSuccess('✅ Vendor deleted successfully');
        this.loadVendors();
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.showError(error.error?.message || 'Failed to delete vendor');
        this.cdr.detectChanges();
      }
    });
}

// ========== VENDOR PAYMENT REQUEST METHODS ==========

/**
 * Load vendor payment requests
 */
loadVendorPaymentRequests(): void {
  this.orgService.getAllVendorPaymentRequests()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        this.vendorPaymentRequests = data || [];
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load payment requests', error);
        this.showError('Failed to load payment requests');
      }
    });
}

/**
 * Open payment request modal
 */
openVendorPaymentModal(): void {
  if (this.vendors.length === 0) {
    this.showError('Please create at least one vendor before making a payment request');
    return;
  }
  
  this.showVendorPaymentModal = true;
  this.vendorPaymentForm.reset({ requestType: 'VENDOR' });
}

/**
 * Close payment request modal
 */
closeVendorPaymentModal(): void {
  this.showVendorPaymentModal = false;
  this.vendorPaymentForm.reset();
}

/**
 * Create vendor payment request
 */
createVendorPaymentRequest(): void {
  if (this.vendorPaymentForm.invalid) {
    this.showError('Please fill all required fields correctly');
    return;
  }

  if (!confirm('Are you sure you want to create this payment request?')) {
    return;
  }

  this.isLoading = true;
  const paymentData = this.vendorPaymentForm.value;

  this.orgService.createVendorPaymentRequest(paymentData)
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    )
    .subscribe({
      next: (response) => {
        this.showSuccess('✅ Payment request created successfully');
        this.closeVendorPaymentModal();
        this.loadVendorPaymentRequests();
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.showError(error.error?.message || 'Failed to create payment request');
        this.cdr.detectChanges();
      }
    });
}

// * View payment request details


viewPaymentRequestDetails(paymentRequest: any): void {
  // Backend returns 'paymentId', not 'id'
  const paymentId = paymentRequest.paymentId;
  
  if (!paymentId) {
    console.error('Payment Request:', paymentRequest);
    this.showError('Payment request ID is missing');
    return;
  }

  this.isLoading = true;
  this.orgService.getVendorPaymentRequestById(paymentId)
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    )
    .subscribe({
      next: (data) => {
        this.selectedPaymentRequest = data;
        this.showPaymentDetailModal = true;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.showError('Failed to load payment request details');
        console.error(error);
      }
    });
}

/**
 * Close payment detail modal
 */
closePaymentDetailModal(): void {
  this.showPaymentDetailModal = false;
  this.selectedPaymentRequest = null;
}
//vendor methods end



  // Disable upload button if documents are already uploaded or under review/approved
  isDocumentUploadDisabled(): boolean {
    if (!this.onboardingStatus) return false;
    return (
      this.onboardingStatus.documentStage === 'UNDER_REVIEW' ||
      this.onboardingStatus.documentStage === 'APPROVED' ||
      this.onboardingStatus.documentStage === 'PROVIDED'
    );
  }

  // Disable bank button if details are already provided or under review/approved
  isBankDetailsDisabled(): boolean {
    if (!this.onboardingStatus) return false;
    return (
      this.onboardingStatus.bankStage === 'UNDER_REVIEW' ||
      this.onboardingStatus.bankStage === 'APPROVED' ||
      this.onboardingStatus.bankStage === 'PROVIDED'
    );
  }
 getAvailableDocumentTypes(index: number): string[] {
  // Get all already uploaded file types from onboardingStatus
  const uploadedTypes = (this.onboardingStatus?.documents || [])
    .filter((doc: any) => ['APPROVED', 'UNDER_REVIEW', 'PENDING'].includes(doc.status?.toUpperCase()))
    .map((doc: any) => doc.fileType?.toUpperCase());

  // Also track selections within the current form (while open)
  const selectedInForm = this.documentsArray.controls
    .map(control => control.get('fileType')?.value?.toUpperCase())
    .filter(type => !!type && type !== this.documentsArray.at(index).get('fileType')?.value?.toUpperCase());

  //  Combine both
  const usedTypes = [...new Set([...uploadedTypes, ...selectedInForm])];

  // Return only unused document types
  return this.allowedDocumentTypes.filter(type => !usedTypes.includes(type.toUpperCase()));
}

shouldBlurDocumentAction(): boolean {
  if (!this.onboardingStatus) return false;

  // Blur if any document is rejected OR all docs are uploaded
  const docs = this.onboardingStatus.documents || [];
  const hasRejected = docs.some((d: any) => d.status?.toUpperCase() === 'REJECTED');

  const uploadedTypes = docs.map((d: any) => d.fileType?.toUpperCase());
  const allUploaded = this.allowedDocumentTypes.every(type =>
    uploadedTypes.includes(type.toUpperCase())
  );

  return hasRejected || allUploaded;
}


  // Utility Methods

  switchTab(tab: string): void {
  // Check for onboarding completion
  if (!this.isOnboardingComplete() && tab !== 'dashboard') {
    this.showError('Complete your onboarding (100%) to access this feature');
    return;
  }

  // Check if organization is active
  if (!this.isOrganizationActive() && tab !== 'dashboard') {
    this.showError('Your organization is not active yet. Please wait for admin activation.');
    return;
  }

  this.activeTab = tab;
  this.clearMessages();

  // Load data based on active tab
  if (tab === 'concerns') {
    this.loadConcerns();
  } else if (tab === 'employees') {
    this.loadEmployees();
  } else if (tab === 'templates') {
    this.loadSalaryTemplates();
  } else if (tab === 'designations') {
    this.loadDesignations();
  } else if (tab === 'vendors') {
    this.loadVendors();
    this.loadVendorPaymentRequests();
  }
}

  getProgress(): number {
    if (!this.onboardingStatus) return 0;

    let progress = 0;
    if (this.onboardingStatus.documentStage === 'APPROVED') progress += 50;
    if (this.onboardingStatus.bankStage === 'APPROVED') progress += 50;

    return progress;
  }

  isOnboardingComplete(): boolean {
    return this.getProgress() === 100;
  }

  canAccessFeature(): boolean {
    return (
      this.isOnboardingComplete() &&
      this.onboardingStatus?.organizationStatus?.toUpperCase() === 'ACTIVE'
    );
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
    setTimeout(() => {
      this.clearMessages();
    }, 5000);
  }

  logout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }

  // Pagination
  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      if (this.activeTab === 'templates') {
        this.loadSalaryTemplates();
      } else if (this.activeTab === 'concerns') {
        this.loadConcerns();
      }
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      if (this.activeTab === 'templates') {
        this.loadSalaryTemplates();
      } else if (this.activeTab === 'concerns') {
        this.loadConcerns();
      }
    }
  }
}

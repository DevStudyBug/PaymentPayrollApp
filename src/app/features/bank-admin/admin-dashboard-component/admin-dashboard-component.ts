import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth-service';
import { BankAdminService } from '../../../core/services/bank-admin-service';
import { 
  BankAdminOrgRegisterResponse, 
  PaymentRequestList,
  PaymentRequestDetail
} from '../../../core/models/response-model.models';
import { PaymentRequestFilter } from '../../../core/models/request-model.models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard-component.html',
  styleUrls: ['./admin-dashboard-component.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {

  userEmail: string = '';
  userId: number = 0;
  userRoles: string[] = [];

  activeTab: string = 'overview';
  loading: boolean = false;
  processingAction: boolean = false;

  // Organizations
  allOrganizations: BankAdminOrgRegisterResponse[] = [];
  filteredOrganizations: BankAdminOrgRegisterResponse[] = [];
  selectedOrganization: BankAdminOrgRegisterResponse | null = null;
  orgFilter: string = 'ALL';

  totalOrgCount: number = 0;
  pendingOrgCount: number = 0;
  underReviewOrgCount: number = 0;
  activeOrgCount: number = 0;
  rejectedOrgCount: number = 0;

  // Payments
  paymentRequests: PaymentRequestList[] = [];
  selectedPaymentRequest: PaymentRequestDetail | null = null;
  totalPaymentRequests: number = 0;
  totalPages: number = 0;
  currentPage: number = 0;

  paymentFilters: PaymentRequestFilter = {
    page: 0,
    size: 10,
    sortBy: 'requestDate',
    sortDir: 'desc'
  };

  // Modal
  showRejectModal: boolean = false;
  rejectType: string = '';
  rejectReason: string = '';
  rejectTargetId: number = 0;
  rejectTargetDocId: number = 0;
  currentOrgId: number = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private bankAdminService: BankAdminService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeUserInfo();
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeUserInfo(): void {
    const authUserInfo = this.authService.getUserInfo();
    if (authUserInfo) {
      this.userEmail = authUserInfo.email;
      this.userId = authUserInfo.userId;
      this.userRoles = authUserInfo.roles;
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
    this.selectedOrganization = null;
    this.selectedPaymentRequest = null;

    if (tab === 'organizations') {
      this.orgFilter = 'ALL';
      this.applyOrgFilter();
    } else if (tab === 'payment') {
      this.resetPaymentFilters();
    }
    this.cdr.detectChanges();
  }

  private loadDashboardData(): void {
    this.fetchAllOrganizations();
    this.fetchPaymentRequests();
  }

  private fetchAllOrganizations(): void {
    this.loading = true;
    this.bankAdminService.getAllOrganizations()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data) => {
          this.allOrganizations = data || [];
          this.calculateStats();
          this.applyOrgFilter();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error fetching organizations:', err);
          this.allOrganizations = [];
          this.calculateStats();
          this.applyOrgFilter();
          this.showAlert('Failed to load organizations: ' + (err?.error?.message || err?.message || 'Unknown error'));
          this.cdr.detectChanges();
        }
      });
  }

  private calculateStats(): void {
    this.totalOrgCount = this.allOrganizations.length;
    this.pendingOrgCount = this.allOrganizations.filter(o => o.status === 'PENDING').length;
    this.underReviewOrgCount = this.allOrganizations.filter(o => o.status === 'UNDER_REVIEW').length;
    this.activeOrgCount = this.allOrganizations.filter(o => o.status === 'ACTIVE').length;
    this.rejectedOrgCount = this.allOrganizations.filter(o => o.status === 'REJECTED').length;
  }

  applyOrgFilter(): void {
    if (this.orgFilter === 'ALL') {
      this.filteredOrganizations = [...this.allOrganizations];
    } else {
      this.filteredOrganizations = this.allOrganizations.filter(org => org.status === this.orgFilter);
    }
    this.cdr.detectChanges();
  }

  changeOrgFilter(filter: string): void {
    this.orgFilter = filter;
    this.applyOrgFilter();
  }

  selectOrganization(org: BankAdminOrgRegisterResponse): void {
    this.selectedOrganization = org;
    this.currentOrgId = org.orgId;
    this.cdr.detectChanges();
  }

  hasBankDetails(org: BankAdminOrgRegisterResponse | null): boolean {
    if (!org) return false;
    const hasBankFlag = (org as any).bankDetailsProvided === true;
    const hasIndividualFields = !!(org.accountHolderName && org.accountNumber && org.ifscCode && org.bankName);
    return hasBankFlag || hasIndividualFields;
  }

  maskAccountNumber(accountNumber: string | undefined | null): string {
    if (!accountNumber || accountNumber.length <= 4) return accountNumber || '';
    const lastFour = accountNumber.slice(-4);
    const maskedPortion = '*'.repeat(accountNumber.length - 4);
    return `${maskedPortion}${lastFour}`;
  }

  areAllDocumentsApproved(org: BankAdminOrgRegisterResponse | null): boolean {
    if (!org || !org.documents || org.documents.length === 0) return false;
    return org.documents.every(doc => doc.status === 'APPROVED');
  }

  canVerifyOrganization(org: BankAdminOrgRegisterResponse | null): boolean {
    if (!org) return false;
    const docsApproved = this.areAllDocumentsApproved(org);
    const bankApproved = org.bankVerificationStatus === 'APPROVED';
    return docsApproved && bankApproved;
  }

  verifyOrganization(orgId: number): void {
    if (!confirm('Are you sure you want to verify and activate this organization?')) return;

    this.processingAction = true;
    this.cdr.detectChanges();

    this.bankAdminService.verifyOrganization(orgId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.processingAction = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          const org = this.allOrganizations.find(o => o.orgId === orgId);
          if (org) org.status = 'ACTIVE'; // instant UI update
          this.showAlert('✅ Organization verified successfully!');
          this.fetchAllOrganizations();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.showAlert('❌ Failed to verify organization: ' + (err?.error?.message || 'Unknown error'));
          this.cdr.detectChanges();
        }
      });
  }

  verifyDocument(docId: number): void {
    if (!confirm('Are you sure you want to approve this document?')) return;
    if (!this.selectedOrganization) return;

    const doc = this.selectedOrganization.documents.find(d => d.docId === docId);
    if (doc) doc.status = 'APPROVED'; // instant feedback
    this.processingAction = true;
    this.cdr.detectChanges();

    this.bankAdminService.verifyDocument(this.selectedOrganization.orgId, docId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.processingAction = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.showAlert('✅ Document approved successfully!');
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          if (doc) doc.status = 'PENDING'; // revert if error
          this.showAlert('❌ Failed to approve document: ' + (err?.error?.message || 'Unknown error'));
          this.cdr.detectChanges();
        }
      });
  }

  verifyBankDetails(): void {
    if (!confirm('Are you sure you want to approve bank details?')) return;
    if (!this.selectedOrganization) return;

    const prevStatus = this.selectedOrganization.bankVerificationStatus;
    this.selectedOrganization.bankVerificationStatus = 'APPROVED'; // instant feedback
    this.processingAction = true;
    this.cdr.detectChanges();

    this.bankAdminService.verifyBankDetails(this.selectedOrganization.orgId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.processingAction = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.showAlert('✅ Bank details approved successfully!');
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.selectedOrganization!.bankVerificationStatus = prevStatus; // rollback
          this.showAlert('❌ Failed to approve bank details: ' + (err?.error?.message || 'Unknown error'));
          this.cdr.detectChanges();
        }
      });
  }

  viewDocument(fileUrl: string): void {
    if (!fileUrl) {
      this.showAlert('Document URL not available');
      return;
    }
    window.open(fileUrl, '_blank');
  }

  private fetchPaymentRequests(): void {
    this.bankAdminService.getFilteredPaymentRequests(this.paymentFilters)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.cdr.detectChanges())
      )
      .subscribe({
        next: (res) => {
          this.paymentRequests = res.content || [];
          this.totalPages = res.totalPages || 0;
          this.totalPaymentRequests = res.totalElements || 0;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.warn('Payment requests not available:', err);
          this.paymentRequests = [];
          this.totalPages = 0;
          this.totalPaymentRequests = 0;
          this.cdr.detectChanges();
        }
      });
  }

  selectPaymentRequest(paymentId: number): void {
    this.bankAdminService.getPaymentRequestDetail(paymentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.selectedPaymentRequest = res;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.showAlert('Failed to load payment details: ' + (err?.error?.message || 'Unknown error'));
          this.cdr.detectChanges();
        }
      });
  }

  approvePayment(paymentId: number): void {
    if (!confirm('Are you sure you want to approve this payment request?')) return;

    const payment = this.paymentRequests.find(p => p.paymentId === paymentId);
    if (payment) payment.status = 'APPROVED'; // instant UI update

    this.processingAction = true;
    this.cdr.detectChanges();

    this.bankAdminService.approvePaymentRequest(paymentId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.processingAction = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.showAlert('✅ Payment approved successfully!');
          this.fetchPaymentRequests();
          this.selectedPaymentRequest = null;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          if (payment) payment.status = 'PENDING'; // rollback
          this.showAlert('❌ Failed to approve payment: ' + (err?.error?.message || 'Unknown error'));
          this.cdr.detectChanges();
        }
      });
  }

  disbursePayment(paymentId: number): void {
    if (!confirm('Are you sure you want to disburse this payment?')) return;

    const payment = this.paymentRequests.find(p => p.paymentId === paymentId);
    if (payment) payment.status = 'DISBURSED'; // instant UI update

    this.processingAction = true;
    this.cdr.detectChanges();

    this.bankAdminService.disbursePayment(paymentId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.processingAction = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.showAlert('✅ Payment disbursed successfully!');
          this.fetchPaymentRequests();
          this.selectedPaymentRequest = null;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          if (payment) payment.status = 'APPROVED'; // rollback
          this.showAlert('❌ Failed to disburse payment: ' + (err?.error?.message || 'Unknown error'));
          this.cdr.detectChanges();
        }
      });
  }

  filterPayments(): void {
    this.currentPage = 0;
    this.paymentFilters.page = 0;
    this.fetchPaymentRequests();
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.paymentFilters.page = this.currentPage;
      this.fetchPaymentRequests();
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.paymentFilters.page = this.currentPage;
      this.fetchPaymentRequests();
    }
  }

  private resetPaymentFilters(): void {
    this.paymentFilters = {
      page: 0,
      size: 10,
      sortBy: 'requestDate',
      sortDir: 'desc'
    };
    this.currentPage = 0;
    this.fetchPaymentRequests();
  }

  openRejectModal(type: string, targetId: number, docId: number = 0): void {
    this.rejectType = type;
    this.rejectTargetId = targetId;
    this.rejectTargetDocId = docId;
    this.rejectReason = '';
    this.showRejectModal = true;
    this.cdr.detectChanges();
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.rejectReason = '';
    this.cdr.detectChanges();
  }

  submitReject(): void {
    if (!this.rejectReason.trim()) {
      this.showAlert('⚠️ Please provide a reason for rejection');
      return;
    }

    if (!confirm('Are you sure you want to reject this? This action will notify the organization.')) {
      return;
    }

    this.processingAction = true;
    this.cdr.detectChanges();

    const handler = this.getRejectHandler();
    if (handler) {
      handler.pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.processingAction = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.showAlert('✅ Rejected successfully!');
          this.closeRejectModal();
          this.refreshAfterAction();
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error(err);
          this.showAlert('❌ Failed to reject: ' + (err?.error?.message || 'Unknown error'));
          this.cdr.detectChanges();
        }
      });
    }
  }

  private getRejectHandler(): any {
    switch (this.rejectType) {
      case 'org':
        return this.bankAdminService.rejectOrganization(this.rejectTargetId, this.rejectReason);
      case 'document':
        return this.bankAdminService.rejectDocument(this.currentOrgId, this.rejectTargetDocId, this.rejectReason);
      case 'bank':
        return this.bankAdminService.rejectBankDetails(this.rejectTargetId, this.rejectReason);
      case 'payment':
        return this.bankAdminService.rejectPaymentRequest(this.rejectTargetId, { reason: this.rejectReason });
      default:
        return null;
    }
  }

  private refreshAfterAction(): void {
    if (this.rejectType === 'payment') {
      this.fetchPaymentRequests();
      this.selectedPaymentRequest = null;
    } else {
      this.fetchAllOrganizations();
      this.selectedOrganization = null;
    }
    this.cdr.detectChanges();
  }

  getStatusClass(status: string): string {
    const map: { [key: string]: string } = {
      'PENDING': 'badge-warning',
      'UNDER_REVIEW': 'badge-info',
      'ACTIVE': 'badge-success',
      'REJECTED': 'badge-danger',
      'APPROVED': 'badge-success',
      'NOT_SUBMITTED': 'badge-secondary',
      'DISBURSED': 'badge-success'
    };
    return map[status] || 'badge-secondary';
  }

  private showAlert(msg: string): void {
    alert(msg);
  }
}

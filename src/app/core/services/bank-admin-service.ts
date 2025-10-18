import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  BankAdminOrgRegisterResponse, 
  OrganizationOnboardingStatus, 
  PaymentRequestDetail, 
  PaymentRequestPageResponse, 
  PayrollActionResponse 
} from '../models/response-model.models';
import { PaymentRequestFilter, RejectRequest } from '../models/request-model.models';
import { AuthService } from './auth-service';

@Injectable({
  providedIn: 'root'
})
export class BankAdminService {
  private readonly apiUrl = 'http://localhost:8080/api/v1/bank-admin';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}
  

  // Get headers with JWT token
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    console.log('Token being sent:', token ? 'Present' : 'Missing');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ===========================
  // ORGANIZATION ENDPOINTS
  // ===========================

  getAllOrganizations(status?: string): Observable<BankAdminOrgRegisterResponse[]> {
    let params = new HttpParams();
    if (status && status !== 'ALL') {
      params = params.set('status', status);
    }
    return this.http.get<BankAdminOrgRegisterResponse[]>(
      `${this.apiUrl}/organizations`,
      { 
        headers: this.getHeaders(),
        params 
      }
    );
  }

  verifyOrganization(orgId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/organizations/${orgId}/verify`,
      {},
      { headers: this.getHeaders() }
    );
  }

  rejectOrganization(orgId: number, reason: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/organizations/${orgId}/reject`,
      { reason },
      { headers: this.getHeaders() }
    );
  }

  // ===========================
  // DOCUMENT ENDPOINTS
  // ===========================

  verifyDocument(orgId: number, docId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/organizations/${orgId}/documents/${docId}/verify`,
      {},
      { headers: this.getHeaders() }
    );
  }

  rejectDocument(orgId: number, docId: number, reason: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/organizations/${orgId}/documents/${docId}/reject`,
      { reason },
      { headers: this.getHeaders() }
    );
  }

  // ===========================
  // BANK DETAILS ENDPOINTS
  // ===========================

  verifyBankDetails(orgId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/organizations/${orgId}/bank/verify`,
      {},
      { headers: this.getHeaders() }
    );
  }

  rejectBankDetails(orgId: number, reason: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/organizations/${orgId}/bank/reject`,
      { reason },
      { headers: this.getHeaders() }
    );
  }

  // ===========================
  // PAYMENT REQUEST ENDPOINTS
  // ===========================

  getFilteredPaymentRequests(filter: PaymentRequestFilter): Observable<PaymentRequestPageResponse> {
    let params = new HttpParams()
      .set('page', filter.page.toString())
      .set('size', filter.size.toString())
      .set('sortBy', filter.sortBy)
      .set('sortDir', filter.sortDir);

    if (filter.status) params = params.set('status', filter.status);
    if (filter.type) params = params.set('type', filter.type);
    if (filter.orgId) params = params.set('orgId', filter.orgId.toString());
    if (filter.startDate) params = params.set('startDate', filter.startDate.toISOString());
    if (filter.endDate) params = params.set('endDate', filter.endDate.toISOString());

    return this.http.get<PaymentRequestPageResponse>(
      `${this.apiUrl}/requests`,
      { 
        headers: this.getHeaders(),
        params 
      }
    );
  }

  getPaymentRequestDetail(paymentRequestId: number): Observable<PaymentRequestDetail> {
    return this.http.get<PaymentRequestDetail>(
      `${this.apiUrl}/requests/${paymentRequestId}`,
      { headers: this.getHeaders() }
    );
  }

  approvePaymentRequest(paymentRequestId: number): Observable<PayrollActionResponse> {
    return this.http.put<PayrollActionResponse>(
      `${this.apiUrl}/approve/${paymentRequestId}`,
      {},
      { headers: this.getHeaders() }
    );
  }

  rejectPaymentRequest(paymentRequestId: number, rejectRequest: RejectRequest): Observable<PayrollActionResponse> {
    return this.http.put<PayrollActionResponse>(
      `${this.apiUrl}/reject/${paymentRequestId}`,
      rejectRequest,
      { headers: this.getHeaders() }
    );
  }

  disbursePayment(paymentRequestId: number): Observable<PayrollActionResponse> {
    return this.http.put<PayrollActionResponse>(
      `${this.apiUrl}/disburse/${paymentRequestId}`,
      {},
      { headers: this.getHeaders() }
    );
  }

  // ===========================
  // ORGANIZATION ONBOARDING STATUS
  // ===========================

  getOrganizationOnboardingStatus(orgId: number): Observable<OrganizationOnboardingStatus> {
    return this.http.get<OrganizationOnboardingStatus>(
      `${this.apiUrl}/organizations/${orgId}/onboarding-status`,
      { headers: this.getHeaders() }
    );
  }
}
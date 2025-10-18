// organization.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth-service';

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  private apiUrl = 'http://localhost:8080/api/v1/org';

  constructor(private http: HttpClient,
      private authService: AuthService
  ) 
  {}

  // Get headers with JWT token
 private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    console.log('Token being sent:', token ? 'Present' : 'Missing');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
  // Get headers for multipart form data (no Content-Type, browser sets it)
  private getHeadersForFormData(): HttpHeaders {
    const token = this.authService.getToken();
    console.log('OrganizationService - Token for FormData:', token ? 'Present' : 'Missing');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  };

  // Document Management
  uploadDocument(files: File[], meta: any): Observable<any> {
    const formData = new FormData();
    files.forEach(file => formData.append('file', file));
    formData.append('meta', JSON.stringify(meta));
    return this.http.post(`${this.apiUrl}/upload-document`, formData, {
      headers: this.getHeadersForFormData()
    });
  }

  reuploadDocument(documentId: number, file: File, meta: any): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('meta', JSON.stringify(meta));
    return this.http.put(`${this.apiUrl}/documents/${documentId}/reupload`, formData, {
      headers: this.getHeadersForFormData()
    });
  }

  // Bank Details Management
  addBankDetails(request: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/add-bank-details`, request, {
      headers: this.getHeaders()
    });
  }

  reuploadBankDetails(request: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/bank/reupload`, request, {
      headers: this.getHeaders()
    });
  }

  // Onboarding Status
  getOnboardingStatus(): Observable<any> {
    return this.http.get(`${this.apiUrl}/onboarding-status`, {
      headers: this.getHeaders()
    });
  }

  // Designations
  addDesignation(name: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/designations`, null, {
      params: { name },
      headers: this.getHeaders()
    });
  }

  getAllDesignations(): Observable<any> {
    return this.http.get(`${this.apiUrl}/designations`, {
      headers: this.getHeaders()
    });
  }

  // Salary Templates
  createSalaryTemplate(request: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/salary-templates`, request, {
      headers: this.getHeaders()
    });
  }

  getAllSalaryTemplates(page: number = 0, size: number = 5, sortBy: string = 'designation', sortDir: string = 'asc'): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);
    return this.http.get(`${this.apiUrl}/salary-templates`, { 
      params,
      headers: this.getHeaders()
    });
  }

  getSalaryTemplateById(templateId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/salary-templates/${templateId}`, {
      headers: this.getHeaders()
    });
  }

  // Employee Management
  registerEmployee(request: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/employees`, request, {
      headers: this.getHeaders()
    });
  }

  uploadEmployeesExcel(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/multiple-employees`, formData, {
      headers: this.getHeadersForFormData()
    });
  }

  getEmployeesByStatus(status: string = 'ALL'): Observable<any> {
    return this.http.get(`${this.apiUrl}/employees/filter`, {
      params: { status },
      headers: this.getHeaders()
    });
  }

  getEmployeeDetails(employeeId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/employees/${employeeId}/details`, {
      headers: this.getHeaders()
    });
  }

  verifyEmployeeDocument(employeeId: number, documentId: number, request: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/employees/${employeeId}/document/${documentId}/verify`, request, {
      headers: this.getHeaders()
    });
  }

  verifyEmployeeBankDetails(employeeId: number, request: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/employees/${employeeId}/bank/verify`, request, {
      headers: this.getHeaders()
    });
  }

  completeEmployeeOnboarding(employeeId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/employees/${employeeId}/complete-onboarding`, {}, {
      headers: this.getHeaders()
    });
  }

  // Payroll Management
  generatePayroll(month: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/payroll/generate/${month}`, {}, {
      headers: this.getHeaders()
    });
  }

  submitPayrollToBank(month: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/payroll/submit/${month}`, {}, {
      headers: this.getHeaders()
    });
  }

  // Concerns/Support Tickets
  getAllConcerns(orgId?: number, status?: string, priority?: string, page: number = 0, size: number = 10): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (orgId) params = params.set('orgId', orgId.toString());
    if (status) params = params.set('status', status);
    if (priority) params = params.set('priority', priority);

    return this.http.get(`${this.apiUrl}/concerns`, { 
      params,
      headers: this.getHeaders()
    });
  }

  getConcernByTicket(ticketNumber: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/concerns/${ticketNumber}`, {
      headers: this.getHeaders()
    });
  }

  respondToConcern(ticketNumber: string, response: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/concerns/${ticketNumber}/respond`, response, {
      headers: this.getHeaders()
    });
  }

  resolveConcern(ticketNumber: string, response: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/concerns/${ticketNumber}/resolve`, response, {
      headers: this.getHeaders()
    });
  }

  rejectConcern(ticketNumber: string, response: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/concerns/${ticketNumber}/reject`, response, {
      headers: this.getHeaders()
    });
  }

// ========== VENDOR MANAGEMENT METHODS ==========

//Create a new vendor*/
createVendor(vendor: any): Observable<any> {
  return this.http.post(`${this.apiUrl}/vendors`, vendor, {
    headers: this.getHeaders()
  });
}

// Get all vendors
getAllVendors(): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/vendors`, {
    headers: this.getHeaders()
  });
}

// Get vendor by ID

getVendorById(vendorId: number): Observable<any> {
  return this.http.get(`${this.apiUrl}/vendors/${vendorId}`, {
    headers: this.getHeaders()
  });
}


 //Update vendor

updateVendor(vendorId: number, vendor: any): Observable<any> {
  return this.http.put(`${this.apiUrl}/vendors/${vendorId}`, vendor, {
    headers: this.getHeaders()
  });
}

// Delete vendor

deleteVendor(vendorId: number): Observable<any> {
  return this.http.delete(`${this.apiUrl}/vendors/${vendorId}`, {
    headers: this.getHeaders()
  });
}

// ========== VENDOR PAYMENT REQUEST METHODS ==========

/**
 * Create vendor payment request
 */
createVendorPaymentRequest(request: any): Observable<any> {
  return this.http.post(`${this.apiUrl}/vendors/payment-requests`, request, {
    headers: this.getHeaders()
  });
}

/**
 * Get all vendor payment requests
 */
getAllVendorPaymentRequests(): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/vendors/payment-requests`, {
    headers: this.getHeaders()
  });
}

/**
 * Get vendor payment request by ID
 */
getVendorPaymentRequestById(id: number): Observable<any> {
  return this.http.get(`${this.apiUrl}/vendors/payment-requests/${id}`, {
    headers: this.getHeaders()
  });
}

}
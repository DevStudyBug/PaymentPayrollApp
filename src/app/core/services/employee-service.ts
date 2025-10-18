// employee.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth-service';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = 'http://localhost:8080/api/v1/employees';

  constructor(private http: HttpClient,
      private authService: AuthService
  ) {}

  // Get headers with JWT token
  private getHeaders(): HttpHeaders {
   const token = this.authService.getToken();
    console.log('EmployeeService - Token:', token ? 'Present' : 'Missing');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Get headers for form data (no Content-Type)
  private getHeadersForFormData(): HttpHeaders {
     const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // Get onboarding status
  getOnboardingStatus(): Observable<any> {
    return this.http.get(`${this.apiUrl}/onboarding-status`, {
      headers: this.getHeaders()
    });
  }

  // Upload documents
  uploadDocuments(files: File[], docTypes: string[]): Observable<any> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    docTypes.forEach(type => formData.append('docTypes', type));
    
    return this.http.post(`${this.apiUrl}/document/uploads`, formData, {
     headers: this.getHeadersForFormData()
    });
  }

  // Reupload rejected document
  reuploadDocument(documentId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post(`${this.apiUrl}/reupload-document/${documentId}`, formData, {
      headers: this.getHeadersForFormData()
    });
  }

  // Add bank details
  addBankDetails(request: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/add-bank-details`, request, {
      headers: this.getHeaders()
    });
  }

  // Reupload bank details
  reuploadBankDetails(request: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/reupload/bank-details`, request, {
      headers: this.getHeaders()
    });
  }

  // Get bank details
  getBankDetails(): Observable<any> {
    return this.http.get(`${this.apiUrl}/bank-details`, {
      headers: this.getHeaders()
    });
  }

  // Update bank details
  updateBankDetails(request: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/bank-details/update`, request, {
      headers: this.getHeaders()
    });
  }

  // Get salary slip
  getSalarySlip(month: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/salary-slip/${month}`, {
      headers: this.getHeaders()
    });
  }

  // Download salary slip PDF
  downloadSalarySlipPDF(month: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/salary-slip/${month}/pdf`, {
       //headers: this.getHeaders()
       headers: this.getHeadersForFormData(),
      responseType: 'blob'
      
    });
  }

  // Raise concern
  raiseConcern(concernData: any, file?: File): Observable<any> {
    const formData = new FormData();
    formData.append('data', JSON.stringify(concernData));
    if (file) {
      formData.append('file', file);
    } 
    return this.http.post(`${this.apiUrl}/concerns`, formData, {
      headers: this.getHeadersForFormData()
    });
  }

  // Get my concerns
  getMyConcerns(): Observable<any> {
    return this.http.get(`${this.apiUrl}/concerns`, {
      headers: this.getHeaders()
    });
  }

  // Get concern by ticket
  getConcernByTicket(ticketNumber: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/concerns/${ticketNumber}`, {
      headers: this.getHeaders()
    });
  }

  // Acknowledge concern (close)
  acknowledgeConcern(ticketNumber: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/concerns/${ticketNumber}/acknowledge`, {}, {
      headers: this.getHeaders()
    });
  }

  // Reopen concern
  reopenConcern(ticketNumber: string, reason: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/concerns/${ticketNumber}/reopen`, reason, {
      headers: this.getHeaders()
    });
  }
}
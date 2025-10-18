// vendor.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth-service';

@Injectable({
  providedIn: 'root'
})
export class VendorService {
  private apiUrl = 'http://localhost:8080/api/v1/org/vendors';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Get headers with JWT token
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Create Vendor
  createVendor(vendor: any): Observable<any> {
    return this.http.post(`${this.apiUrl}`, vendor, {
      headers: this.getHeaders()
    });
  }

  // Get All Vendors
  getAllVendors(): Observable<any> {
    return this.http.get(`${this.apiUrl}`, {
      headers: this.getHeaders()
    });
  }

  // Get Vendor by ID
  getVendorById(vendorId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${vendorId}`, {
      headers: this.getHeaders()
    });
  }

  // Update Vendor
  updateVendor(vendorId: number, vendor: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${vendorId}`, vendor, {
      headers: this.getHeaders()
    });
  }

  // Delete Vendor
  deleteVendor(vendorId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${vendorId}`, {
      headers: this.getHeaders()
    });
  }

  // Create Payment Request
  createPaymentRequest(request: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/payment-requests`, request, {
      headers: this.getHeaders()
    });
  }

  // Get All Payment Requests
  getAllPaymentRequests(): Observable<any> {
    return this.http.get(`${this.apiUrl}/payment-requests`, {
      headers: this.getHeaders()
    });
  }

  // Get Payment Request by ID
  getPaymentRequestById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/payment-requests/${id}`, {
      headers: this.getHeaders()
    });
  }
}
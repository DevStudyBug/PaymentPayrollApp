import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs'; //handling asynchronous data and state changes
import { tap } from 'rxjs/operators'; //saving token
import { LoginRequest, LoginResponse, UserInfo } from '../models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/v1/auth'; // API URL
  private tokenKey = 'auth_token';
  private userInfoKey = 'user_info';

  // Observable to track authentication state
  private currentUserSubject = new BehaviorSubject<UserInfo | null>(this.getUserInfo());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        // Store token and user info
        if (response.token) {
          this.setToken(response.token);
          this.setUserInfo({
            userId: response.userId,
            email: response.email,
            roles: response.roles,
            orgStatus: response.orgStatus,
          });
        }
      })
    );
  }
  //organization
  registerOrganization(formData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/org-register`, formData);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setUserInfo(userInfo: UserInfo): void {
    localStorage.setItem(this.userInfoKey, JSON.stringify(userInfo));
    this.currentUserSubject.next(userInfo);
  }

  getUserInfo(): UserInfo | null {
    const userInfo = localStorage.getItem(this.userInfoKey);
    return userInfo ? JSON.parse(userInfo) : null;
  }

  getUserRoles(): string[] {
    const userInfo = this.getUserInfo();
    return userInfo?.roles || [];
  }

  hasRole(role: string): boolean {
    return this.getUserRoles().includes(role);
  }

  isVerified(): boolean {
    const userInfo = this.getUserInfo();
    return userInfo?.orgStatus === 'VERIFIED';
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userInfoKey);
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // Register employee (for org admin)
  registerEmployee(authentication: any, request: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register-employee`, request);
  }

  // Bulk register employees
  registerEmployeesFromExcel(authentication: any, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/bulk-register-employees`, formData);
  }
  
  //  Decode JWT payload safely
  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  //  Check if token is expired
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    const decoded = this.decodeToken(token);
    if (!decoded?.exp) return true;

    const expiryTime = decoded.exp * 1000; // convert seconds → ms
    return Date.now() > expiryTime;
  }
}

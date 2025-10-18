import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoginRequest, LoginResponse, UserInfo } from '../models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/v1/auth';
  private tokenKey = 'auth_token';
  private userInfoKey = 'user_info';

  private currentUserSubject = new BehaviorSubject<UserInfo | null>(this.getUserInfo());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        if (response.status === 'FIRST_TIME_LOGIN') {
          sessionStorage.setItem('firstTimeLogin', 'true');
          sessionStorage.setItem('tempUserId', response.userId.toString());
          sessionStorage.setItem('tempEmail', response.email);
          return;
        }

        if (response.token) {
          this.setToken(response.token);
          this.setUserInfo({
            userId: response.userId,
            email: response.email,
            roles: response.roles,
            orgStatus: response.orgStatus,
          });
          sessionStorage.removeItem('firstTimeLogin');
        }
      })
    );
  }
  //organization
  registerOrganization(formData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/org-register`, formData);
  }
  changePassword(email: string, oldPassword: string, newPassword: string): Observable<any> {
    const payload = { email, oldPassword, newPassword };
    return this.http.put(`${this.apiUrl}/change-password`, payload, { responseType: 'text' });
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
    sessionStorage.clear();
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isFirstTimeLogin(): boolean {
    return sessionStorage.getItem('firstTimeLogin') === 'true';
  }

  clearFirstTimeLogin(): void {
    sessionStorage.removeItem('firstTimeLogin');
  }

  // Decode & expiry check (optional)
  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    } catch {
      return null;
    }
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;
    const decoded = this.decodeToken(token);
    if (!decoded?.exp) return true;
    return Date.now() > decoded.exp * 1000;
  }
}

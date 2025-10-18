export interface LoginRequest {
  userName: string;
  password: string;
}

export interface LoginResponse {
  token?: string; // optional because it's not present for first-time login
  userId: number;
  email: string;
  roles: string[];
  orgStatus?: 'PENDING' | 'VERIFIED'; // optional because it may not be sent for employees
  message?: string;
  status?: 'SUCCESS' | 'FIRST_TIME_LOGIN' | 'ERROR'; 
}

export interface UserInfo {
  userId: number;
  email: string;
  roles: string[];
  orgStatus?: 'PENDING' | 'VERIFIED';
}

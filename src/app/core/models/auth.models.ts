export interface LoginRequest {
  userName: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: number;
  email: string;
  roles: string[]; // Set<String> in Java becomes string[] in TypeScript
  orgStatus: 'PENDING' | 'VERIFIED'; // Union type for specific values
  message?: string; // Optional since it might not always be present
}

// Optional: User info interface for storing in service
export interface UserInfo {
  userId: number;
  email: string;
  roles: string[];
  orgStatus: 'PENDING' | 'VERIFIED';
  
}
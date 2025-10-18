// REQUEST MODELS

export interface DocumentVerificationRequest {
  approved: boolean;
  rejectionReason: string;
}

export interface EmployeeBankDetailsRequest {
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  accountHolderName: string;
  accountType: string; // SAVINGS | CURRENT
  branchName?: string;
}

export interface EmployeeRegisterRequest {
  firstName: string;
  lastName: string;
  dob: Date;
  department: string;
  designation: string;
  email: string;
}

export interface LoginRequest {
  userName: string;
  password: string;
}

export interface OrgRegisterRequest {
  orgName: string;
  registrationNo: string;
  address: string;
  contactNo: string;
  email: string;
  username: string;
  password: string;
}

export interface OrgReviewRequest {
  approved: boolean;
  remarks?: string;
}

export interface BankDetailsRequest {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
}

export interface BankVerificationRequest {
  approved: boolean;
  rejectionReason: string;
}

export interface DocumentUploadRequest {
  fileName: string;
  fileType: string;
}

export interface SalaryTemplateRequest {
  designation: string;
  basicSalary: number;
  hra: number;
  da: number;
  pf: number;
  otherAllowances: number;
}

export interface PaymentRequestFilter {
  status?: string;
  type?: string;
  orgId?: number;
  startDate?: Date;
  endDate?: Date;
  page: number;
  size: number;
  sortBy: string;
  sortDir: string;
}

export interface RejectRequest {
  reason: string;
}

export interface OrgVerificationRequest {
  organizationId: number;
  approved: boolean;
  remarks?: string;
}

export interface RequestModel {
}

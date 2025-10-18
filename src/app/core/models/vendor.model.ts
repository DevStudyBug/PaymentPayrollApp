// vendor.models.ts - Place in: src/app/core/models/

// ========== REQUEST DTOs ==========

export interface VendorCreateRequest {
  name: string;
  contactPerson?: string;
  email: string;
  phoneNumber: string;
  address: string;
  bankName: string;
  bankAccountNumber: string;
  ifscCode: string;
}

export interface VendorUpdateRequest {
  name?: string;
  contactPerson?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  bankName?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
}

export interface VendorPaymentRequestCreate {
  vendorId?: number;  // Optional for VENDOR type, null for PAYROLL
  amount: number;
  description: string;
  requestType: 'VENDOR' | 'PAYROLL';
}

// ========== RESPONSE DTOs ==========

export interface VendorResponse {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phoneNumber: string;
  address: string;
}

export interface VendorDetailResponse {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phoneNumber: string;
  address: string;
  bankName: string;
  bankAccountNumber: string;
  ifscCode: string;
}

export interface VendorPaymentRequestResponse {
  paymentId: number;
  organizationName: string;
  vendorName: string | null;
  amount: number;
  description: string;
  requestType: 'VENDOR' | 'PAYROLL';
  status: string;
  remark: string | null;
  requestDate: string;
  approvalDate: string | null;
  paymentRefNo: string | null;
}
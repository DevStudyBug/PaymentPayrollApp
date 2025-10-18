// response-model.models.ts

// GENERIC
export interface PagedResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  lastPage: boolean;
}

// AUTH
export interface LoginResponse {
  token: string;
  userId: number;
  email: string;
  roles: string[];
  status: string;
  message: string;
}

// ORGANIZATION REGISTRATION
export interface OrgRegisterResponse {
  orgId: number;
  orgName: string;
  email: string;
  message: string;
  status: string;
}

// ORGANIZATION DOCUMENTS
export interface OrganizationDocument {
  docId: number;
  docName: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  status: string;
  uploadedAt: Date;
  verifiedAt?: Date;
}

export interface DocumentSummary {
  documentName: string;
  fileType: string;
  status: string;
  rejectionReason?: string;
}

// BANK ADMIN ORG RESPONSE - Updated to match backend API
export interface BankAdminOrgRegisterResponse {
  orgId: number;
  orgName: string;
  email: string;
  status: string;
  message: string;
  documents: OrganizationDocument[];
  bankVerificationStatus: string;
  bankRemarks?: string;
  // Bank account details from backend (flat structure)
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
}

export interface OrganizationOnboardingStatus {
  organizationId: number;
  organizationName: string;
  organizationStatus: string;
  documentStage: string;
  totalDocuments: number;
  approvedDocuments: number;
  rejectedDocuments: number;
  pendingDocuments: number;
  missingDocuments: string[];
  bankStage: string;
  bankRejectionReason?: string;
  bankVerifiedBy?: string;
  bankVerifiedAt?: Date;
  documents: DocumentSummary[];
  onboardingProgress: string;
  message: string;
}

// EMPLOYEE REGISTRATION & DETAILS
export interface EmployeeRegisterResponse {
  employeeId: number;
  username: string;
  temporaryPassword: string;
  status: string;
}

export interface EmployeeListResponse {
  employeeId: number;
  employeeName: string;
  email: string;
  status: string;
  allDocumentsApproved: boolean;
  bankApproved: boolean;
  documentCompletion: number;
}

export interface EmployeeDetailResponse {
  employeeId: number;
  name: string;
  status: string;
  documents: DocumentReview[];
  bankDetails: BankReview;
}

export interface EmployeeOnboardingStatus {
  employeeId: number;
  name: string;
  status: string;
  overallProgress: number;
  statusMessage: string;
  isComplete: boolean;
  approvedDocuments: number;
  rejectedDocuments: number;
  pendingDocuments: number;
  missingDocuments: string[];
  bankDetailsSubmitted: boolean;
  bankStatus: string;
  nextSteps: OnboardingStep[];
}

export interface OnboardingStep {
  priority: string;
  action: string;
  description: string;
  endpoint: string;
}

export interface EmployeeBulkRegisterResponse {
  successfulRegistrations: EmployeeRegisterResponse[];
  failedRegistrations: string[];
}

// EMPLOYEE DOCUMENTS & BANK
export interface DocumentReview {
  documentId: number;
  type: string;
  fileName: string;
  fileUrl: string;
  status: string;
  rejectionReason?: string;
  uploadedAt: Date;
  actionRequired?: string;
}

export interface DocumentUploadResponse {
  employeeId: number;
  documentId?: number;
  currentStatus: string;
  uploadedDocuments: DocumentUploadResult[];
  failedDocuments: string[];
  overallResult: string;
  message: string;
}

export interface DocumentUploadResult {
  documentType: string;
  fileName: string;
  fileUrl: string;
  success: boolean;
  message: string;
}

export interface BankReview {
  accountHolderName: string;
  accountNumberMasked: string;
  bankName: string;
  ifscCode: string;
  branchName?: string;
  status: string;
  rejectionReason?: string;
  submittedAt: Date;
}

export interface EmployeeBankDetailsResponse {
  employeeId: number;
  accountHolderName: string;
  bankName: string;
  verificationStatus: string;
  message: string;
}

export interface VerificationResponse {
  employeeId: number;
  message: string;
  currentStatus: string;
}

// SALARY MANAGEMENT
export interface DesignationResponse {
  designationId: number;
  name: string;
}

export interface SalaryTemplateResponse {
  salaryTemplateId: number;
  designationId: number;
  designationName: string;
  message: string;
}

export interface SalaryTemplateDetailResponse {
  salaryTemplateId: number;
  designation: string;
  basicSalary: number;
  hra: number;
  da: number;
  pf: number;
  otherAllowances: number;
  grossSalary: number;
  netSalary: number;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryTemplateSummaryResponse {
  templateId: number;
  designation: string;
  grossSalary: number;
  netSalary: number;
}

// PAYMENT REQUESTS
export interface PaymentRequestList {
  paymentId: number;
  organizationName: string;
  requestType: string;
  status: string;
  amount: number;
  description: string;
  requestDate: Date;
  approvalDate?: Date;
}

export interface PaymentRequestPageResponse {
  content: PaymentRequestList[];
  summary: PaymentRequestSummary;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  lastPage: boolean;
}

export interface PaymentRequestSummary {
  totalRequests: number;
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  totalPaid: number;
  totalAmount: number;
  totalPaidAmount: number;
  totalPendingAmount: number;
}

export interface PaymentRequestDetail {
  paymentId: number;
  orgId: number;
  orgName: string;
  requestType: string;
  status: string;
  amount: number;
  description: string;
  requestDate: Date;
  approvalDate?: Date;
  remark?: string;
  disbursements: SalaryDisbursement[];
}

export interface SalaryDisbursement {
  disbursementId: number;
  employeeId: number;
  employeeName: string;
  netSalary: number;
  status: string;
  remark?: string;
  bankStatus: string;
}

export interface PayrollActionResponse {
  paymentId: number;
  status: string;
  message: string;
  remark?: string;
  amount: number;
  approvalDate: Date;
}

export interface PayrollGenerateResponse {
  message: string;
  month: string;
  totalEmployees: number;
}

export interface PayrollSubmitResponse {
  message: string;
  paymentRequestId: number;
  status: string;
}
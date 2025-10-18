import { TestBed } from '@angular/core/testing';

import { BankAdminService } from './bank-admin-service';

describe('BankAdminService', () => {
  let service: BankAdminService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BankAdminService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

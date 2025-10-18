import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterOrganization } from './register-organization';

describe('RegisterOrganization', () => {
  let component: RegisterOrganization;
  let fixture: ComponentFixture<RegisterOrganization>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterOrganization]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterOrganization);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

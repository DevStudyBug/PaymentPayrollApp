import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

interface RoleContent {
  title: string;
  features: string[];
}

@Component({
  selector: 'app-home',
  templateUrl: './home-component.html',
  styleUrls: ['./home-component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class HomeComponent implements OnInit {
  mobileMenuOpen = false;
  selectedRole: 'organization' | 'employee' | 'bank' = 'organization';
  currentRoleContent: RoleContent;

  private roleContentData = {
    organization: {
      title: 'For Organizations',
      features: [
        'Manage employee records and salary structures',
        'Initiate monthly salary disbursals',
        'Handle client and vendor payments',
        'Generate comprehensive reports'
      ]
    },
    employee: {
      title: 'For Employees',
      features: [
        'View detailed salary payment history',
        'Download formatted salary slips as PDF',
        'Update bank account information',
        'Raise concerns with your organization'
      ]
    },
    bank: {
      title: 'For Bank Admins',
      features: [
        'Verify and manage organization records',
        'Approve or reject payment requests',
        'Process salary disbursements',
        'Send automated email notifications'
      ]
    }
  };

  constructor(private router: Router) {
    this.currentRoleContent = this.roleContentData.organization;
  }

  ngOnInit(): void {
    this.updateRoleContent();
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  selectRole(role: 'organization' | 'employee' | 'bank'): void {
    this.selectedRole = role;
    this.updateRoleContent();
  }

  private updateRoleContent(): void {
    this.currentRoleContent = this.roleContentData[this.selectedRole];
  }



  navigateToRegister(): void {
    this.router.navigate(['/organization/register']);
  }

  navigateToLogin(): void {
  console.log('navigateToLogin called'); // Add this
  this.router.navigate(['/auth/login']);
  console.log('Navigation triggered'); // Add this
}
  handleAction(): void {
    if (this.selectedRole === 'organization') {
      this.navigateToRegister();
    } else {
      this.navigateToLogin();
    }
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    this.mobileMenuOpen = false;
  }

  getActionButtonText(): string {
    return this.selectedRole === 'organization' ? 'Register Organization' : 'Login Now';
  }
}


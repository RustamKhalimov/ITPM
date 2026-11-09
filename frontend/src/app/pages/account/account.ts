
import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, timeout } from 'rxjs';

import { AuthService, AuthUser } from '../../services/auth';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './account.html',
  styleUrl: './account.css'
})
export class Account implements OnInit {
  user: AuthUser | null = null;

  email = '';
  firstName = '';
  lastName = '';

  oldPassword = '';
  newPassword = '';
  confirmPassword = '';

  isLoading = true;
  isSaving = false;

  successMessage = '';
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.getProfile()
      .pipe(
        timeout(10000),
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (user) => {
          this.user = user;
          this.email = user.email;
          this.firstName = user.first_name;
          this.lastName = user.last_name;
        },
        error: () => {
          this.errorMessage =
            'Unable to load profile. Please sign in again.';

          this.authService.removeToken();
          this.router.navigate(['/login']);
        }
      });
  }

  updateProfile(): void {
    this.clearMessages();

    if (!this.email.trim()) {
      this.errorMessage = 'Email is required.';
      return;
    }

    this.isSaving = true;

    this.authService.updateProfile({
      email: this.email.trim(),
      first_name: this.firstName.trim(),
      last_name: this.lastName.trim()
    })
    .pipe(
      finalize(() => {
        this.isSaving = false;
        this.cdr.detectChanges();
      })
    )
    .subscribe({
      next: (user) => {
        this.user = user;
        this.email = user.email;
        this.firstName = user.first_name;
        this.lastName = user.last_name;

        this.successMessage = 'Profile updated successfully.';
      },
      error: (error) => {
        this.errorMessage =
          error.error?.email?.join(' ') ||
          'Failed to update profile.';
      }
    });
  }

  changePassword(): void {
    this.clearMessages();

    if (!this.oldPassword || !this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'Please fill in all password fields.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'New passwords do not match.';
      return;
    }

    this.isSaving = true;

    this.authService.changePassword({
      old_password: this.oldPassword,
      new_password: this.newPassword
    })
    .pipe(
      finalize(() => {
        this.isSaving = false;
        this.cdr.detectChanges();
      })
    )
    .subscribe({
      next: () => {
        this.successMessage = 'Password changed successfully.';

        this.oldPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: (error) => {
        const details = error.error?.error;

        this.errorMessage = Array.isArray(details)
          ? details.join(' ')
          : details || 'Failed to change password.';
      }
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        this.authService.removeToken();
        this.router.navigate(['/login']);
      }
    });
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }
}


import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: AuthUser;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'http://127.0.0.1:8000/api/accounts/';
  private readonly tokenKey = 'foodsaver_token';

  constructor(private http: HttpClient) {}

  register(data: {
    username: string;
    email: string;
    password: string;
  }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}register/`,
      data
    ).pipe(
      tap(response => this.saveToken(response.token))
    );
  }

  login(data: {
    email: string;
    password: string;
  }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}login/`,
      data
    ).pipe(
      tap(response => this.saveToken(response.token))
    );
  }

  getProfile(): Observable<AuthUser> {
    return this.http.get<AuthUser>(
      `${this.apiUrl}profile/`,
      { headers: this.getAuthHeaders() }
    );
  }

  updateProfile(data: {
    email: string;
    first_name: string;
    last_name: string;
  }): Observable<AuthUser> {
    return this.http.patch<AuthUser>(
      `${this.apiUrl}profile/`,
      data,
      { headers: this.getAuthHeaders() }
    );
  }

  changePassword(data: {
    old_password: string;
    new_password: string;
  }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}change-password/`,
      data,
      { headers: this.getAuthHeaders() }
    );
  }

  logout(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}logout/`,
      {},
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(() => this.removeToken())
    );
  }

  saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  removeToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Token ${this.getToken()}`
    });
  }
}

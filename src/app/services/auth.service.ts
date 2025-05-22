import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiKeyStorageKey = 'kaiten_api_key';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private apiUrl = '/api';

  constructor(private http: HttpClient) {
    this.isAuthenticatedSubject.next(!!this.getApiKey());
  }

  login(apiKey: string): void {
    localStorage.setItem(this.apiKeyStorageKey, apiKey);
    this.isAuthenticatedSubject.next(true);
  }

  logout(): void {
    localStorage.removeItem(this.apiKeyStorageKey);
    this.isAuthenticatedSubject.next(false);
  }

  getApiKey(): string | null {
    return localStorage.getItem(this.apiKeyStorageKey);
  }

  isAuthenticated(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }
} 
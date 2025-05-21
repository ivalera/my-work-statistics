import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiKeyStorageKey = 'kaiten_api_key';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  constructor() {
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
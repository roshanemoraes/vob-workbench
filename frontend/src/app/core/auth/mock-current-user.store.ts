import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, switchMap, tap } from 'rxjs';
import { AuthResponse, AuthUserResponse, CurrentUser, Permission, UserRole } from '../models/auth.models';

const API_BASE_URL = 'http://localhost:8080/api';
const CURRENT_USER_KEY = 'vob.currentUser';

@Injectable({ providedIn: 'root' })
export class MockCurrentUserStore {
  private readonly http = inject(HttpClient);
  private accessToken: string | null = null;

  readonly currentUser = signal<CurrentUser | null>(this.readStoredUser());
  readonly isAuthenticated = signal(Boolean(this.currentUser()));

  login(username: string, password: string): Observable<boolean> {
    return this.http.post<AuthResponse>(`${API_BASE_URL}/auth/login`, { username, password }).pipe(
      tap((response) => this.storeSession(response)),
      map(() => true),
      catchError(() => of(false))
    );
  }

  logout(): void {
    this.http.post<void>(`${API_BASE_URL}/auth/logout`, {}).subscribe({
      error: () => undefined
    });
    this.clearSession();
  }

  loadCurrentUser(): Observable<boolean> {
    const hasAccessToken = Boolean(this.getAccessToken());
    const ensureAccessToken = hasAccessToken ? of(true) : this.refreshAccessToken();

    return ensureAccessToken.pipe(
      switchMap((authenticated) => {
        if (!authenticated) {
          this.clearSession();
          return of(false);
        }

        return this.http.get<AuthUserResponse>(`${API_BASE_URL}/auth/me`).pipe(
          tap((user) => this.setCurrentUser(this.toCurrentUser(user))),
          map(() => true),
          catchError(() => {
            this.clearSession();
            return of(false);
          })
        );
      })
    );
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  clearSession(): void {
    this.accessToken = null;
    localStorage.removeItem(CURRENT_USER_KEY);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  setRole(role: UserRole): void {
    const user = this.currentUser();
    if (user) {
      this.currentUser.set({ ...user, role });
    }
  }

  hasPermission(permission: string): boolean {
    const user = this.currentUser();
    if (!user) {
      return false;
    }
    return user.permissions.includes(permission as Permission);
  }

  private storeSession(response: AuthResponse): void {
    this.accessToken = response.accessToken;
    this.setCurrentUser(this.toCurrentUser(response.user));
    this.isAuthenticated.set(true);
  }

  private refreshAccessToken(): Observable<boolean> {
    return this.http.post<AuthResponse>(`${API_BASE_URL}/auth/refresh`, {}).pipe(
      tap((response) => this.storeSession(response)),
      map(() => true),
      catchError(() => of(false))
    );
  }

  private setCurrentUser(user: CurrentUser): void {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  private toCurrentUser(user: AuthUserResponse): CurrentUser {
    return {
      ...user,
      displayName: this.toDisplayName(user.username)
    };
  }

  private toDisplayName(username: string): string {
    return username
      .split(/[._-]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') || username;
  }

  private readStoredUser(): CurrentUser | null {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as CurrentUser;
    } catch {
      localStorage.removeItem(CURRENT_USER_KEY);
      return null;
    }
  }
}

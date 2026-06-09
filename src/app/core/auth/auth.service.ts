import { Injectable, computed, signal } from '@angular/core';
import { AuthError, Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase.client';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly sessionState = signal<Session | null>(null);
  private readonly loadingState = signal(false);

  readonly session = this.sessionState.asReadonly();
  readonly currentUser = computed<User | null>(() => this.sessionState()?.user ?? null);
  readonly authLoading = this.loadingState.asReadonly();
  readonly isAuthenticated = computed(() => Boolean(this.sessionState()));

  constructor() {
    void this.refreshSession();

    supabase.auth.onAuthStateChange((_event, session) => {
      this.sessionState.set(session);
    });
  }

  async register(email: string, password: string): Promise<void> {
    this.loadingState.set(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      this.throwIfAuthError(error);
      this.sessionState.set(data.session);
    } finally {
      this.loadingState.set(false);
    }
  }

  async signIn(email: string, password: string): Promise<void> {
    this.loadingState.set(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      this.throwIfAuthError(error);
      this.sessionState.set(data.session);
    } finally {
      this.loadingState.set(false);
    }
  }

  async signOut(): Promise<void> {
    this.loadingState.set(true);

    try {
      const { error } = await supabase.auth.signOut();

      this.throwIfAuthError(error);
      this.sessionState.set(null);
    } finally {
      this.loadingState.set(false);
    }
  }

  async getUser(): Promise<User | null> {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      this.sessionState.set(null);
      return null;
    }

    return data.user;
  }

  async getSession(): Promise<Session | null> {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      this.sessionState.set(null);
      return null;
    }

    this.sessionState.set(data.session);
    return data.session;
  }

  async refreshSession(): Promise<void> {
    this.loadingState.set(true);

    try {
      await this.getSession();
    } finally {
      this.loadingState.set(false);
    }
  }

  private throwIfAuthError(error: AuthError | null): void {
    if (error) {
      throw new Error(error.message);
    }
  }
}

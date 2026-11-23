import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../config/supabase';
import { DOMAIN_ERROR, isAllowedEmail } from '../config/domain';

WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext(null);

const VERIFY_MSG = 'Verify your email first. Check your inbox for the verification link.';

function getAuthParams(input) {
  const url = new URL(input, 'https://phony.example');
  const params = Object.fromEntries(url.searchParams);
  if (url.hash) {
    new URLSearchParams(url.hash.slice(1)).forEach((value, key) => {
      params[key] = value;
    });
  }
  return params;
}

export function friendlyError(err) {
  const msg = err?.message || '';
  switch (err?.code) {
    case 'invalid_credentials':
      return 'Incorrect email or password.';
    case 'email_not_confirmed':
      return VERIFY_MSG;
    case 'user_already_exists':
      return 'An account with this email already exists. Log in instead.';
    case 'weak_password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'Too many attempts. Try again in a few minutes.';
  }
  if (msg.includes('Database error')) return DOMAIN_ERROR;
  if (/network request failed|failed to fetch/i.test(msg)) {
    return 'Network error. Check your connection and try again.';
  }
  return msg || 'Something went wrong. Please try again.';
}

const redirectUrl = () =>
  Platform.OS === 'web' ? window.location.origin : makeRedirectUri();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [authError, setAuthError] = useState('');

  const handleSession = useCallback(async (session) => {
    const u = session?.user;
    if (!u) {
      setUser(null);
      setRole(null);
      return;
    }
    if (!isAllowedEmail(u.email)) {
      setAuthError(DOMAIN_ERROR);
      setUser(null);
      await supabase.auth.signOut();
      return;
    }
    if (!u.email_confirmed_at) {
      setUser(null);
      await supabase.auth.signOut();
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', u.id)
      .maybeSingle();
    setRole(data?.role ?? 'user');
    setUser(u);
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const raw = (window.location.hash || window.location.search).replace(/^[#?]/, '');
      const desc = new URLSearchParams(raw).get('error_description');
      if (desc) {
        setAuthError(friendlyError({ message: desc.replace(/\+/g, ' ') }));
        window.history.replaceState(null, '', window.location.pathname);
      }
    }

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(async () => {
        await handleSession(session);
        setInitializing(false);
      }, 0);
    });
    return () => data.subscription.unsubscribe();
  }, [handleSession]);

  const loginWithEmail = useCallback(async (email, password) => {
    setAuthError('');
    if (!isAllowedEmail(email)) throw new Error(DOMAIN_ERROR);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
  }, []);

  const registerWithEmail = useCallback(async (name, email, password) => {
    setAuthError('');
    if (!isAllowedEmail(email)) throw new Error(DOMAIN_ERROR);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: name.trim() },
        emailRedirectTo: redirectUrl(),
      },
    });
    if (error) throw error;
    if (data.user && data.user.identities?.length === 0) {
      const e = new Error('exists');
      e.code = 'user_already_exists';
      throw e;
    }
    return { needsVerification: !data.session };
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setAuthError('');
    const queryParams = { prompt: 'select_account' };

    if (Platform.OS === 'web') {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl(), queryParams },
      });
      if (error) throw error;
      return;
    }

    const redirectTo = redirectUrl();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, queryParams, skipBrowserRedirect: true },
    });
    if (error) throw error;

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success') return;

    const params = getAuthParams(result.url);
    if (params.error_description) {
      throw new Error(friendlyError({ message: params.error_description.replace(/\+/g, ' ') }));
    }
    if (!params.access_token || !params.refresh_token) {
      throw new Error('Google sign-in failed. Please try again.');
    }
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (sessionError) throw sessionError;
  }, []);

  const logout = useCallback(() => supabase.auth.signOut(), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        initializing,
        authError,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
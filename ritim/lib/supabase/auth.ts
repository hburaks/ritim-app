import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from './client';

WebBrowser.maybeCompleteAuthSession();

const redirectTo = makeRedirectUri();

export async function signInWithGoogle() {
  console.log('[Auth] redirectTo:', redirectTo);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    console.log('[Auth] OAuth URL error:', error);
    return { success: false, error };
  }

  console.log('[Auth] Opening browser with URL:', data.url.substring(0, 100) + '...');
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  console.log('[Auth] Browser result type:', result.type);

  if (result.type !== 'success' || !result.url) {
    console.log('[Auth] Browser did not return success');
    return { success: false, error: `browser_${result.type}` };
  }

  const { params, errorCode } = QueryParams.getQueryParams(result.url);

  if (errorCode) {
    return { success: false, error: errorCode };
  }

  const { access_token, refresh_token } = params;

  if (!access_token || !refresh_token) {
    return { success: false, error: 'missing_tokens' };
  }

  const { data: sessionData, error: sessionError } =
    await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

  return {
    success: !sessionError,
    session: sessionData?.session,
    error: sessionError,
  };
}

export async function signOut() {
  return supabase.auth.signOut();
}

export function getSession() {
  return supabase.auth.getSession();
}

export function onAuthStateChange(
  callback: (event: string, session: unknown) => void,
) {
  return supabase.auth.onAuthStateChange(callback);
}

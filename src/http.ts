import { SmisAuthorization, SmisSession, SmisSsoConfig } from './types';

export const buildAuthUrl = (config: SmisSsoConfig): URL => {
  const probePath = config.probePath ?? '/sso/probe';
  return new URL(probePath, config.authBaseUrl);
};

export const fetchAuthorizations = async (
  config: SmisSsoConfig,
  session: SmisSession
): Promise<SmisAuthorization> => {
  const authUrl = new URL('/api/sso/authorizations', config.authBaseUrl);
  const fetchImpl = config.fetch ?? fetch;
  const response = await fetchImpl(authUrl.toString(), {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'X-SMIS-APP-KEY': config.appKey
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to load authorizations (${response.status})`);
  }

  return (await response.json()) as SmisAuthorization;
};

export const fetchContextAuthorizations = async (
  config: SmisSsoConfig,
  session: SmisSession
): Promise<unknown> => {
  const url = new URL('/api/sso/authorizations/context', config.authBaseUrl);
  const fetchImpl = config.fetch ?? fetch;
  const response = await fetchImpl(url.toString(), {
    headers: {
      Authorization: `Bearer ${session.accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to load contextual authorizations (${response.status})`);
  }

  return response.json();
};

export const logoutSession = async (config: SmisSsoConfig, session?: SmisSession): Promise<void> => {
  if (!session?.refreshToken) return;
  const url = new URL('/auth/logout', config.authBaseUrl);
  const fetchImpl = config.fetch ?? fetch;
  try {
    await fetchImpl(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: session.refreshToken })
    });
  } catch (error) {
    // Swallow network errors; signOut should still proceed locally.
  }
};

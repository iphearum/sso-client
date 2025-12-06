import { SmisSsoClient } from '@smis/sso-client';

// Basic bootstrap for browser apps
export const client = new SmisSsoClient({
  appKey: 'pp-demo-123456',
  authBaseUrl: 'http://localhost:3000',
  probePath: '/sso/probe'
});

export async function signIn(force = false) {
  return client.signIn({ force });
}

export async function signOut() {
  await client.signOut();
}

export async function switchUser() {
  return client.switchUser();
}

export async function getAuthorizations() {
  const session = await client.ensureSession();
  return client.loadAuthorizations(session);
}

export async function getContextAuthorizations() {
  const session = await client.ensureSession();
  return client.loadContextAuthorizations(session);
}

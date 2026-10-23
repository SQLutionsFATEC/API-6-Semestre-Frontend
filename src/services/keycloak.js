import Keycloak from 'keycloak-js';

export const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'sqlutions',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'frontend',
});

let loginRedirectInProgress = false;

function redirectToLogin() {
  if (loginRedirectInProgress) return;

  loginRedirectInProgress = true;
  keycloak.login().catch((error) => {
    loginRedirectInProgress = false;
    console.error('Não foi possível redirecionar para o login:', error);
  });
}

export async function initializeKeycloak() {
  const authenticated = await keycloak.init({
    onLoad: 'login-required',
    pkceMethod: 'S256',
    checkLoginIframe: false,
  });

  if (!authenticated) {
    redirectToLogin();
    return false;
  }

  return true;
}

export async function getAccessToken() {
  try {
    await keycloak.updateToken(30);
  } catch (error) {
    keycloak.clearToken();
    redirectToLogin();
    throw error;
  }

  if (!keycloak.token) {
    const error = new Error('Não há um token de acesso válido.');
    redirectToLogin();
    throw error;
  }

  return keycloak.token;
}

export function restartLoginAfterUnauthorized() {
  keycloak.clearToken();
  redirectToLogin();
}

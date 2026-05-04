const ACCESS_TOKEN_KEY = 'sportlink_access_token';

export function setAccessTokenInLocalStorage(token: string) {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function getAccessTokenFromLocalStorage(): string | null {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function removeAccessTokenFromLocalStorage() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}
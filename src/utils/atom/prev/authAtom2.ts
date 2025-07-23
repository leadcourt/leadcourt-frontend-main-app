
import { atom } from 'recoil';
import Cookies from 'js-cookie';


export interface AuthState {
  access: string;
  refresh: string;
  isAuthenticated: boolean;
}

const AUTH_TOKEN_KEY = 'auth_token';
const TOKEN_EXPIRY_DAYS = 7;

export const saveTokenToCookie = (access: string, refresh: string): void => {
  Cookies.set(AUTH_TOKEN_KEY, access, refresh, { expires: TOKEN_EXPIRY_DAYS, secure: true, sameSite: 'strict' });
};

export const getTokenFromCookie = (): string => {
  return Cookies.get(AUTH_TOKEN_KEY) || null;
};

export const removeTokenFromCookie = (): void => {
  Cookies.remove(AUTH_TOKEN_KEY);
};

const initialToken = getTokenFromCookie();



export const authTokenState = atom<string>({
  key: 'authTokenState',
  default: initialToken,
  effects: [
    ({ onSet }) => {
      onSet((newAccess, newRefresh) => {
        if (newAccess || newRefresh) {
          // saveTokenToCookie(newAccess, newRefresh);
        } else {
          removeTokenFromCookie();
        }
      });
    },
  ],
});
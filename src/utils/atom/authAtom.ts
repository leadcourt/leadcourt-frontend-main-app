import { recoilPersist } from 'recoil-persist';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { atom, selector } from 'recoil';
import axios from 'axios';
import { collabProjectState } from './collabAuthAtom';

/**
 * Interfaces
 */
export interface User {
  id: string;
  email: string;
  name: string;
  verify: boolean;
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

export interface Credit {
  id: string;
  credits: number;
  subscriptionType: 'FREE' | 'STARTER' | 'PRO' | 'BUSINESS';
  expiresAt?: string;
  starterRemainingDays?: number;
  proRemainingDays?: number;
  isLTD?: boolean;
  hasSeenTour?: boolean; // Useful for the tour trigger logic
}

/**
 * Persistence Configuration
 * Uses cookies to store the auth and tour state
 */
const cookieStorage = (keyPrefix = '') => ({
  setItem: (key: string, value: string) => {
    Cookies.set(`${keyPrefix}${key}`, value, {
      expires: key.includes('refresh') ? 30 : 1,
      secure: true,
      sameSite: 'strict',
    });
  },
  getItem: (key: string) => {
    return Cookies.get(`${keyPrefix}${key}`) || null;
  },
  removeItem: (key: string) => {
    Cookies.remove(`${keyPrefix}${key}`);
  },
});

export const { persistAtom } = recoilPersist({
  key: 'recoil-auth',
  storage: cookieStorage('auth_'),
});

/**
 * Tour State Atoms
 * Kept in global state to prevent the "freezing" issue 
 * during layout re-renders.
 */
export const tourStepIndexState = atom<number>({
  key: 'tourStepIndexState',
  default: 0,
  effects_UNSTABLE: [persistAtom],
});

export const tourRunningState = atom<boolean>({
  key: 'tourRunningState',
  default: false,
  effects_UNSTABLE: [persistAtom],
});

/**
 * Auth Atoms
 */
export const refreshTokenState = atom<string | null>({
  key: 'refreshTokenState',
  default: null,
  effects_UNSTABLE: [persistAtom],
});

export const userState = atom<User | null>({
  key: 'userState',
  default: null,
  effects_UNSTABLE: [persistAtom],
});

export const creditState = atom<Credit | null>({
  key: 'creditState',
  default: null,
  effects_UNSTABLE: [persistAtom],
});

export const accessTokenState = atom<string | null>({
  key: 'accessTokenState',
  default: null,
  effects_UNSTABLE: [persistAtom],
});

/**
 * Token Selector
 * Automatically attaches the Bearer token to Axios requests
 */
export const attachToken = selector({
  key: "useToken",
  get: ({ get }) => {
    const acc_token = get(accessTokenState);
    const collab_token = get(collabProjectState);

    if (acc_token) {
      return axios.interceptors.request.use(function (config) {
        const token = acc_token;
        const decodedToken = jwtDecode<any>(acc_token);
        const dateNow = new Date();

        // Basic expiry check before sending request
        if (decodedToken?.exp && decodedToken?.exp * 1000 < dateNow.getTime()) {
          return Promise.reject('Token expired');
        }

        config.headers.Authorization = `Bearer ${token}`;
        
        if (collab_token) {
          config.headers['X-Collab-ID'] = collab_token?._id;
        }

        return config;
      });
    }
    return null;
  },
});
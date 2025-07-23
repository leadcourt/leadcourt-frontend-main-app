// src/state/auth.ts
import { atom, selector } from 'recoil';
import Cookies from 'js-cookie';

// Constants
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const ACCESS_TOKEN_EXPIRY_DAYS = 1; // Typically shorter lifetime
const REFRESH_TOKEN_EXPIRY_DAYS = 30; // Typically longer lifetime

// Types
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// Helper functions for token management
export const saveTokensToCookie = (tokens: TokenPair): void => {
  Cookies.set(ACCESS_TOKEN_KEY, tokens.accessToken, { 
    expires: ACCESS_TOKEN_EXPIRY_DAYS, 
    secure: true, 
    sameSite: 'strict' 
  });
  
  Cookies.set(REFRESH_TOKEN_KEY, tokens.refreshToken, { 
    expires: REFRESH_TOKEN_EXPIRY_DAYS, 
    secure: true, 
    sameSite: 'strict',
    // Optional: Use httpOnly if your setup supports it
    // httpOnly: true
  });
};

export const getTokensFromCookie = (): TokenPair => {
  return {
    accessToken: Cookies.get(ACCESS_TOKEN_KEY) || null,
    refreshToken: Cookies.get(REFRESH_TOKEN_KEY) || null
  };
};

export const removeTokensFromCookie = (): void => {
  Cookies.remove(ACCESS_TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
};

// Initialize auth state from cookies
const initialTokens = getTokensFromCookie();



// Recoil atoms and selectors
export const accessTokenState = atom<string | null>({
  key: 'accessTokenState',
  default: initialTokens.accessToken,
  effects_UNSTABLE: [
    ({ onSet, getPromise }) => {
      onSet(async (newAccessToken, oldAccessToken) => {
        const refreshToken = await getPromise(refreshTokenState);
        
        if (newAccessToken && refreshToken) {
          saveTokensToCookie({
            accessToken: newAccessToken,
            refreshToken
          });
        } else if (!newAccessToken && oldAccessToken) {
          removeTokensFromCookie();
        }
      });
    },
  ]
});


// access & refresh
export const authState = atom<any>({
  key: 'auth',
  default: {},
  effects_UNSTABLE: [
    // assess token
    ({ onSet, getPromise }) => {
      onSet(async (newAccessToken, oldAccessToken) => {
        const refreshToken = await getPromise(refreshTokenState);
        
        if (newAccessToken && refreshToken) {
          saveTokensToCookie({
            accessToken: newAccessToken,
            refreshToken
          });
        } else if (!newAccessToken && oldAccessToken) {
          removeTokensFromCookie();
        }
      });
    },
    // refresh token
    ({ onSet, getPromise }) => {
      // When refresh token changes, update the cookies
      onSet(async (newRefreshToken, oldRefreshToken) => {
        const accessToken = await getPromise(accessTokenState);
        
        if (newRefreshToken && accessToken) {
          saveTokensToCookie({
            accessToken,
            refreshToken: newRefreshToken
          });
        } else if (!newRefreshToken && oldRefreshToken) {
          removeTokensFromCookie();
        }
      });
    },
  ]
});

export const refreshTokenState = atom<any>({
  key: 'refreshTokenState',
  default: initialTokens.refreshToken,
  effects: [
    ({ onSet, getPromise }) => {
      // When refresh token changes, update the cookies
      onSet(async (newRefreshToken, oldRefreshToken) => {
        const accessToken = await getPromise(accessTokenState);
        
        if (newRefreshToken && accessToken) {
          saveTokensToCookie({
            accessToken,
            refreshToken: newRefreshToken
          });
        } else if (!newRefreshToken && oldRefreshToken) {
          removeTokensFromCookie();
        }
      });
    },
  ],
});

// When access token changes, also update cookies
// accessTokenState.

export const userState = atom<User | null>({
  key: 'userState',
  default: null,
});

export const authStateSelector = selector<AuthState>({
  key: 'authStateSelector',
  get: ({ get }) => {
    const accessToken = get(accessTokenState);
    const refreshToken = get(refreshTokenState);
    const user = get(userState);
    
    return {
      accessToken,
      refreshToken,
      user,
      isAuthenticated: !!accessToken && !!user,
    };
  },
});

// Auth utilities
export const parseJwt = (token: string): any => {
  try {
    return JSON.parse(atob(token?.split('.')[1]));
  } catch (e) {
    return null;
  }
};

export const getUserFromToken = (token: string): User | null => {
  const decodedToken = parseJwt(token);
  if (!decodedToken) return null;
  
  return {
    id: decodedToken.sub,
    email: decodedToken.email,
    name: decodedToken.name,
  };
};

export const getTokenExpiration = (token: string): number | null => {
  const decoded = parseJwt(token);
  return decoded?.exp ? decoded.exp * 1000 : null; // Convert to milliseconds
};

export const isTokenExpired = (token: string): boolean => {
  const expiration = getTokenExpiration(token);
  return expiration ? Date.now() >= expiration : true;
};
import { recoilPersist } from 'recoil-persist';
import Cookies from 'js-cookie';
import { atom } from 'recoil';

  
export interface CollabCredit {
  id: string;
  credits: number;
  subscriptionType: 'FREE' | 'STARTER' | 'PRO' | 'BUSINESS';
}

export interface CollabProject {
  _id: string;
  ownerName: string;
  collaborator: string;
  collaboratorName: string;
  collaboratorEmail: string;
  permission: string;
}


const cookieStorage = (keyPrefix = '') => ({
  setItem: (key: string, value: string) => {
    Cookies.set(`${keyPrefix}${key}`, value, {
      expires: key.includes('refresh') ? 30 : 1,
      secure: true,
      // sameSite: null,
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
  storage: cookieStorage('collab_'), // Optional prefix
}); 



// Credit
export const collabCreditState = atom<CollabCredit | null>({
key: 'collabCreditState',
default: null,
effects_UNSTABLE: [persistAtom],
});


// Credit
export const collabProjectState = atom<CollabProject | null>({
key: 'collabProjectState',
default: null,
effects_UNSTABLE: [persistAtom],
});


// atoms/userTokenAtom.ts
import { atom } from 'recoil';

export const userTokenState = atom<string | null>({
  key: 'userTokenState', // Unique ID (with respect to other atoms/selectors)
  default: null, // Initial value
});

import { atom } from "recoil";
import { recoilPersist } from "recoil-persist";


export type AuthType = {
  access: string;
  refresh: string;
};

const { persistAtom } = recoilPersist({
  key: "recoil-persist",
  storage: sessionStorage,
});

 

export const authState = atom<any>({
  key: "auth",
  default: {},
  effects_UNSTABLE: [persistAtom],
});

 
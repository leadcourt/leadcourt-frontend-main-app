import { atom } from "recoil";

export const sidebarOpenState = atom<boolean>({
  key: "sidebarOpenState",
  default: false,
});
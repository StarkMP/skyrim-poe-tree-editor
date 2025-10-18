import { create } from 'zustand';

export type Store = {};

export const useStore = create<Store>(() => ({}));

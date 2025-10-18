/* eslint-disable @typescript-eslint/consistent-type-definitions */
import { SKSE_API_Call } from './types';
export {};

declare global {
  interface Window {
    SKSE_API: {
      call: SKSE_API_Call;
    };
  }
}

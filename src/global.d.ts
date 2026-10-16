/* eslint-disable unicorn/require-module-specifiers */
/* eslint-disable @typescript-eslint/consistent-type-definitions */
import { type PixiReactElementProps } from '@pixi/react';
import { type Viewport } from 'pixi-viewport';

declare module '@pixi/react' {
  interface PixiElements {
    // Регистрируем версию с префиксом: <pixiViewport />
    pixiViewport: PixiReactElementProps<typeof Viewport>;

    // Если в будущем захотите использовать без префикса: <viewport />
    viewport: PixiReactElementProps<typeof Viewport>;
  }
}

export {};

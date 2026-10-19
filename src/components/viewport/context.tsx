import { Viewport } from 'pixi-viewport';
import { createContext, ReactNode, useContext } from 'react';

const ViewportContext = createContext<Viewport | null>(null);

export const ViewportProvider = ({
  viewport,
  children,
}: {
  children: ReactNode;
  viewport: Viewport | null;
}) => <ViewportContext.Provider value={viewport}>{children}</ViewportContext.Provider>;

export const useViewport = () => useContext(ViewportContext);

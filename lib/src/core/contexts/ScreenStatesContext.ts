import { createContext, useContext } from 'react';

/** What one region of a screen reports about its data */
export interface ScreenRegionState {
  /** The region shows data (loaded now or saved earlier) */
  hasData: boolean;
  /** When that data was fetched (ms) */
  updatedAt?: number;
}

export interface ScreenStatesContextProps {
  /** Reports a region's state; null when the region goes away */
  report: (id: string, state: ScreenRegionState | null) => void;
  /**
   * The offline banner shows on this screen, so a region without saved data
   * must not say "offline" again
   */
  isBannerVisible: boolean;
}

/**
 * Lets the regions of one screen tell the screen's offline banner when their
 * data was saved, and whether they show any. Provided by OfflineScreenLayout.
 */
export const ScreenStatesContext = createContext<
  ScreenStatesContextProps | undefined
>(undefined);

export const useScreenStatesContext = () => useContext(ScreenStatesContext);

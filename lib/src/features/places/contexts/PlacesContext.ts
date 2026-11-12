import { createContext } from 'react';

interface PlacesContextValue {
  floorId?: string;
  setFloorId: (newFloorId?: string) => void;
  /**
   * The Places screen shows the PoliTO logo in its header. Off when the app
   * gives the tab root a header of its own (the navy one), where the logo
   * would repeat the title and half of it would vanish on navy
   */
  showLogo?: boolean;
}

export const PlacesContext = createContext<PlacesContextValue>(
  {} as PlacesContextValue,
);

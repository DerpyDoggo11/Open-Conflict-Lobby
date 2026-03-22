
export type PageName = 'home' | 'servers' | 'loadouts' | 'settings';

export type NavigateFn = (page: PageName) => void;

export interface Server {
    id: number;
    name: string;
    currentPlayers: number;
    maxPlayers: number;
}

export interface MapOption {
  id: string;
  label: string;
}
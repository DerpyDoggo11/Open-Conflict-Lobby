import { createHomePage } from './pages/homePage.js';
import { createLoadingPage } from './pages/loadingPage.js';
import { createLoadoutsPage } from './pages/loadoutsPage.js';
import { createServersPage } from './pages/serversPage.js';
import { createSettingsPage } from './pages/settingsPage.js';
import { musicPlayer } from './misc/musicPlayer.js';
import type { PageName, NavigateFn } from './types.js';

type PageFactory = (navigate: NavigateFn) => HTMLElement;

const PAGE_FACTORIES: Record<PageName, PageFactory> = {
  'home':     createHomePage,
  'loading':  createLoadingPage,
  'servers':  createServersPage,
  'loadouts': createLoadoutsPage,
  'settings': createSettingsPage,
};

const LOBBY_MUSIC_PATH   = '/assets/music/lobby.mp3';
const LOBBY_MUSIC_VOLUME = 1.3;

export class App {
  private readonly root: HTMLElement;
  private readonly pageCache = new Map<PageName, HTMLElement>();
  private activePage: PageName | null = null;
  private musicStarted = false;

  constructor(rootSelector: string) {
    const element = document.querySelector<HTMLElement>(rootSelector);
    if (!element) {
      throw new Error(`App: root element "${rootSelector}" not found`);
    }
    this.root = element;

    const startMusic = () => {
      if (!this.musicStarted) {
        this.musicStarted = true;
        musicPlayer.play(LOBBY_MUSIC_PATH, { volume: LOBBY_MUSIC_VOLUME });
      }
      window.removeEventListener('pointerdown', startMusic);
      window.removeEventListener('keydown',     startMusic);
      window.removeEventListener('click',       startMusic);
    };

    window.addEventListener('pointerdown', startMusic);
    window.addEventListener('keydown',     startMusic);
    window.addEventListener('click',       startMusic);
  }

  navigate: NavigateFn = (page: PageName): void => {
    if (page === this.activePage) return;

    if (this.activePage) {
      const current = this.pageCache.get(this.activePage);
      current?.classList.remove('page--active');
    }

    if (!this.pageCache.has(page)) {
      const factory = PAGE_FACTORIES[page];
      const element = factory(this.navigate);
      this.root.appendChild(element);
      this.pageCache.set(page, element);
      void element.offsetWidth;
    }

    const next = this.pageCache.get(page)!;
    next.classList.add('page--active');
    this.activePage = page;
  };

  start(initialPage: PageName): void {
    this.navigate(initialPage);
  }
}
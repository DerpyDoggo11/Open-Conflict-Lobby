import { createHomePage } from './pages/homePage.js';
import { createLoadoutsPage } from './pages/loadoutsPage.js';
import { createServersPage } from './pages/serversPage.js';
import { createSettingsPage } from './pages/settingsPage.js';
import type { PageName, NavigateFn } from './types.js'

type PageFactory = (navigate: NavigateFn) => HTMLElement;

const PAGE_FACTORIES: Record<PageName, PageFactory> = {
    'home': createHomePage,
    'servers': createServersPage,
    'loadouts': createLoadoutsPage,
    'settings': createSettingsPage,
}

export class App {
    private readonly root: HTMLElement;
    private readonly pageCache = new Map<PageName, HTMLElement>();
    private activePage: PageName | null = null;

    constructor(rootSelector: string) {
        const element = document.querySelector<HTMLElement>(rootSelector);
        if (!element) {
            throw new Error('App: root element "${rootSelector}" not found');
        }
        this.root = element;
    }

    navigate: NavigateFn = (page: PageName): void => {
        if (page === this.activePage) {
            return
        }

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
    }

    start(initalPage: PageName): void {
        this.navigate(initalPage)
    }
}
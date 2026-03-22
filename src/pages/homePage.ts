import type { NavigateFn } from "../types";

interface MenuItem {
    label: string;
    page: Parameters<NavigateFn>[0];
}

const MENU_ITEMS: MenuItem[] = [
    {label: 'Play', page: 'servers'},
    {label: 'Loadouts', page: 'loadouts'},
    {label: 'Settings', page: 'settings'},
];

export function createHomePage(navigate: NavigateFn): HTMLElement {
    const page = document.createElement('div');
    page.className = 'page page--home';
    page.id = 'page-home';
    return page;
}
import type { NavigateFn } from '../types.js';
import { backButton } from '../components/backButton.js';

export function createLoadoutsPage(navigate: NavigateFn): HTMLElement {
    const page = document.createElement('div');
    page.className = 'page page--loadout';
    page.id = 'page-loadout';

    const back = new backButton({ onClick: () => navigate('home')});
    page.appendChild(back.element);

    return page;
}
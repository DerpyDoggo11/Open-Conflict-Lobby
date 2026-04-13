import type { NavigateFn } from '../types.js';
import { backButton } from '../components/backButton.js';
import { attachUISounds } from '../misc/attachSounds.js';

export function createSettingsPage(navigate: NavigateFn): HTMLElement {
    const page = document.createElement('div');
    page.className = 'page page--settings';
    page.id = 'page-settings';

    const back = new backButton({ onClick: () => navigate('home')});
    page.appendChild(back.element);

    attachUISounds(page);
    
    return page;
}
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

    const bg = document.createElement('div');
    bg.className = 'home__bg-gradient';
    page.appendChild(bg);
    
    const logo = document.createElement('div');
    logo.className = 'home__logo';

    const logoImg = new Image();
    logoImg.className = 'home__logo-img';
    logoImg.alt = 'Open Conflict RTS';
    logoImg.src = '/assets/images/openConflictLogo.png';
    logo.appendChild(logoImg);
    page.appendChild(logo)

    const nav = document.createElement('nav');
    nav.className = 'home__nav'

    for (const item of MENU_ITEMS) {
        const button = document.createElement('button');
        button.className = 'home__nav-item';
        button.addEventListener('click', () => navigate(item.page));

        const checkBox = document.createElement('span');
        checkBox.className = 'nav-checkbox';
        checkBox.setAttribute('aria-hidden', 'true');

        const label = document.createElement('span');
        label.textContent = item.label;

        button.appendChild(checkBox);
        button.appendChild(label);
        nav.appendChild(button);
    }
    page.appendChild(nav);

    const charWrap = document.createElement('div');
    charWrap.className = 'home__character';

    const charImg = new Image();
    charImg.className = 'home__character-img';
    charImg.alt = '';
    charImg.src = '/assets/images/goober.png'
    charWrap.appendChild(charImg);

    page.appendChild(charWrap);

    return page;
}
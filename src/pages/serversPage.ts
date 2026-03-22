import type { NavigateFn, Server, MapOption } from '../types.js';
import { backButton } from '../components/backButton.js';

const SERVERS: Server[] = [
    { id: 1, name: 'Server 1', currentPlayers: 1, maxPlayers: 2},
    { id: 2, name: 'Server 2', currentPlayers: 1, maxPlayers: 2},
    { id: 3, name: 'Server 3', currentPlayers: 2, maxPlayers: 2},
    { id: 4, name: 'Server 4', currentPlayers: 2, maxPlayers: 2},
];

const MAP_OPTIONS: MapOption[] = [
    { id: 'cat-cafe', label: 'cat cafe'},
    { id: 'dog-park', label: 'dog park'},
    { id: 'ceiling', label: 'ceiling'},
    { id: 'pizza-hut', label: 'pizza hut'},  
]

export function createServersPage(navigate: NavigateFn): HTMLElement {
    const page = document.createElement('div');
    page.className = 'page page--play';
    page.id = 'page-play';

    const back = new backButton({ onClick: () => navigate('home')});
    page.appendChild(back.element);


    return page;
}
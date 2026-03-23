import type { NavigateFn, Server, MapOption } from '../types.js';
import { backButton } from '../components/backButton.js';
import { animatedButton } from '../components/animatedButton.js';

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
    page.className = 'page page--servers';
    page.id = 'page-serves';

    const back = new backButton({ onClick: () => navigate('home')});
    page.appendChild(back.element);

    const layout = document.createElement('div');
    layout.className = 'servers__layout';
    page.appendChild(layout);

    const serverList = document.createElement('div');
    serverList.className = 'servers__server-list';
    layout.appendChild(serverList);

    const divider = document.createElement('div');
    divider.className = 'divider--vertical';
    layout.appendChild(divider);

    const queuePanel = document.createElement('div');
    queuePanel.className = 'serves__queue_panel';
    queuePanel.setAttribute('aria-live', 'polite');
    layout.appendChild(queuePanel);

    let activeServerID: number | null = null;
    let isReady = false;
    let votedMapID: string | null = null;

    for (const server of SERVERS) {
        const isFull = server.currentPlayers >= server.maxPlayers;

        const info = document.createElement('div');
        info.className = 'server-row__info';

        const name = document.createElement('div');
        name.className = 'server-row__name';
        name.textContent = server.name;

        const count = document.createElement('div');
        count.className = [
            'server-row__count sublabel',
            isFull ? 'server-row__count-full' : '',
        ].filter(Boolean).join(' ');
        count.textContent = `${server.currentPlayers}/${server.maxPlayers} players`;

        info.appendChild(name);
        info.appendChild(count);

        const joinButton = new animatedButton({
            label: 'Join',
            disabled: isFull,
            onClick: () => {
                if (isFull) return;
                activeServerID = server.id;
                isReady = false;
                votedMapID = null;
                renderQueuePanel(server);
                document
                  .querySelectorAll('.server-row')
                  .forEach(serverElement => serverElement.classList.remove('server-row--active'));
                
            },
        });

        serverList.appendChild(joinButton)
        
        

    }

    return page;
}
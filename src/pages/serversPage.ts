import type { NavigateFn, Server, MapOption } from '../types.js';
import { backButton } from '../components/backButton.js';
import { animatedButton } from '../components/animatedButton.js';
import { BracketContainer } from '../components/bracketContainer.js';

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
    page.id = 'page-servers';

    const back = new backButton({ onClick: () => navigate('home') });
    page.appendChild(back.element);

    const backdrop = document.createElement('div');
    backdrop.className = 'queue-backdrop';
    page.appendChild(backdrop);

    const queuePill = document.createElement('button');
    queuePill.className = 'queue-pill';
    queuePill.addEventListener('click', openDrawer);
    page.insertBefore(queuePill, backdrop);

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
    queuePanel.className = 'servers__queue-panel';
    queuePanel.setAttribute('aria-live', 'polite');
    layout.appendChild(queuePanel);

    let activeServerID: number | null = null;
    let isReady = false;
    let votedMapID: string | null = null;

    function openDrawer(): void {
        queuePanel.classList.add('servers__queue-panel--open');
        backdrop.classList.add('queue-backdrop--visible');
    }

    function closeDrawer(): void {
        queuePanel.classList.remove('servers__queue-panel--open');
        backdrop.classList.remove('queue-backdrop--visible');
    }

    backdrop.addEventListener('click', closeDrawer);

    for (const server of SERVERS) {
        const isFull = server.currentPlayers >= server.maxPlayers;

        const bracket = new BracketContainer({ className: 'server-row' });

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
        bracket.append(info);

        const joinButton = new animatedButton({
            label: 'Join',
            disabled: isFull,
            onClick: () => {
                if (isFull) return;
                activeServerID = server.id;
                isReady = false;
                votedMapID = null;
                buildQueuePanel(server);
                openDrawer();
                document
                    .querySelectorAll('.server-row')
                    .forEach(el => el.classList.remove('server-row--active'));
                bracket.element.classList.add('server-row--active');
            },
        });
        bracket.append(joinButton.element);
        serverList.appendChild(bracket.element);
    }

    function buildQueuePanel(server: Server): void {
        queuePanel.innerHTML = '';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'queue-drawer-close';
        closeBtn.innerHTML = '&#8592; Close';
        closeBtn.addEventListener('click', closeDrawer);
        queuePanel.appendChild(closeBtn);

        queuePill.textContent = `> Queued in ${server.name}`;
        queuePill.classList.add('queue-pill--active');

        const title = document.createElement('div');
        title.className = 'queue__title label';
        title.textContent = `Queued in ${server.name}`;
        queuePanel.appendChild(title);

        const waiting = document.createElement('div');
        waiting.className = 'queue__waiting sublabel mt-sm';
        waiting.textContent = 'Waiting for more players:';
        queuePanel.appendChild(waiting);

        const readyRow = document.createElement('div');
        readyRow.className = 'queue__ready-row';
        

        const readyButton = new animatedButton({
            label: isReady ? 'Ready' : 'Not Ready',
            onClick: () => {
                isReady = !isReady;
                readyButton.setLabel(isReady ? 'Ready' : 'Not Ready');
                readyCountElement.textContent = `${isReady ? 1 : 0} / ${server.maxPlayers} players readied`;
            },
        });

        const readyCountElement = document.createElement('span');
        readyCountElement.className = 'sublabel queue__ready-count';
        readyCountElement.textContent = `${isReady ? 1 : 0} / ${server.maxPlayers} players readied`;

        readyRow.appendChild(readyButton.element);
        readyRow.appendChild(readyCountElement);
        queuePanel.appendChild(readyRow);

        const voteLabel = document.createElement('div');
        voteLabel.className = 'label mt-lg';
        voteLabel.textContent = 'Vote for map:';
        queuePanel.appendChild(voteLabel);

        const mapGrid = document.createElement('div');
        mapGrid.className = 'queue__map-grid mt-sm';

        for (const map of MAP_OPTIONS) {
            const mapButton = document.createElement('button');
            mapButton.className = 'map-vote-button';
            if (map.id === votedMapID) mapButton.classList.add('map-vote-button--voted');
            mapButton.textContent = map.label;
            mapButton.addEventListener('click', () => {
                votedMapID = map.id;
                buildQueuePanel(server);
            });
            mapGrid.appendChild(mapButton);
        }

        queuePanel.appendChild(mapGrid);
    }

    const emptyState = document.createElement('div');
    emptyState.className = 'queue__empty sublabel';
    emptyState.textContent = 'Select a server to join';
    queuePanel.appendChild(emptyState);

    return page;
}
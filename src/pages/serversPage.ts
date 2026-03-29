import type { NavigateFn, MapOption } from '../types.js';
import { Client, Room } from "@colyseus/sdk";
import { backButton } from '../components/backButton.js';
import { animatedButton }  from '../components/animatedButton.js';
import { BracketContainer } from '../components/bracketContainer.js';

const MAX_SERVERS = 4;
const SERVER_URL = "ws://localhost:2567";
const HTTP_URL = "http://localhost:2567";
const POLL_MS = 3_000;

const MAP_OPTIONS: MapOption[] = [
  { id: 'cat-cafe',  label: 'cat cafe'  },
  { id: 'dog-park',  label: 'dog park'  },
  { id: 'ceiling',   label: 'ceiling'   },
  { id: 'pizza-hut', label: 'pizza hut' },
];

interface LobbySlot {
  serverIndex: number;
  roomId:      string | null;
  clients:     number;
  maxClients:  number;
  locked:      boolean;
}

export function createServersPage(navigate: NavigateFn): HTMLElement {
  const page = document.createElement('div');
  page.className = 'page page--servers';
  page.id = 'page-servers';

  const colyseusClient = new Client(SERVER_URL);
  let activeRoom: Room | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  function cleanup() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    if (activeRoom) { activeRoom.leave(); activeRoom = null; }
  }

  const observer = new MutationObserver(() => {
    if (!document.contains(page)) { cleanup(); observer.disconnect(); }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  const back = new backButton({ onClick: () => { cleanup(); navigate('home'); } });
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

  const serverListEl = document.createElement('div');
  serverListEl.className = 'servers__server-list';
  layout.appendChild(serverListEl);

  const divider = document.createElement('div');
  divider.className = 'divider--vertical';
  layout.appendChild(divider);

  const queuePanel = document.createElement('div');
  queuePanel.className = 'servers__queue-panel';
  queuePanel.setAttribute('aria-live', 'polite');
  layout.appendChild(queuePanel);

  function openDrawer()  {
    queuePanel.classList.add('servers__queue-panel--open');
    backdrop.classList.add('queue-backdrop--visible');
  }
  function closeDrawer() {
    queuePanel.classList.remove('servers__queue-panel--open');
    backdrop.classList.remove('queue-backdrop--visible');
  }
  backdrop.addEventListener('click', closeDrawer);

  interface RowRefs {
    bracket:  BracketContainer;
    countEl:  HTMLElement;
    joinBtn:  animatedButton;
  }
  const rows: RowRefs[] = [];
  let slots: LobbySlot[] = Array.from({ length: MAX_SERVERS }, (_, i) => ({
    serverIndex: i, roomId: null, clients: 0, maxClients: 2, locked: false,
  }));

  for (let i = 0; i < MAX_SERVERS; i++) {
    const bracket = new BracketContainer({ className: 'server-row' });

    const info = document.createElement('div');
    info.className = 'server-row__info';

    const nameEl = document.createElement('div');
    nameEl.className = 'server-row__name';
    nameEl.textContent = `Server ${i + 1}`;

    const countEl = document.createElement('div');
    countEl.className = 'server-row__count sublabel';
    countEl.textContent = '0/2 players';

    info.appendChild(nameEl);
    info.appendChild(countEl);
    bracket.append(info);

    const joinBtn = new animatedButton({
      label: 'Join',
      disabled: false,
      onClick: () => handleJoin(i),
    });
    bracket.append(joinBtn.element);
    serverListEl.appendChild(bracket.element);

    rows.push({ bracket, countEl, joinBtn });
  }

  function applySlots(newSlots: LobbySlot[]) {
    slots = newSlots;
    for (let i = 0; i < MAX_SERVERS; i++) {
      const slot = newSlots[i];
      const row  = rows[i];
      if (!slot || !row) continue;

      const isFull = slot.clients >= slot.maxClients;
      row.countEl.textContent = `${slot.clients}/${slot.maxClients} players`;
      row.countEl.className = [
        'server-row__count sublabel',
        isFull ? 'server-row__count--full' : '',
      ].filter(Boolean).join(' ');

      (row.joinBtn.element as HTMLButtonElement).disabled = isFull;
    }
  }

  async function pollSlots() {
    try {
      const res  = await fetch(`${HTTP_URL}/lobby-rooms`);
      const data = await res.json() as LobbySlot[];
      applySlots(data);
    } catch {  }
  }

  pollSlots();
  pollTimer = setInterval(pollSlots, POLL_MS);

  async function handleJoin(serverIndex: number) {
    const slot = slots[serverIndex];
    if (slot.clients >= slot.maxClients) return;

    if (activeRoom) {
      await activeRoom.leave();
      activeRoom = null;
    }

    try {
      const room: Room = (slot.roomId && slot.clients < slot.maxClients)
        ? await colyseusClient.joinById(slot.roomId, { name: getPlayerName() })
        : await colyseusClient.create("lobby_room", {
            serverIndex,
            name: getPlayerName(),
          });

      activeRoom = room;

      rows.forEach(r => r.bracket.element.classList.remove('server-row--active'));
      rows[serverIndex].bracket.element.classList.add('server-row--active');

      queuePill.textContent = `> Queued in Server ${serverIndex + 1}`;
      queuePill.classList.add('queue-pill--active');

      buildQueuePanel(serverIndex + 1, room);
      openDrawer();

      room.onMessage("startGame", (msg: { roomId: string; map: string }) => {
        cleanup();
        const params = new URLSearchParams({ roomId: msg.roomId, map: msg.map });
        window.location.href = `http://localhost:5173?${params}`;
      });

      room.onLeave(() => {
        if (activeRoom === room) activeRoom = null;
        queuePill.textContent = '';
        queuePill.classList.remove('queue-pill--active');
        rows.forEach(r => r.bracket.element.classList.remove('server-row--active'));
        pollSlots();
        showEmptyState();
      });

      pollSlots();
    } catch (e) {
      console.error('[serversPage] Failed to join lobby room:', e);
    }
  }

  function showEmptyState() {
    queuePanel.innerHTML = '';
    const empty = document.createElement('div');
    empty.className = 'queue__empty sublabel';
    empty.textContent = 'Select a server to join';
    queuePanel.appendChild(empty);
  }

  function buildQueuePanel(serverNumber: number, room: Room) {
    queuePanel.innerHTML = '';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'queue-drawer-close';
    closeBtn.innerHTML = '&#8592; Close';
    closeBtn.addEventListener('click', closeDrawer);
    queuePanel.appendChild(closeBtn);

    const title = document.createElement('div');
    title.className = 'queue__title label';
    title.textContent = `Queued in Server ${serverNumber}`;
    queuePanel.appendChild(title);

    const playerListEl = document.createElement('div');
    playerListEl.className = 'queue__player-list mt-sm';
    queuePanel.appendChild(playerListEl);

    const readyRow = document.createElement('div');
    readyRow.className = 'queue__ready-row mt-sm';
    queuePanel.appendChild(readyRow);

    let localReady = false;
    const readyBtn = new animatedButton({
      label: 'Not Ready',
      onClick: () => {
        localReady = !localReady;
        readyBtn.setLabel(localReady ? 'Ready ✓' : 'Not Ready');
        room.send("setReady", { isReady: localReady });
      },
    });
    readyRow.appendChild(readyBtn.element);

    const voteLabel = document.createElement('div');
    voteLabel.className = 'label mt-lg';
    voteLabel.textContent = 'Vote for map:';
    queuePanel.appendChild(voteLabel);

    const mapGrid = document.createElement('div');
    mapGrid.className = 'queue__map-grid mt-sm';
    queuePanel.appendChild(mapGrid);

    function renderState() {
      const { players } = room.state as {
        players: Map<string, { name: string; isReady: boolean; votedMap: string }>;
        winningMap: string;
      };

      playerListEl.innerHTML = '';
      players.forEach((player, sessionId) => {
        const row = document.createElement('div');
        row.className = 'queue__player-row';
        const isMe = sessionId === room.sessionId;
        row.innerHTML = `
          <span class="queue__player-name">${player.name}${isMe ? ' <em>(you)</em>' : ''}</span>
          <span class="queue__player-status ${player.isReady ? 'status--ready' : 'status--waiting'}">
            ${player.isReady ? 'Ready' : 'Not Ready'}
          </span>`;
        playerListEl.appendChild(row);
      });

      mapGrid.innerHTML = '';
      for (const map of MAP_OPTIONS) {
        let votes = 0;
        let iMyVote = false;
        players.forEach((player, sessionId) => {
          if (player.votedMap === map.id) {
            votes++;
            if (sessionId === room.sessionId) iMyVote = true;
          }
        });

        const btn = document.createElement('button');
        btn.className = ['map-vote-button', iMyVote ? 'map-vote-button--voted' : '']
          .filter(Boolean).join(' ');
        btn.textContent = votes > 0 ? `${map.label} (${votes})` : map.label;
        btn.addEventListener('click', () => room.send("voteMap", { mapId: map.id }));
        mapGrid.appendChild(btn);
      }
    }

    room.onStateChange(renderState);
    if (room.state?.players) renderState();
  }

  showEmptyState();

  return page;
}

function getPlayerName(): string {
  let name = localStorage.getItem('playerName');
  if (!name) {
    name = `Player_${Math.random().toString(36).slice(2, 6)}`;
    localStorage.setItem('playerName', name);
  }
  return name;
}
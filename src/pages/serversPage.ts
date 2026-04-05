import type { NavigateFn, MapOption } from '../types.js';
import { Client, Room } from "@colyseus/sdk";
import { backButton } from '../components/backButton.js';
import { animatedButton }  from '../components/animatedButton.js';
import { BracketContainer } from '../components/bracketContainer.js';

const SERVER_URL = "ws://localhost:2567";
const HTTP_URL = "http://localhost:2567";
const POLL_MS = 1_000;

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

interface ActiveMatch {
  roomId:    string;
  startedAt: number;
  clients:   number;
  maxClients: number;
}

function formatElapsed(startedAt: number): string {
  const elapsed = Math.max(0, Date.now() - startedAt);
  const totalSeconds = Math.floor(elapsed / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function createServersPage(navigate: NavigateFn): HTMLElement {
  const page = document.createElement('div');
  page.className = 'page page--servers';
  page.id = 'page-servers';

  const colyseusClient = new Client(SERVER_URL);
  let activeRoom: Room | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let tickTimer: ReturnType<typeof setInterval> | null = null;
  let isQueued = false;

  let activeMatches: ActiveMatch[] = [];

  function cleanup() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
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

  const qqLabel = document.createElement('div');
  qqLabel.className = 'servers__section-label';
  qqLabel.textContent = 'Quick Queue';
  serverListEl.appendChild(qqLabel);

  const qqCard = new BracketContainer({ className: 'server-row' });

  const qqInfo = document.createElement('div');
  qqInfo.className = 'server-row__info';

  const qqName = document.createElement('div');
  qqName.className = 'server-row__name';
  qqName.textContent = '1v1s';

  const qqCount = document.createElement('div');
  qqCount.className = 'server-row__count sublabel';
  qqCount.textContent = '0/2 players';

  qqInfo.appendChild(qqName);
  qqInfo.appendChild(qqCount);
  qqCard.append(qqInfo);

  const qqJoinBtn = new animatedButton({
    label: 'Join',
    disabled: false,
    onClick: () => {
      if (isQueued) {
        activeRoom?.leave();
      } else {
        handleJoin();
      }
    },
  });
  qqCard.append(qqJoinBtn.element);
  serverListEl.appendChild(qqCard.element);

  const amLabel = document.createElement('div');
  amLabel.className = 'servers__section-label servers__section-label--active-matches';
  amLabel.textContent = 'Active Matches';
  serverListEl.appendChild(amLabel);

  const activeMatchesEl = document.createElement('div');
  activeMatchesEl.className = 'servers__active-matches';
  serverListEl.appendChild(activeMatchesEl);

  const divider = document.createElement('div');
  divider.className = 'divider--vertical';
  layout.appendChild(divider);

  const queuePanel = document.createElement('div');
  queuePanel.className = 'servers__queue-panel';
  queuePanel.setAttribute('aria-live', 'polite');
  layout.appendChild(queuePanel);

  function openDrawer() {
    queuePanel.classList.add('servers__queue-panel--open');
    backdrop.classList.add('queue-backdrop--visible');
  }
  function closeDrawer() {
    queuePanel.classList.remove('servers__queue-panel--open');
    backdrop.classList.remove('queue-backdrop--visible');
  }
  backdrop.addEventListener('click', closeDrawer);

  let currentSlot: LobbySlot | null = null;

  function applySlot(slot: LobbySlot | null) {
    // Always update the slot reference and count display —
    // only skip touching the button while queued.
    currentSlot = slot;

    if (!slot) {
      qqCount.textContent = '0/2 players';
      qqCount.className = 'server-row__count sublabel';
      if (!isQueued) (qqJoinBtn.element as HTMLButtonElement).disabled = false;
      return;
    }

    const isFull = slot.clients >= slot.maxClients;
    qqCount.textContent = `${slot.clients}/${slot.maxClients} players`;
    qqCount.className = [
      'server-row__count sublabel',
      isFull ? 'server-row__count--full' : '',
    ].filter(Boolean).join(' ');

    if (!isQueued) {
      (qqJoinBtn.element as HTMLButtonElement).disabled = isFull;
    }
  }

  function renderActiveMatches() {
    activeMatchesEl.innerHTML = '';

    if (activeMatches.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'queue__empty sublabel';
      empty.textContent = 'No active matches';
      activeMatchesEl.appendChild(empty);
      return;
    }

    for (const match of activeMatches) {
      const card = new BracketContainer({ className: 'server-row server-row--match' });

      const info = document.createElement('div');
      info.className = 'server-row__info';

      const nameEl = document.createElement('div');
      nameEl.className = 'server-row__name server-row__name--id';
      nameEl.textContent = match.roomId;

      const metaEl = document.createElement('div');
      metaEl.className = 'server-row__count sublabel server-row__meta';
      metaEl.dataset['started'] = String(match.startedAt);
      metaEl.textContent = `${match.clients}/${match.maxClients} players · ${formatElapsed(match.startedAt)}`;

      info.appendChild(nameEl);
      info.appendChild(metaEl);
      card.append(info);

      const spectateBtn = new animatedButton({
        label: 'Spectate',
        disabled: true,
        onClick: () => { },
      });
      card.append(spectateBtn.element);

      activeMatchesEl.appendChild(card.element);
    }
  }

  function tickElapsed() {
    const metas = activeMatchesEl.querySelectorAll<HTMLElement>('.server-row__meta[data-started]');
    metas.forEach(el => {
      const match = activeMatches.find(m => String(m.startedAt) === el.dataset['started']);
      if (!match) return;
      el.textContent = `${match.clients}/${match.maxClients} players · ${formatElapsed(match.startedAt)}`;
    });
  }

  async function pollAll() {
    try {
      const lobbyRes = await fetch(`${HTTP_URL}/lobby-rooms`);
      const lobbyData = await lobbyRes.json() as LobbySlot[];
      applySlot(lobbyData[0] ?? null);
    } catch { }

    try {
      const matchRes = await fetch(`${HTTP_URL}/active-matches`);
      const matchData = await matchRes.json() as ActiveMatch[];
      activeMatches = matchData;
      renderActiveMatches();
    } catch { }
  }

  pollAll();
  pollTimer = setInterval(pollAll, POLL_MS);
  tickTimer = setInterval(tickElapsed, 1_000);

  async function handleJoin() {
    if (currentSlot && currentSlot.clients >= currentSlot.maxClients) return;

    if (activeRoom) {
      await activeRoom.leave();
      activeRoom = null;
    }

    let room: Room;
    try {
      // Try joining an existing room; fall back to creating if the roomId is
      // stale (disposed between poll and click) or the room is now full.
      if (currentSlot?.roomId && (currentSlot.clients ?? 0) < (currentSlot.maxClients ?? 2)) {
        try {
          room = await colyseusClient.joinById(currentSlot.roomId, { name: getPlayerName() });
        } catch {
          room = await colyseusClient.create("lobby_room", { serverIndex: 0, name: getPlayerName() });
        }
      } else {
        room = await colyseusClient.create("lobby_room", { serverIndex: 0, name: getPlayerName() });
      }
    } catch (e) {
      console.error('[serversPage] Failed to join or create lobby room:', e);
      return;
    }

    activeRoom = room;
    isQueued = true;
    qqJoinBtn.setLabel('Leave');
    (qqJoinBtn.element as HTMLButtonElement).disabled = false;
    qqCard.element.classList.add('server-row--active');

    queuePill.textContent = '> Queued in 1v1s';
    queuePill.classList.add('queue-pill--active');

    buildQueuePanel(room);
    openDrawer();

    room.onMessage("startGame", (msg: { roomId: string; map: string }) => {
      cleanup();
      const params = new URLSearchParams({ roomId: msg.roomId, map: msg.map });
      window.location.href = `http://localhost:5174?${params}`;
    });

    room.onLeave(() => {
      if (activeRoom === room) activeRoom = null;
      isQueued = false;
      qqJoinBtn.setLabel('Join');
      (qqJoinBtn.element as HTMLButtonElement).disabled = false;
      queuePill.textContent = '';
      queuePill.classList.remove('queue-pill--active');
      qqCard.element.classList.remove('server-row--active');
      pollAll();
      showEmptyState();
    });

    pollAll();
  }

  function showEmptyState() {
    queuePanel.innerHTML = '';
    const empty = document.createElement('div');
    empty.className = 'queue__empty sublabel';
    empty.textContent = 'Join the queue to start a match';
    queuePanel.appendChild(empty);
  }

  function buildQueuePanel(room: Room) {
    queuePanel.innerHTML = '';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'queue-drawer-close';
    closeBtn.innerHTML = '&#8592; Close';
    closeBtn.addEventListener('click', closeDrawer);
    queuePanel.appendChild(closeBtn);

    const title = document.createElement('div');
    title.className = 'queue__title label';
    title.textContent = 'Queued in 1v1s';
    queuePanel.appendChild(title);

    const statusRow = document.createElement('div');
    statusRow.className = 'queue__status-row mt-sm';
    queuePanel.appendChild(statusRow);

    const playerListEl = document.createElement('div');
    playerListEl.className = 'queue__player-list mt-sm';
    queuePanel.appendChild(playerListEl);

    const voteLabel = document.createElement('div');
    voteLabel.className = 'label mt-lg';
    voteLabel.textContent = 'Vote for map:';
    queuePanel.appendChild(voteLabel);

    const mapGrid = document.createElement('div');
    mapGrid.className = 'queue__map-grid mt-sm';
    queuePanel.appendChild(mapGrid);

    const LOBBY_SIZE = 2;
    const COUNTDOWN_SECS = 5;

    let countdownInterval: ReturnType<typeof setInterval> | null = null;
    let countdownActive = false;

    function clearCountdown() {
      if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
      countdownActive = false;
    }

    function startCountdown() {
      if (countdownActive) return;
      countdownActive = true;
      let remaining = COUNTDOWN_SECS;

      function tick() {
        statusRow.innerHTML = '';
        const wrap = document.createElement('div');
        wrap.className = 'queue__countdown';

        const bar = document.createElement('div');
        bar.className = 'queue__countdown-bar';
        const fill = document.createElement('div');
        fill.className = 'queue__countdown-fill';
        fill.style.width = `${(remaining / COUNTDOWN_SECS) * 100}%`;
        bar.appendChild(fill);

        const text = document.createElement('div');
        text.className = 'queue__countdown-text sublabel';
        text.textContent = remaining > 0 ? `Starting in ${remaining}…` : `Starting…`;

        wrap.appendChild(bar);
        wrap.appendChild(text);
        statusRow.appendChild(wrap);
      }

      tick();
      countdownInterval = setInterval(() => {
        remaining -= 1;
        tick();
        if (remaining <= 0) { clearCountdown(); }
      }, 1_000);
    }

    let lastPlayerCount = 0;

    function renderState() {
      const { players } = room.state as {
        players: Map<string, { name: string; votedMap: string }>;
        winningMap: string;
      };

      if (players.size !== lastPlayerCount) {
        lastPlayerCount = players.size;
        pollAll();
      }


      const needed = LOBBY_SIZE - players.size;
      if (needed > 0) {
        clearCountdown();
        statusRow.innerHTML = '';
        const waitEl = document.createElement('div');
        waitEl.className = 'queue__waiting sublabel';
        waitEl.textContent = `waiting for ${needed} more player${needed !== 1 ? 's' : ''}`;
        statusRow.appendChild(waitEl);
      } else {
        startCountdown();
      }

      playerListEl.innerHTML = '';
      players.forEach((player, sessionId) => {
        const row = document.createElement('div');
        row.className = 'queue__player-row';
        const isMe = sessionId === room.sessionId;
        row.innerHTML = `
          <span class="queue__player-name">${player.name}${isMe ? ' <em>(you)</em>' : ''}</span>`;
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
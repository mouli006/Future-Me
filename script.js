(() => {
  'use strict';

  const STORAGE_KEY = 'futureMe.messages';
  const THEME_KEY = 'futureMe.theme';

  const QUOTES = [
    "The best time to plant a tree was 20 years ago. The second best time is now.",
    "Your future self is watching you right now through memories.",
    "Small steps today become the story you tell tomorrow.",
    "Time will pass anyway — spend it building who you want to become.",
    "Every letter to the future is a promise to keep growing.",
    "You are one decision away from a completely different life.",
    "What you do today, echoes in your future.",
    "Patience is the bridge between who you are and who you'll be.",
    "Dreams don't have deadlines, but growth loves a calendar.",
    "The future belongs to those who write to it first."
  ];

  const form = document.getElementById('letterForm');
  const nameInput = document.getElementById('name');
  const messageInput = document.getElementById('message');
  const dateInput = document.getElementById('unlockDate');
  const charCount = document.getElementById('charCount');
  const messagesGrid = document.getElementById('messagesGrid');
  const emptyState = document.getElementById('emptyState');
  const msgCount = document.getElementById('msgCount');
  const toast = document.getElementById('toast');
  const themeToggle = document.getElementById('themeToggle');
  const quoteText = document.getElementById('quoteText');

  const modalOverlay = document.getElementById('modalOverlay');
  const modalClose = document.getElementById('modalClose');
  const modalFrom = document.getElementById('modalFrom');
  const modalDate = document.getElementById('modalDate');
  const modalMessage = document.getElementById('modalMessage');

  // ---------- Date helpers ----------
  const todayStr = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  };

  dateInput.min = todayStr();

  const formatDate = (isoDate) => {
    const d = new Date(isoDate + 'T00:00:00');
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // ---------- Storage ----------
  const loadMessages = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveMessages = (messages) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  };

  let messages = loadMessages();

  // ---------- Theme ----------
  const applyTheme = (theme) => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeToggle.querySelector('.theme-icon').textContent = '☀️';
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      themeToggle.querySelector('.theme-icon').textContent = '🌙';
    }
  };

  const initTheme = () => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) {
      applyTheme(saved);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark ? 'dark' : 'light');
    }
  };

  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  });

  initTheme();

  // ---------- Quotes ----------
  const rotateQuote = () => {
    const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    quoteText.style.opacity = '0';
    setTimeout(() => {
      quoteText.textContent = `"${q}"`;
      quoteText.style.opacity = '1';
    }, 300);
  };
  rotateQuote();
  setInterval(rotateQuote, 8000);

  // ---------- Toast ----------
  let toastTimer = null;
  const showToast = (text) => {
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  };

  // ---------- Char count ----------
  messageInput.addEventListener('input', () => {
    charCount.textContent = messageInput.value.length;
  });

  // ---------- Countdown ----------
  const getTimeParts = (targetIso) => {
    const target = new Date(targetIso + 'T00:00:00').getTime();
    const now = Date.now();
    const diff = target - now;
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);
    return { days, hours, mins, secs };
  };

  const progressPercent = (createdIso, unlockIso) => {
    const created = new Date(createdIso).getTime();
    const unlock = new Date(unlockIso + 'T00:00:00').getTime();
    const now = Date.now();
    if (unlock <= created) return 100;
    const pct = ((now - created) / (unlock - created)) * 100;
    return Math.max(0, Math.min(100, pct));
  };

  // ---------- Render ----------
  const renderCard = (msg) => {
    const card = document.createElement('div');
    const parts = getTimeParts(msg.unlockDate);
    const isUnlocked = !parts;
    card.className = `msg-card ${isUnlocked ? 'unlocked' : 'locked'}`;
    card.dataset.id = msg.id;

    const top = document.createElement('div');
    top.className = 'msg-card-top';

    const nameEl = document.createElement('span');
    nameEl.className = 'msg-name';
    nameEl.textContent = msg.name;

    const statusEl = document.createElement('span');
    statusEl.className = 'msg-status';
    statusEl.textContent = isUnlocked ? '💌' : '🔒';

    top.appendChild(nameEl);
    top.appendChild(statusEl);
    card.appendChild(top);

    const dateEl = document.createElement('div');
    dateEl.className = 'msg-date';
    dateEl.textContent = `Unlocks ${formatDate(msg.unlockDate)}`;
    card.appendChild(dateEl);

    if (isUnlocked) {
      const badge = document.createElement('span');
      badge.className = 'unlocked-badge';
      badge.textContent = 'UNLOCKED — tap to read';
      card.appendChild(badge);

      const preview = document.createElement('div');
      preview.className = 'msg-preview';
      const snippet = msg.message.length > 70 ? msg.message.slice(0, 70) + '…' : msg.message;
      preview.textContent = snippet;
      card.appendChild(preview);

      card.addEventListener('click', (e) => {
        if (e.target.closest('.delete-btn')) return;
        openModal(msg);
      });
    } else {
      const countdown = document.createElement('div');
      countdown.className = 'countdown';
      countdown.textContent = `${parts.days}d ${parts.hours}h ${parts.mins}m ${parts.secs}s remaining`;
      card.appendChild(countdown);

      const track = document.createElement('div');
      track.className = 'progress-track';
      const fill = document.createElement('div');
      fill.className = 'progress-fill';
      fill.style.width = `${progressPercent(msg.createdAt, msg.unlockDate)}%`;
      track.appendChild(fill);
      card.appendChild(track);
    }

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteMessage(msg.id);
    });
    card.appendChild(delBtn);

    return card;
  };

  const render = () => {
    messagesGrid.innerHTML = '';
    if (messages.length === 0) {
      messagesGrid.appendChild(emptyState);
      msgCount.textContent = '0';
      return;
    }

    const sorted = [...messages].sort((a, b) => a.unlockDate.localeCompare(b.unlockDate));
    sorted.forEach((msg) => messagesGrid.appendChild(renderCard(msg)));
    msgCount.textContent = String(messages.length);
  };

  // Updates countdown text + progress bars on existing cards without
  // rebuilding the DOM (rebuilding every second was retriggering each
  // card's entrance animation, causing a constant blink).
  const updateLockedCards = () => {
    messages.forEach((m) => {
      const parts = getTimeParts(m.unlockDate);
      if (!parts) return;
      const card = messagesGrid.querySelector(`.msg-card[data-id="${m.id}"]`);
      if (!card) return;
      const countdownEl = card.querySelector('.countdown');
      const fillEl = card.querySelector('.progress-fill');
      if (countdownEl) countdownEl.textContent = `${parts.days}d ${parts.hours}h ${parts.mins}m ${parts.secs}s remaining`;
      if (fillEl) fillEl.style.width = `${progressPercent(m.createdAt, m.unlockDate)}%`;
    });
  };

  // ---------- Actions ----------
  const deleteMessage = (id) => {
    messages = messages.filter((m) => m.id !== id);
    saveMessages(messages);
    render();
    showToast('Message deleted');
  };

  const openModal = (msg) => {
    modalFrom.textContent = `From past ${msg.name}`;
    modalDate.textContent = `Sealed on ${new Date(msg.createdAt).toLocaleDateString()} · Unlocked ${formatDate(msg.unlockDate)}`;
    modalMessage.textContent = msg.message;
    modalOverlay.classList.add('show');
  };

  const closeModal = () => modalOverlay.classList.remove('show');
  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const message = messageInput.value.trim();
    const unlockDate = dateInput.value;

    if (!name || !message || !unlockDate) return;
    if (unlockDate < todayStr()) {
      showToast('Pick a date in the future');
      return;
    }

    const newMsg = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      message,
      unlockDate,
      createdAt: new Date().toISOString()
    };

    messages.push(newMsg);
    if (getTimeParts(newMsg.unlockDate)) previouslyLocked.add(newMsg.id);
    saveMessages(messages);
    render();

    form.reset();
    charCount.textContent = '0';
    dateInput.min = todayStr();

    showToast('Message sealed for the future ✨');
  });

  // ---------- Live ticking ----------
  const previouslyLocked = new Set();
  const syncLockedSet = () => {
    previouslyLocked.clear();
    messages.forEach((m) => {
      if (getTimeParts(m.unlockDate)) previouslyLocked.add(m.id);
    });
  };
  syncLockedSet();

  setInterval(() => {
    let justUnlocked = false;
    messages.forEach((m) => {
      const stillLocked = !!getTimeParts(m.unlockDate);
      if (!stillLocked && previouslyLocked.has(m.id)) {
        previouslyLocked.delete(m.id);
        justUnlocked = true;
      }
    });

    if (justUnlocked) {
      render();
      showToast('A message has unlocked! 💌');
    } else {
      updateLockedCards();
    }
  }, 1000);

  // ---------- Init ----------
  render();
})();

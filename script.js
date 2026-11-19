(() => {
  'use strict';
  const addons = Array.isArray(window.CRAFTNOVA_ADDONS) ? window.CRAFTNOVA_ADDONS : [];
  const $ = id => document.getElementById(id);
  const grid = $('addonGrid'), search = $('searchInput'), sort = $('sortSelect'), filters = $('filters');
  const modal = $('addonModal'), modalContent = $('modalContent');
  let category = 'All';

  const ICONS = { Bosses: '♜', Weapons: '⚔', Horror: '☠', Magic: '✧', Mobs: '🐾', Other: '⬡' };
  const ACCENTS = ['green', 'teal', 'blue', 'purple', 'red', 'gold'];

  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const isUrl = v => typeof v === 'string' && /^https?:\/\//i.test(v.trim());
  const time = v => new Date(v || '2000-01-01').getTime() || 0;
  const niceDate = v => { const d = new Date(v); return isNaN(d) ? '' : d.toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' }); };

  // Normalise each addon so missing optional fields never break the page.
  addons.forEach(a => {
    a.addonLink = (a.addonLink || a.downloadUrl || '').trim();
    a.videoLink = (a.videoLink || '').trim();
    a.accent = ACCENTS.includes(a.accent) ? a.accent : 'green';
    a.features = Array.isArray(a.features) ? a.features.filter(Boolean) : [];
    a.changelog = Array.isArray(a.changelog) ? a.changelog.filter(Boolean) : [];
  });

  function youtubeId(url) {
    if (!isUrl(url)) return null;
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/i);
    return m ? m[1] : null;
  }
  const thumbOf = a => a.image || (youtubeId(a.videoLink) ? `https://i.ytimg.com/vi/${youtubeId(a.videoLink)}/hqdefault.jpg` : '');
  const symbolOf = a => a.symbol || ICONS[a.category] || '⬡';

  function coverHTML(a, cls = '') {
    const t = thumbOf(a);
    return `<div class="cover ${cls}" data-accent="${esc(a.accent)}">
      <span class="cover-symbol">${esc(symbolOf(a))}</span>
      ${t ? `<img src="${esc(t)}" alt="" loading="lazy" decoding="async">` : ''}
      <span class="cover-shade"></span>
      <span class="tag">${esc(a.category)}</span>
      ${a.videoLink ? '<span class="tag tag-video">▶ Video</span>' : ''}
    </div>`;
  }

  /* ---------- filters (built from your addons, so new categories appear automatically) ---------- */
  function buildFilters() {
    const cats = ['All', ...new Set(addons.map(a => a.category).filter(Boolean))];
    filters.innerHTML = cats.map(c => `<button class="filter${c === category ? ' active' : ''}" role="tab" data-category="${esc(c)}">${esc(c)}</button>`).join('');
    filters.classList.toggle('hidden', cats.length <= 2);
  }

  /* ---------- list ---------- */
  function render() {
    const q = search.value.trim().toLowerCase();
    const items = addons.filter(a => (category === 'All' || a.category === category) &&
      [a.title, a.category, a.description, a.version, ...a.features].join(' ').toLowerCase().includes(q));
    if (sort.value === 'az') items.sort((a, b) => a.title.localeCompare(b.title));
    else items.sort((a, b) => time(b.date) - time(a.date));

    $('resultCount').textContent = `${items.length} addon${items.length === 1 ? '' : 's'}`;
    $('emptyState').classList.toggle('hidden', items.length !== 0);

    grid.innerHTML = items.map(a => `
      <article class="card" tabindex="0" role="button" aria-label="Open ${esc(a.title)}" data-id="${esc(a.id)}">
        ${coverHTML(a)}
        <div class="card-body">
          <div class="meta">${[a.minecraft, a.version && 'v' + a.version, a.size].filter(Boolean).map(x => `<span>${esc(x)}</span>`).join('')}</div>
          <h3>${esc(a.title)}</h3>
          <p>${esc(a.description)}</p>
          <div class="card-foot"><span class="view">View &amp; download</span><span class="arrow" aria-hidden="true">→</span></div>
        </div>
      </article>`).join('');
  }

  /* ---------- details popup ---------- */
  function openAddon(id) {
    const a = addons.find(x => x.id === id); if (!a) return;
    const vid = youtubeId(a.videoLink);
    const hasDl = isUrl(a.addonLink), hasVideo = isUrl(a.videoLink);
    const t = thumbOf(a);

    const media = vid
      ? `<div class="player" id="player" data-vid="${esc(vid)}" data-accent="${esc(a.accent)}">
           ${t ? `<img src="${esc(t)}" alt="">` : ''}
           <button class="play" aria-label="Play video"><svg viewBox="0 0 24 24" width="28" height="28"><path d="M8 5v14l11-7z" fill="currentColor"/></svg></button>
         </div>`
      : coverHTML(a, 'cover-modal');

    modalContent.innerHTML = `
      ${media}
      <div class="modal-body">
        <div class="eyebrow">${esc(a.category)}${a.minecraft ? ' · ' + esc(a.minecraft) : ''}</div>
        <h2 id="modalTitle">${esc(a.title)}</h2>
        <div class="meta">${[a.version && 'Version ' + a.version, a.size, niceDate(a.date)].filter(Boolean).map(x => `<span>${esc(x)}</span>`).join('')}</div>
        <p class="desc">${esc(a.description)}</p>
        ${a.features.length ? `<h4>Features</h4><ul>${a.features.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
        ${a.changelog.length ? `<h4>What's new</h4><ul>${a.changelog.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
        <div class="actions">
          ${hasDl
            ? `<a class="btn btn-primary" href="${esc(a.addonLink)}" target="_blank" rel="noopener noreferrer">⬇ Download addon</a>`
            : `<button class="btn btn-primary" disabled>Download coming soon</button>`}
          ${hasVideo ? `<a class="btn btn-ghost" href="${esc(a.videoLink)}" target="_blank" rel="noopener noreferrer">▶ Watch video</a>` : ''}
          <button class="btn btn-ghost" id="shareAddon">Share</button>
        </div>
      </div>`;

    const player = $('player');
    if (player) player.addEventListener('click', () => {
      player.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(player.dataset.vid)}?autoplay=1&rel=0" title="Video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
      player.classList.add('playing');
    }, { once: true });

    $('shareAddon').addEventListener('click', async e => {
      const url = new URL(location.href); url.search = ''; url.hash = ''; url.searchParams.set('addon', a.id);
      try {
        if (navigator.share) await navigator.share({ title: a.title, url: url.href });
        else { await navigator.clipboard.writeText(url.href); e.target.textContent = 'Link copied ✓'; }
      } catch { /* cancelled */ }
    });

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.modal').scrollTop = 0;
    history.replaceState({}, '', `?addon=${encodeURIComponent(a.id)}`);
  }

  function closeModal() {
    modal.classList.add('hidden');
    modalContent.innerHTML = '';          // also stops any playing video
    document.body.style.overflow = '';
    history.replaceState({}, '', location.pathname + location.hash);
  }

  /* ---------- events ---------- */
  const openFrom = e => { const el = e.target.closest('[data-id]'); if (el) openAddon(el.dataset.id); };
  const keyOpen = e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-id]')) { e.preventDefault(); openAddon(e.target.dataset.id); } };
  grid.addEventListener('click', openFrom); grid.addEventListener('keydown', keyOpen);

  // If a picture fails to load, remove it and the emoji/colour cover shows instead.
  document.addEventListener('error', e => { if (e.target.tagName === 'IMG') e.target.remove(); }, true);

  $('modalClose').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal(); });
  search.addEventListener('input', render);
  sort.addEventListener('change', render);
  filters.addEventListener('click', e => {
    const b = e.target.closest('[data-category]'); if (!b) return;
    category = b.dataset.category; buildFilters(); render();
  });

  const nav = $('navLinks'), burger = $('menuToggle');
  const setNav = open => { nav.classList.toggle('open', open); burger.classList.toggle('open', open); burger.setAttribute('aria-expanded', String(open)); };
  burger.addEventListener('click', () => setNav(!nav.classList.contains('open')));
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setNav(false)));

  $('year').textContent = new Date().getFullYear();
  buildFilters(); render();
  const wanted = new URLSearchParams(location.search).get('addon'); if (wanted) openAddon(wanted);
})();

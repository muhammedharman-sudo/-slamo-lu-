/* =========================================================
   KÜTÜPHANE — app.js
   Ortak fonksiyonlar: tema, GitHub, IndexedDB, metin ayrıştırma
   ========================================================= */

/* ---------------- TEMA ---------------- */
const THEME_KEY = 'kutuphane-tema';
function applyTheme(name) {
  document.body.className = document.body.className.replace(/theme-\S+/g, '').trim();
  document.body.classList.add('theme-' + name);
  localStorage.setItem(THEME_KEY, name);
  document.querySelectorAll('.theme-dot').forEach(d => {
    d.classList.toggle('selected', d.dataset.theme === name);
  });
}
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'kagit';
  applyTheme(saved);
}
function wireThemePicker() {
  document.querySelectorAll('.theme-dot').forEach(d => {
    d.addEventListener('click', () => applyTheme(d.dataset.theme));
  });
}

/* ---------------- INDEXEDDB ---------------- */
const DB_NAME = 'kutuphane-db';
const DB_VERSION = 1;
const STORE = 'headings';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'bookId' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbGetHeadings(bookId) {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(bookId);
      req.onsuccess = () => resolve(req.result ? req.result.headings : null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) { return null; }
}
async function idbSaveHeadings(bookId, headings) {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({ bookId, headings, updated: Date.now() });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) { return false; }
}

/* ---------------- GITHUB ---------------- */
const GH_KEY = 'kutuphane-github';
function getGithubConfig() { return JSON.parse(localStorage.getItem(GH_KEY) || '{}'); }
function saveGithubConfig(cfg) { localStorage.setItem(GH_KEY, JSON.stringify(cfg)); }

function isGithubRaw(url) { return /raw\.githubusercontent\.com/.test(url); }
function indexUrlFor(srcUrl) { return srcUrl.replace(/\.txt(\?.*)?$/i, '.index.json$1'); }

async function fetchText(url) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error('Dosya alınamadı: ' + r.status);
  return await r.text();
}

async function fetchExistingIndex(srcUrl) {
  try {
    const j = await fetchText(indexUrlFor(srcUrl));
    const parsed = JSON.parse(j);
    return parsed.headings || null;
  } catch (e) { return null; }
}

function derivePathFromRaw(rawUrl) {
  // https://raw.githubusercontent.com/OWNER/REPO/BRANCH/path/to/file.txt
  const m = rawUrl.match(/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/);
  if (!m) return null;
  return { owner: m[1], repo: m[2], branch: m[3], path: m[4] };
}

async function pushIndexToGithub(srcUrl, headings) {
  const cfg = getGithubConfig();
  if (!cfg.token) throw new Error('Önce ayarlardan GitHub erişim anahtarını (token) gir.');

  // Kaynak ya bir raw.githubusercontent.com linki, ya da aynı depo içinde göreli bir yol olabilir.
  let owner, repo, branch, path;
  const rawInfo = derivePathFromRaw(srcUrl);
  if (rawInfo) {
    owner = rawInfo.owner; repo = rawInfo.repo; branch = rawInfo.branch; path = rawInfo.path;
  } else if (!/^https?:\/\//i.test(srcUrl)) {
    // Göreli yol: repo bilgisi Ayarlar'dan gelir
    if (!cfg.owner || !cfg.repo) throw new Error('Göreli yol kullanan kitaplar için Ayarlar\'a GitHub kullanıcı adı ve depo adını da gir.');
    owner = cfg.owner; repo = cfg.repo; branch = cfg.branch || 'main';
    path = srcUrl.replace(/^\.?\//, '');
  } else {
    throw new Error('Bu linkten otomatik kayıt yapılamıyor. Kitabı aynı depoya koyup göreli yol kullan, ya da raw.githubusercontent.com linki ver.');
  }
  path = path.replace(/\.txt$/i, '.index.json');
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  let sha = null;
  try {
    const res = await fetch(apiUrl + `?ref=${branch}`, { headers: { Authorization: `token ${cfg.token}` } });
    if (res.ok) { const j = await res.json(); sha = j.sha; }
  } catch (e) { /* dosya yoksa yeni oluşturulacak */ }

  const payload = JSON.stringify({ headings, updated: new Date().toISOString() }, null, 2);
  const content = btoa(unescape(encodeURIComponent(payload)));
  const body = { message: 'İçindekiler indeksi güncellendi', content, branch };
  if (sha) body.sha = sha;

  const put = await fetch(apiUrl, {
    method: 'PUT',
    headers: { Authorization: `token ${cfg.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!put.ok) {
    const err = await put.json().catch(() => ({}));
    throw new Error('GitHub kaydı başarısız: ' + (err.message || put.status));
  }
  return true;
}

/* ---------------- METİN AYRIŞTIRMA ---------------- */
function splitLines(text) {
  return text.replace(/\r\n/g, '\n').split('\n');
}

// Dipnotları metnin sonundan ayıklar: "Dipnotlar" / "Dipnot" / "Notlar" başlığından sonrasını alır
function extractFootnotes(lines) {
  let startIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^(dipnotlar?|notlar)\s*:?\s*$/i.test(lines[i].trim())) { startIdx = i; break; }
  }
  const footnotes = {};
  let bodyLines = lines;
  if (startIdx >= 0) {
    bodyLines = lines.slice(0, startIdx);
    let current = null;
    for (let i = startIdx + 1; i < lines.length; i++) {
      const t = lines[i];
      const m = t.match(/^\[?(\d+)[.)\]]\s*(.*)$/);
      if (m) { current = m[1]; footnotes[current] = m[2]; }
      else if (current && t.trim() !== '') { footnotes[current] += ' ' + t.trim(); }
    }
  }
  return { footnotes, bodyLines };
}

// # / ## / ### işaretli başlıkları bulur (varsa en güvenilir kaynak)
function detectMarkdownHeadings(lines) {
  const out = [];
  lines.forEach((l, i) => {
    const m = l.match(/^(#{1,3})\s+(.+)$/);
    if (m) out.push({ line: i, level: m[1].length, title: m[2].trim() });
  });
  return out;
}

// Belirgin işaret yoksa: kısa, tek başına duran, büyük harfle başlayan satırları başlık say
function heuristicHeadings(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!t) continue;
    const prevBlank = i === 0 || lines[i - 1].trim() === '';
    const nextBlank = i === lines.length - 1 || lines[i + 1].trim() === '';
    const looksHeading = prevBlank && nextBlank && t.length <= 70 &&
      !/[.،,;:]$/.test(t) && /^[A-ZÇĞİÖŞÜ0-9]/.test(t);
    if (looksHeading) {
      const isAllCaps = t === t.toUpperCase() && /[A-ZÇĞİÖŞÜ]/.test(t);
      out.push({ line: i, level: isAllCaps ? 1 : 2, title: t, guessed: true });
    }
  }
  return out;
}

// Düz liste -> iç içe ağaç
function buildTree(headings) {
  const root = [];
  const stack = [{ level: 0, children: root }];
  headings.slice().sort((a, b) => a.line - b.line).forEach(h => {
    while (stack.length && stack[stack.length - 1].level >= h.level) stack.pop();
    const node = { ...h, children: [] };
    stack[stack.length - 1].children.push(node);
    stack.push(node);
  });
  return root;
}

// Bir başlığın kapsadığı satır aralığı: kendinden sonraki, kendisiyle aynı/daha üst seviyeli başlığa kadar
function sectionRange(sortedHeadings, idx, totalLines) {
  const h = sortedHeadings[idx];
  for (let i = idx + 1; i < sortedHeadings.length; i++) {
    if (sortedHeadings[i].level <= h.level) return [h.line + 1, sortedHeadings[i].line];
  }
  return [h.line + 1, totalLines];
}

function paragraphsFromLines(lines) {
  const html = [];
  let buf = [];
  const flush = () => { if (buf.length) { html.push(buf.join(' ')); buf = []; } };
  lines.forEach(l => {
    if (l.trim() === '') flush();
    else buf.push(escapeHtml(l.trim()));
  });
  flush();
  return html;
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Metindeki [1] [2] gibi referansları tıklanabilir span'e çevirir
function linkifyFootnotes(paragraphHtml) {
  return paragraphHtml.replace(/\[(\d+)\]/g, '<span class="fn-ref" data-fn="$1">[$1]</span>');
}

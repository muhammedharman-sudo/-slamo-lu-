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
async function idbGetBookData(bookId) {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(bookId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) { return null; }
}
async function idbSaveBookData(bookId, data) {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({ bookId, headings: data.headings || [], marks: data.marks || [], updated: Date.now() });
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
    return { headings: parsed.headings || [], marks: parsed.marks || [] };
  } catch (e) { return null; }
}

function derivePathFromRaw(rawUrl) {
  // https://raw.githubusercontent.com/OWNER/REPO/BRANCH/path/to/file.txt
  const m = rawUrl.match(/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/);
  if (!m) return null;
  return { owner: m[1], repo: m[2], branch: m[3], path: m[4] };
}

async function pushIndexToGithub(srcUrl, headings, marks) {
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

  const payload = JSON.stringify({ headings, marks: marks || [], updated: new Date().toISOString() }, null, 2);
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

/* ---------------- OTOMATİK KEŞİF (klasörleri tarayıp kütüphaneyi kendin oluşturur) ---------------- */
const GH_API = 'https://api.github.com';

async function ghListContents(owner, repo, path, branch) {
  const url = `${GH_API}/repos/${owner}/${repo}/contents/${encodeURI(path)}?ref=${encodeURIComponent(branch)}`;
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) {
    if (r.status === 404) throw new Error(`"${path}" klasörü depoda bulunamadı. Klasör adını ve depo bilgilerini kontrol et.`);
    if (r.status === 403) throw new Error('GitHub istek sınırına takıldı (biraz sonra tekrar dene) ya da depo bilgileri hatalı.');
    throw new Error('GitHub listesi alınamadı (' + r.status + '): ' + path);
  }
  return await r.json();
}

// kitaplar/ klasörünü tarar: her alt klasör bir kategori, içindeki .txt dosyaları o kategorinin kitapları olur
async function autoDiscoverLibrary(cfg) {
  const root = await ghListContents(cfg.owner, cfg.repo, cfg.folder || 'kitaplar', cfg.branch || 'main');
  const library = {};
  for (const item of root) {
    if (item.type === 'dir') {
      let files = [];
      try { files = await ghListContents(cfg.owner, cfg.repo, item.path, cfg.branch || 'main'); }
      catch (e) { continue; }
      const books = files
        .filter(f => f.type === 'file' && /\.txt$/i.test(f.name))
        .map(f => ({ title: f.name.replace(/\.txt$/i, ''), src: f.path }))
        .sort((a, b) => a.title.localeCompare(b.title, 'tr'));
      if (books.length) library[item.name] = books;
    } else if (item.type === 'file' && /\.txt$/i.test(item.name)) {
      library['Genel'] = library['Genel'] || [];
      library['Genel'].push({ title: item.name.replace(/\.txt$/i, ''), src: item.path });
    }
  }
  return library;
}
function splitLines(text) {
  return text.replace(/\r\n/g, '\n').split('\n');
}

// Dipnotları metnin sonundan ayıklar: "Dipnotlar" gibi bir başlık varsa onu kullanır,
// yoksa sondan geriye doğru numaralı liste bloğunu otomatik bulur.
function extractFootnotes(lines) {
  let startIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^(dipnotlar?|notlar|kaynaklar|açıklamalar)\s*:?\s*$/i.test(lines[i].trim())) { startIdx = i; break; }
  }
  if (startIdx === -1) {
    // Başlık yazısı yoksa: sondan geriye doğru "1. ..." / "[1] ..." kalıbında ardışık satırları ara
    let i = lines.length - 1;
    while (i >= 0 && lines[i].trim() === '') i--;
    let count = 0, boundary = i;
    while (i >= 0) {
      const t = lines[i].trim();
      if (t === '') { i--; continue; }
      if (/^\[?\d+[.)\]]\s+\S/.test(t)) { count++; boundary = i - 1; i--; continue; }
      break;
    }
    if (count >= 2) startIdx = boundary;
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
// Belirgin işaret yoksa: kısa, tek başına duran satırları başlık say.
// Numaralı liste kalıbı (örn. "8- EL-MÜHEYMİN") varsa ona öncelik ver, cümle gibi görünen satırları eleme.
function heuristicHeadings(lines) {
  const sentenceEnd = /(dır|dir|dur|dür|tır|tir|tur|tür|miş|muş|müş|mış|yor|ecek|acak|erek|arak)\.?$/i;
  const candidates = [];
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!t) continue;
    const prevBlank = i === 0 || lines[i - 1].trim() === '';
    const nextBlank = i === lines.length - 1 || lines[i + 1].trim() === '';
    const wordCount = t.split(/\s+/).length;
    if (prevBlank && nextBlank && t.length <= 70 && wordCount <= 8 &&
        !/[.،,;:]$/.test(t.replace(/['"’”)\]]+$/, '')) &&
        /^[A-ZÇĞİÖŞÜ0-9]/.test(t) && !sentenceEnd.test(t)) {
      candidates.push({ line: i, text: t });
    }
  }
  const numbered = candidates.filter(c => /^\d+[-.)]\s*\S/.test(c.text));
  const pool = numbered.length >= Math.max(3, Math.ceil(candidates.length * 0.4)) ? numbered : candidates;

  return pool.map(c => {
    const isNumbered = /^\d+[-.)]/.test(c.text);
    const isAllCaps = c.text === c.text.toUpperCase() && /[A-ZÇĞİÖŞÜ]/.test(c.text);
    return { line: c.line, level: (isNumbered || isAllCaps) ? 1 : 2, title: c.text, guessed: true };
  });
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

// Bir satırı, o satıra ait vurgu (mark) aralıklarını uygulayarak HTML'e çevirir
function renderLineWithMarks(lineText, marksForLine) {
  if (!marksForLine || !marksForLine.length) return escapeHtml(lineText);
  const sorted = marksForLine.slice().sort((a, b) => a.start - b.start);
  let out = '', pos = 0;
  const tagFor = { bold: 'strong', underline: 'u', highlight: 'mark' };
  sorted.forEach(m => {
    const s = Math.max(pos, Math.min(m.start, lineText.length));
    const e = Math.max(s, Math.min(m.end, lineText.length));
    if (s > pos) out += escapeHtml(lineText.slice(pos, s));
    if (e > s) {
      const tag = tagFor[m.type] || 'mark';
      out += `<${tag}>${escapeHtml(lineText.slice(s, e))}</${tag}>`;
    }
    pos = Math.max(pos, e);
  });
  if (pos < lineText.length) out += escapeHtml(lineText.slice(pos));
  return out;
}

// Bir bölümün satırlarını, vurguları uygulayarak ve satır kimliklerini (data-line) koruyarak paragraflara böler
function paragraphsWithMarks(lines, startLineIndex, allMarks) {
  const marksByLine = {};
  (allMarks || []).forEach(m => { (marksByLine[m.line] = marksByLine[m.line] || []).push(m); });
  const paras = [];
  let buf = [];
  const flush = () => { if (buf.length) { paras.push(buf.join(' ')); buf = []; } };
  lines.forEach((l, idx) => {
    if (l.trim() === '') { flush(); return; }
    const trueLine = startLineIndex + idx;
    const html = renderLineWithMarks(l.trim(), marksByLine[trueLine]);
    buf.push(`<span class="src-line" data-line="${trueLine}">${html}</span>`);
  });
  flush();
  return paras;
}

// Seçili metnin, hangi satır(lar)a denk geldiğini ve o satır içindeki karakter aralığını bulur
function getSelectionLineRanges(containerEl) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return [];
  const range = sel.getRangeAt(0);
  const results = [];
  containerEl.querySelectorAll('.src-line').forEach(span => {
    const spanRange = document.createRange();
    spanRange.selectNodeContents(span);
    const overlaps = range.compareBoundaryPoints(Range.END_TO_START, spanRange) < 0 &&
                      range.compareBoundaryPoints(Range.START_TO_END, spanRange) > 0;
    if (!overlaps) return;
    let start = 0, end = span.textContent.length;
    if (span.contains(range.startContainer)) {
      const tmp = document.createRange();
      tmp.setStart(span, 0);
      tmp.setEnd(range.startContainer, range.startOffset);
      start = tmp.toString().length;
    }
    if (span.contains(range.endContainer)) {
      const tmp = document.createRange();
      tmp.setStart(span, 0);
      tmp.setEnd(range.endContainer, range.endOffset);
      end = tmp.toString().length;
    }
    if (end > start) results.push({ line: Number(span.dataset.line), start, end });
  });
  return results;
}
function linkifyFootnotes(paragraphHtml) {
  return paragraphHtml.replace(/\[(\d+)\]/g, '<span class="fn-ref" data-fn="$1">[$1]</span>');
}

// Txt yazarken eklenebilecek basit vurgu işaretleri:
// **kalın**  __altı çizili__  ==vurgulu/işaretli==
function applyInlineMarks(s) {
  return s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<u>$1</u>')
    .replace(/==(.+?)==/g, '<mark>$1</mark>');
}

/* app.js — Çekirdek katman: sabit veriler, veritabanı, GitHub bağlantısı, yardımcılar, router, menü davranışları.
   Bu dosya 'views.js' dosyasından ÖNCE yüklenmelidir. */

// Kuran'daki 114 surenin sabit listesi.
// Bu veri değişmez (statik) olduğu için GitHub'dan çekilmez, uygulamayla birlikte gelir.
// "yer" alanı: "Mekke" veya "Medine" (bazı alimlere göre tartışmalı olanlar genel kabule göre yazılmıştır).
// Ayet sayıları yaygın kabul gören sayıma göredir; farklı kaynaklarda küçük farklar olabilir.

const SURAH_LIST = [
  { no: 1, ad: "Fatiha", ayet: 7, yer: "Mekke" },
  { no: 2, ad: "Bakara", ayet: 286, yer: "Medine" },
  { no: 3, ad: "Al-i İmran", ayet: 200, yer: "Medine" },
  { no: 4, ad: "Nisa", ayet: 176, yer: "Medine" },
  { no: 5, ad: "Maide", ayet: 120, yer: "Medine" },
  { no: 6, ad: "En'am", ayet: 165, yer: "Mekke" },
  { no: 7, ad: "A'raf", ayet: 206, yer: "Mekke" },
  { no: 8, ad: "Enfal", ayet: 75, yer: "Medine" },
  { no: 9, ad: "Tevbe", ayet: 129, yer: "Medine" },
  { no: 10, ad: "Yunus", ayet: 109, yer: "Mekke" },
  { no: 11, ad: "Hud", ayet: 123, yer: "Mekke" },
  { no: 12, ad: "Yusuf", ayet: 111, yer: "Mekke" },
  { no: 13, ad: "Ra'd", ayet: 43, yer: "Medine" },
  { no: 14, ad: "İbrahim", ayet: 52, yer: "Mekke" },
  { no: 15, ad: "Hicr", ayet: 99, yer: "Mekke" },
  { no: 16, ad: "Nahl", ayet: 128, yer: "Mekke" },
  { no: 17, ad: "İsra", ayet: 111, yer: "Mekke" },
  { no: 18, ad: "Kehf", ayet: 110, yer: "Mekke" },
  { no: 19, ad: "Meryem", ayet: 98, yer: "Mekke" },
  { no: 20, ad: "Taha", ayet: 135, yer: "Mekke" },
  { no: 21, ad: "Enbiya", ayet: 112, yer: "Mekke" },
  { no: 22, ad: "Hac", ayet: 78, yer: "Medine" },
  { no: 23, ad: "Mü'minun", ayet: 118, yer: "Mekke" },
  { no: 24, ad: "Nur", ayet: 64, yer: "Medine" },
  { no: 25, ad: "Furkan", ayet: 77, yer: "Mekke" },
  { no: 26, ad: "Şuara", ayet: 227, yer: "Mekke" },
  { no: 27, ad: "Neml", ayet: 93, yer: "Mekke" },
  { no: 28, ad: "Kasas", ayet: 88, yer: "Mekke" },
  { no: 29, ad: "Ankebut", ayet: 69, yer: "Mekke" },
  { no: 30, ad: "Rum", ayet: 60, yer: "Mekke" },
  { no: 31, ad: "Lokman", ayet: 34, yer: "Mekke" },
  { no: 32, ad: "Secde", ayet: 30, yer: "Mekke" },
  { no: 33, ad: "Ahzab", ayet: 73, yer: "Medine" },
  { no: 34, ad: "Sebe", ayet: 54, yer: "Mekke" },
  { no: 35, ad: "Fatır", ayet: 45, yer: "Mekke" },
  { no: 36, ad: "Yasin", ayet: 83, yer: "Mekke" },
  { no: 37, ad: "Saffat", ayet: 182, yer: "Mekke" },
  { no: 38, ad: "Sad", ayet: 88, yer: "Mekke" },
  { no: 39, ad: "Zümer", ayet: 75, yer: "Mekke" },
  { no: 40, ad: "Mü'min (Gafir)", ayet: 85, yer: "Mekke" },
  { no: 41, ad: "Fussilet", ayet: 54, yer: "Mekke" },
  { no: 42, ad: "Şura", ayet: 53, yer: "Mekke" },
  { no: 43, ad: "Zuhruf", ayet: 89, yer: "Mekke" },
  { no: 44, ad: "Duhan", ayet: 59, yer: "Mekke" },
  { no: 45, ad: "Casiye", ayet: 37, yer: "Mekke" },
  { no: 46, ad: "Ahkaf", ayet: 35, yer: "Mekke" },
  { no: 47, ad: "Muhammed", ayet: 38, yer: "Medine" },
  { no: 48, ad: "Fetih", ayet: 29, yer: "Medine" },
  { no: 49, ad: "Hucurat", ayet: 18, yer: "Medine" },
  { no: 50, ad: "Kaf", ayet: 45, yer: "Mekke" },
  { no: 51, ad: "Zariyat", ayet: 60, yer: "Mekke" },
  { no: 52, ad: "Tur", ayet: 49, yer: "Mekke" },
  { no: 53, ad: "Necm", ayet: 62, yer: "Mekke" },
  { no: 54, ad: "Kamer", ayet: 55, yer: "Mekke" },
  { no: 55, ad: "Rahman", ayet: 78, yer: "Medine" },
  { no: 56, ad: "Vakıa", ayet: 96, yer: "Mekke" },
  { no: 57, ad: "Hadid", ayet: 29, yer: "Medine" },
  { no: 58, ad: "Mücadele", ayet: 22, yer: "Medine" },
  { no: 59, ad: "Haşr", ayet: 24, yer: "Medine" },
  { no: 60, ad: "Mümtehine", ayet: 13, yer: "Medine" },
  { no: 61, ad: "Saf", ayet: 14, yer: "Medine" },
  { no: 62, ad: "Cuma", ayet: 11, yer: "Medine" },
  { no: 63, ad: "Münafikun", ayet: 11, yer: "Medine" },
  { no: 64, ad: "Tegabün", ayet: 18, yer: "Medine" },
  { no: 65, ad: "Talak", ayet: 12, yer: "Medine" },
  { no: 66, ad: "Tahrim", ayet: 12, yer: "Medine" },
  { no: 67, ad: "Mülk", ayet: 30, yer: "Mekke" },
  { no: 68, ad: "Kalem", ayet: 52, yer: "Mekke" },
  { no: 69, ad: "Hakka", ayet: 52, yer: "Mekke" },
  { no: 70, ad: "Mearic", ayet: 44, yer: "Mekke" },
  { no: 71, ad: "Nuh", ayet: 28, yer: "Mekke" },
  { no: 72, ad: "Cin", ayet: 28, yer: "Mekke" },
  { no: 73, ad: "Müzzemmil", ayet: 20, yer: "Mekke" },
  { no: 74, ad: "Müddessir", ayet: 56, yer: "Mekke" },
  { no: 75, ad: "Kıyame", ayet: 40, yer: "Mekke" },
  { no: 76, ad: "İnsan", ayet: 31, yer: "Medine" },
  { no: 77, ad: "Mürselat", ayet: 50, yer: "Mekke" },
  { no: 78, ad: "Nebe", ayet: 40, yer: "Mekke" },
  { no: 79, ad: "Naziat", ayet: 46, yer: "Mekke" },
  { no: 80, ad: "Abese", ayet: 42, yer: "Mekke" },
  { no: 81, ad: "Tekvir", ayet: 29, yer: "Mekke" },
  { no: 82, ad: "İnfitar", ayet: 19, yer: "Mekke" },
  { no: 83, ad: "Mutaffifin", ayet: 36, yer: "Mekke" },
  { no: 84, ad: "İnşikak", ayet: 25, yer: "Mekke" },
  { no: 85, ad: "Buruc", ayet: 22, yer: "Mekke" },
  { no: 86, ad: "Tarık", ayet: 17, yer: "Mekke" },
  { no: 87, ad: "A'la", ayet: 19, yer: "Mekke" },
  { no: 88, ad: "Gaşiye", ayet: 26, yer: "Mekke" },
  { no: 89, ad: "Fecr", ayet: 30, yer: "Mekke" },
  { no: 90, ad: "Beled", ayet: 20, yer: "Mekke" },
  { no: 91, ad: "Şems", ayet: 15, yer: "Mekke" },
  { no: 92, ad: "Leyl", ayet: 21, yer: "Mekke" },
  { no: 93, ad: "Duha", ayet: 11, yer: "Mekke" },
  { no: 94, ad: "İnşirah (Şerh)", ayet: 8, yer: "Mekke" },
  { no: 95, ad: "Tin", ayet: 8, yer: "Mekke" },
  { no: 96, ad: "Alak", ayet: 19, yer: "Mekke" },
  { no: 97, ad: "Kadir", ayet: 5, yer: "Mekke" },
  { no: 98, ad: "Beyyine", ayet: 8, yer: "Medine" },
  { no: 99, ad: "Zilzal", ayet: 8, yer: "Medine" },
  { no: 100, ad: "Adiyat", ayet: 11, yer: "Mekke" },
  { no: 101, ad: "Karia", ayet: 11, yer: "Mekke" },
  { no: 102, ad: "Tekasür", ayet: 8, yer: "Mekke" },
  { no: 103, ad: "Asr", ayet: 3, yer: "Mekke" },
  { no: 104, ad: "Hümeze", ayet: 9, yer: "Mekke" },
  { no: 105, ad: "Fil", ayet: 5, yer: "Mekke" },
  { no: 106, ad: "Kureyş", ayet: 4, yer: "Mekke" },
  { no: 107, ad: "Maun", ayet: 7, yer: "Mekke" },
  { no: 108, ad: "Kevser", ayet: 3, yer: "Mekke" },
  { no: 109, ad: "Kafirun", ayet: 6, yer: "Mekke" },
  { no: 110, ad: "Nasr", ayet: 3, yer: "Medine" },
  { no: 111, ad: "Tebbet (Mesed)", ayet: 5, yer: "Mekke" },
  { no: 112, ad: "İhlas", ayet: 4, yer: "Mekke" },
  { no: 113, ad: "Felak", ayet: 5, yer: "Mekke" },
  { no: 114, ad: "Nas", ayet: 6, yer: "Mekke" }
];

// Sure numarasını 3 haneli dosya adına çevirir: 1 -> "001"
function sureDosyaAdi(no) {
  return String(no).padStart(3, "0");
}

/*
  db.js — Tarayıcı içi veritabanı (IndexedDB) katmanı.

  localStorage yerine IndexedDB kullanıyoruz çünkü:
  - localStorage ~5-10MB ile sınırlı ve senkron çalışır (arayüzü kilitleyebilir)
  - IndexedDB çok daha büyük kapasiteye sahiptir ve asenkron çalışır

  Depolanan tablolar (object store):
  - settings      : kaynak ayarları, aktif kaynak seçimleri, tema vs. (tek satırlık ayar objesi)
  - sources       : GitHub kaynakları (arapça/meal/tefsir kaynak listesi)
  - topics        : kullanıcı tanımlı konular ve bu konuya atanmış ayetler
  - collections   : kümeler (sure/ayet aralığı listeleri)
  - favorites     : favori ayetler
  - notes         : ayet notları
  - related       : ilişkili ayet bağlantıları
  - cache         : GitHub'dan çekilen sure verilerinin geçici önbelleği (tekrar indirmeyi azaltmak için)
*/

const DB_NAME = "kuran_tefsir_db";
const DB_VERSION = 1;

const STORES = ["settings", "sources", "topics", "collections", "favorites", "notes", "related", "cache"];

let _dbPromise = null;

function openDB() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("sources")) {
        db.createObjectStore("sources", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("topics")) {
        db.createObjectStore("topics", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("collections")) {
        db.createObjectStore("collections", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("favorites")) {
        const s = db.createObjectStore("favorites", { keyPath: "id" });
        s.createIndex("bySureAyet", ["sure", "ayet"], { unique: false });
      }
      if (!db.objectStoreNames.contains("notes")) {
        const s = db.createObjectStore("notes", { keyPath: "id" });
        s.createIndex("bySureAyet", ["sure", "ayet"], { unique: false });
      }
      if (!db.objectStoreNames.contains("related")) {
        const s = db.createObjectStore("related", { keyPath: "id" });
        s.createIndex("bySureAyetA", ["sureA", "ayetA"], { unique: false });
      }
      if (!db.objectStoreNames.contains("cache")) {
        db.createObjectStore("cache", { keyPath: "key" });
      }
    };

    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
  return _dbPromise;
}

function tx(storeName, mode = "readonly") {
  return openDB().then((db) => db.transaction(storeName, mode).objectStore(storeName));
}

const DB = {
  // ---- Genel amaçlı yardımcılar ----
  async getAll(storeName) {
    const store = await tx(storeName);
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  async get(storeName, key) {
    const store = await tx(storeName);
    return new Promise((resolve, reject) => {
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  },

  async put(storeName, value) {
    const store = await tx(storeName, "readwrite");
    return new Promise((resolve, reject) => {
      const req = store.put(value);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  async delete(storeName, key) {
    const store = await tx(storeName, "readwrite");
    return new Promise((resolve, reject) => {
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async clear(storeName) {
    const store = await tx(storeName, "readwrite");
    return new Promise((resolve, reject) => {
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  // ---- Ayarlar (tek anahtar/değer) ----
  async getSetting(key, defaultValue = null) {
    const row = await DB.get("settings", key);
    return row ? row.value : defaultValue;
  },
  async setSetting(key, value) {
    return DB.put("settings", { key, value });
  },

  // ---- Yedekleme: tüm kullanıcı verisini tek JSON'a topla ----
  async exportAll() {
    const [sources, topics, collections, favorites, notes, related, settingsRaw] = await Promise.all([
      DB.getAll("sources"),
      DB.getAll("topics"),
      DB.getAll("collections"),
      DB.getAll("favorites"),
      DB.getAll("notes"),
      DB.getAll("related"),
      DB.getAll("settings")
    ]);
    return {
      _tip: "kuran-tefsir-yedek",
      _surum: 1,
      _tarih: new Date().toISOString(),
      sources,
      topics,
      collections,
      favorites,
      notes,
      related,
      settings: settingsRaw
    };
  },

  // ---- Geri yükleme: JSON'dan tüm kullanıcı verisini yaz ----
  async importAll(data, { overwrite = true } = {}) {
    if (!data || data._tip !== "kuran-tefsir-yedek") {
      throw new Error("Geçersiz yedek dosyası: '_tip' alanı 'kuran-tefsir-yedek' olmalı.");
    }
    if (overwrite) {
      await Promise.all(["sources", "topics", "collections", "favorites", "notes", "related", "settings"].map((s) => DB.clear(s)));
    }
    const writeAll = (storeName, rows) => Promise.all((rows || []).map((r) => DB.put(storeName, r)));
    await Promise.all([
      writeAll("sources", data.sources),
      writeAll("topics", data.topics),
      writeAll("collections", data.collections),
      writeAll("favorites", data.favorites),
      writeAll("notes", data.notes),
      writeAll("related", data.related),
      writeAll("settings", data.settings)
    ]);
  }
};

// Basit benzersiz kimlik üreteci
function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/*
  github.js — GitHub'a yüklenen JSON dosyalarını çekme katmanı.

  Mantık:
  - Her kaynak (Arapça / Meal / Tefsir) bir "baseUrl" ile tanımlanır.
    Örn: https://raw.githubusercontent.com/KULLANICI/REPO/main/data/arabic
  - Sure verisi bu baseUrl + "/001.json" şeklinde çekilir (bkz. surahList.js -> sureDosyaAdi).
  - Kullanıcı sadece hangi sureye tıkladıysa o dosya indirilir; tüm Kuran asla tek seferde
    indirilmez (kapasite/performans sorunu yaşanmasın diye).
  - Bir kez indirilen sure verisi IndexedDB "cache" tablosunda tutulur, tekrar tekrar
    indirilmez (kullanıcı "Önbelleği Temizle" ile bunu sıfırlayabilir).

  Beklenen JSON formatı (bkz. data/sample klasörü):
  Arapça : { sure_no, sure_adi, ayetler: [{ no, arapca }, ...] }
  Meal   : { sure_no, sure_adi, kaynak, ayetler: [{ no, meal }, ...] }
  Tefsir : { sure_no, sure_adi, kaynak, ayetler: [{ no, tefsir }, ...] }
*/

const GitHubData = {
  // Aktif kaynakların baseUrl'lerini ayarlardan okur
  async getActiveSources() {
    const sources = await DB.getAll("sources");
    const active = await DB.getSetting("activeSources", {});
    const findById = (id) => sources.find((s) => s.id === id) || null;
    return {
      arabic: findById(active.arabic),
      meal: findById(active.meal),
      tefsir: findById(active.tefsir)
    };
  },

  _cacheKey(type, sureNo, sourceId) {
    return `${type}:${sourceId || "none"}:${sureNo}`;
  },

  async _fetchJson(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Dosya alınamadı (${res.status}): ${url}`);
    }
    return res.json();
  },

  // type: "arabic" | "meal" | "tefsir"
  async fetchSurah(type, sureNo, source, { useCache = true } = {}) {
    if (!source || !source.baseUrl) {
      throw new Error(
        `${type === "arabic" ? "Arapça" : type === "meal" ? "Meal" : "Tefsir"} için aktif kaynak seçilmemiş. "Daha" menüsünden kaynak seçin.`
      );
    }
    const cacheKey = this._cacheKey(type, sureNo, source.id);

    if (useCache) {
      const cached = await DB.get("cache", cacheKey);
      if (cached) return cached.value;
    }

    const dosyaAdi = sureDosyaAdi(sureNo);
    const url = `${source.baseUrl.replace(/\/$/, "")}/${dosyaAdi}.json`;
    const data = await this._fetchJson(url);

    await DB.put("cache", { key: cacheKey, value: data, fetchedAt: Date.now() });
    return data;
  },

  // Bir sure için üç kaynağı da (varsa) paralel çeker ve ayet no'suna göre birleştirir
  async fetchSurahCombined(sureNo, { useCache = true } = {}) {
    const { arabic, meal, tefsir } = await this.getActiveSources();

    const [arabicData, mealData, tefsirData] = await Promise.allSettled([
      arabic ? this.fetchSurah("arabic", sureNo, arabic, { useCache }) : Promise.resolve(null),
      meal ? this.fetchSurah("meal", sureNo, meal, { useCache }) : Promise.resolve(null),
      tefsir ? this.fetchSurah("tefsir", sureNo, tefsir, { useCache }) : Promise.resolve(null)
    ]);

    const unwrap = (settled) => (settled.status === "fulfilled" ? settled.value : null);
    const errors = [arabicData, mealData, tefsirData]
      .filter((r) => r.status === "rejected")
      .map((r) => r.reason?.message || String(r.reason));

    const a = unwrap(arabicData);
    const m = unwrap(mealData);
    const t = unwrap(tefsirData);

    const ayetSayisi = (a?.ayetler?.length || m?.ayetler?.length || t?.ayetler?.length || 0);
    const ayetler = [];
    for (let i = 1; i <= ayetSayisi; i++) {
      ayetler.push({
        no: i,
        arapca: a?.ayetler?.find((x) => x.no === i)?.arapca || null,
        meal: m?.ayetler?.find((x) => x.no === i)?.meal || null,
        tefsir: t?.ayetler?.find((x) => x.no === i)?.tefsir || null
      });
    }

    return {
      sure_no: sureNo,
      sure_adi: a?.sure_adi || m?.sure_adi || t?.sure_adi || (SURAH_LIST.find((s) => s.no === sureNo)?.ad ?? ""),
      ayetler,
      errors
    };
  },

  async clearCache() {
    await DB.clear("cache");
  }
};

/* util.js — Ortak yardımcı fonksiyonlar: toast bildirimi, basit modal, ayet aksiyonları */

function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 2400);
}

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Basit modal: openModal(html içeriği, {onMount}) -> kapatma fonksiyonu döner
function openModal(innerHtml, { onMount } = {}) {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `<div class="modal">${innerHtml}</div>`;
  document.body.appendChild(backdrop);

  const close = () => backdrop.remove();
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) close();
  });
  document.addEventListener("keydown", function escHandler(e) {
    if (e.key === "Escape") { close(); document.removeEventListener("keydown", escHandler); }
  });

  if (onMount) onMount(backdrop.querySelector(".modal"), close);
  return close;
}

/* ---------------- Ayet aksiyonları: Favori / Not / İlişkili Ayet ---------------- */

const AyetActions = {
  async isFavorite(sure, ayet) {
    const all = await DB.getAll("favorites");
    return all.find((f) => f.sure === sure && f.ayet === ayet) || null;
  },

  async toggleFavorite(sure, ayet, sureAdi) {
    const existing = await this.isFavorite(sure, ayet);
    if (existing) {
      await DB.delete("favorites", existing.id);
      toast("Favorilerden çıkarıldı");
      return false;
    } else {
      await DB.put("favorites", { id: uid("fav"), sure, ayet, sureAdi, createdAt: Date.now() });
      toast("Favorilere eklendi");
      return true;
    }
  },

  async getNotes(sure, ayet) {
    const all = await DB.getAll("notes");
    return all.filter((n) => n.sure === sure && n.ayet === ayet).sort((a, b) => b.createdAt - a.createdAt);
  },

  async addNote(sure, ayet, sureAdi, text) {
    if (!text || !text.trim()) return;
    await DB.put("notes", { id: uid("note"), sure, ayet, sureAdi, text: text.trim(), createdAt: Date.now() });
    toast("Not eklendi");
  },

  async deleteNote(id) {
    await DB.delete("notes", id);
    toast("Not silindi");
  },

  async getRelated(sure, ayet) {
    const all = await DB.getAll("related");
    return all.filter((r) => r.sureA === sure && r.ayetA === ayet);
  },

  async addRelated(sure, ayet, sureAdi, sureB, ayetB, sureBAdi, note = "") {
    await DB.put("related", {
      id: uid("rel"), sureA: sure, ayetA: ayet, sureAdi,
      sureB, ayetB, sureBAdi, note, createdAt: Date.now()
    });
    toast("İlişkili ayet eklendi");
  },

  async deleteRelated(id) {
    await DB.delete("related", id);
    toast("İlişkili ayet kaldırıldı");
  }
};

/* Bir ayet kartının altındaki aksiyon çubuğunu + açılır not/ilişkili panelini oluşturur.
   container: bu HTML'in ekleneceği DOM elemanı
   ctx: { sure, ayet, sureAdi } */
async function renderAyetActions(container, ctx) {
  const { sure, ayet, sureAdi } = ctx;
  const fav = await AyetActions.isFavorite(sure, ayet);
  const notes = await AyetActions.getNotes(sure, ayet);
  const related = await AyetActions.getRelated(sure, ayet);

  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="ayet-actions">
      <button class="icon-btn btn-fav ${fav ? "active" : ""}" type="button">
        <svg viewBox="0 0 24 24" fill="${fav ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.6"><path d="M12 20s-7-4.35-9.5-8.5C.7 8 2 4.5 5.5 4A5.4 5.4 0 0 1 12 7a5.4 5.4 0 0 1 6.5-3C22 4.5 23.3 8 21.5 11.5 19 15.65 12 20 12 20Z"/></svg>
        ${fav ? "Favoride" : "Favori"}
      </button>
      <button class="icon-btn btn-related" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="6" cy="12" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M8.6 10.6 15.4 7.4M8.6 13.4l6.8 3.2"/></svg>
        İlişkili Ayet ${related.length ? `(${related.length})` : ""}
      </button>
      <button class="icon-btn btn-note" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 4h16v12H8l-4 4V4Z"/></svg>
        Not Ekle ${notes.length ? `(${notes.length})` : ""}
      </button>
    </div>
    <div class="notes-slot"></div>
    <div class="related-slot"></div>
  `;
  container.appendChild(wrap);

  const notesSlot = wrap.querySelector(".notes-slot");
  const relatedSlot = wrap.querySelector(".related-slot");

  function renderNotesList(list) {
    notesSlot.innerHTML = list.map((n) => `
      <div class="note-box" data-note-id="${n.id}">
        <div>${escapeHtml(n.text)}</div>
        <div class="note-meta">${new Date(n.createdAt).toLocaleString("tr-TR")} · <a href="#" class="del-note" data-id="${n.id}">sil</a></div>
      </div>
    `).join("");
    notesSlot.querySelectorAll(".del-note").forEach((a) => {
      a.addEventListener("click", async (e) => {
        e.preventDefault();
        await AyetActions.deleteNote(a.dataset.id);
        const fresh = await AyetActions.getNotes(sure, ayet);
        renderNotesList(fresh);
      });
    });
  }

  function renderRelatedList(list) {
    relatedSlot.innerHTML = list.length ? `<div class="related-tags">${list.map((r) => `
      <span class="related-tag">${escapeHtml(r.sureBAdi)} ${r.ayetB} <a href="#" class="del-rel" data-id="${r.id}" style="margin-left:6px;opacity:.7">✕</a></span>
    `).join("")}</div>` : "";
    relatedSlot.querySelectorAll(".del-rel").forEach((a) => {
      a.addEventListener("click", async (e) => {
        e.preventDefault();
        await AyetActions.deleteRelated(a.dataset.id);
        const fresh = await AyetActions.getRelated(sure, ayet);
        renderRelatedList(fresh);
      });
    });
  }

  renderNotesList(notes);
  renderRelatedList(related);

  wrap.querySelector(".btn-fav").addEventListener("click", async () => {
    await AyetActions.toggleFavorite(sure, ayet, sureAdi);
    const btn = wrap.querySelector(".btn-fav");
    const nowFav = await AyetActions.isFavorite(sure, ayet);
    btn.classList.toggle("active", !!nowFav);
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="${nowFav ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.6"><path d="M12 20s-7-4.35-9.5-8.5C.7 8 2 4.5 5.5 4A5.4 5.4 0 0 1 12 7a5.4 5.4 0 0 1 6.5-3C22 4.5 23.3 8 21.5 11.5 19 15.65 12 20 12 20Z"/></svg>
      ${nowFav ? "Favoride" : "Favori"}`;
  });

  wrap.querySelector(".btn-note").addEventListener("click", () => {
    openModal(`
      <h3>Not Ekle</h3>
      <p style="font-size:13px;color:#6B6350;margin-top:-8px">${escapeHtml(sureAdi)} Suresi, ${ayet}. Ayet</p>
      <div class="field">
        <label>Notunuz</label>
        <textarea id="noteText" placeholder="Bu ayetle ilgili düşüncelerinizi yazın..."></textarea>
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" data-close>Vazgeç</button>
        <button class="btn" id="saveNoteBtn">Kaydet</button>
      </div>
    `, {
      onMount: (modalEl, close) => {
        modalEl.querySelector("[data-close]").addEventListener("click", close);
        modalEl.querySelector("#saveNoteBtn").addEventListener("click", async () => {
          const val = modalEl.querySelector("#noteText").value;
          if (!val.trim()) return;
          await AyetActions.addNote(sure, ayet, sureAdi, val);
          close();
          const fresh = await AyetActions.getNotes(sure, ayet);
          renderNotesList(fresh);
          wrap.querySelector(".btn-note").innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 4h16v12H8l-4 4V4Z"/></svg>
            Not Ekle (${fresh.length})`;
        });
      }
    });
  });

  wrap.querySelector(".btn-related").addEventListener("click", () => {
    const options = SURAH_LIST.map((s) => `<option value="${s.no}">${s.no}. ${s.ad}</option>`).join("");
    openModal(`
      <h3>İlişkili Ayet Ekle</h3>
      <p style="font-size:13px;color:#6B6350;margin-top:-8px">${escapeHtml(sureAdi)} Suresi, ${ayet}. Ayet ile ilişkilendir</p>
      <div class="range-row">
        <div class="field">
          <label>Sure</label>
          <select id="relSure">${options}</select>
        </div>
        <div class="field">
          <label>Ayet No</label>
          <input type="text" id="relAyet" placeholder="Örn: 12" />
        </div>
      </div>
      <div class="field">
        <label>Not (opsiyonel)</label>
        <input type="text" id="relNote" placeholder="Neden ilişkili? (opsiyonel)" />
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" data-close>Vazgeç</button>
        <button class="btn" id="saveRelBtn">Ekle</button>
      </div>
    `, {
      onMount: (modalEl, close) => {
        modalEl.querySelector("[data-close]").addEventListener("click", close);
        modalEl.querySelector("#saveRelBtn").addEventListener("click", async () => {
          const sureB = parseInt(modalEl.querySelector("#relSure").value, 10);
          const ayetB = parseInt(modalEl.querySelector("#relAyet").value, 10);
          const note = modalEl.querySelector("#relNote").value;
          if (!sureB || !ayetB) { toast("Sure ve ayet numarası gerekli"); return; }
          const sureBAdi = SURAH_LIST.find((s) => s.no === sureB)?.ad || "";
          await AyetActions.addRelated(sure, ayet, sureAdi, sureB, ayetB, sureBAdi, note);
          close();
          const fresh = await AyetActions.getRelated(sure, ayet);
          renderRelatedList(fresh);
          wrap.querySelector(".btn-related").innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="6" cy="12" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M8.6 10.6 15.4 7.4M8.6 13.4l6.8 3.2"/></svg>
            İlişkili Ayet (${fresh.length})`;
        });
      }
    });
  });
}

/* router.js — Basit hash tabanlı yönlendirici.
   Rota tanımları app.js içinde Router.add(...) ile yapılır. */

const Router = {
  routes: [],

  add(pattern, handler) {
    // pattern örn: "/surah/:no" -> regex'e çevrilir
    const paramNames = [];
    const regexStr = "^" + pattern.replace(/:[^/]+/g, (m) => {
      paramNames.push(m.slice(1));
      return "([^/]+)";
    }) + "$";
    this.routes.push({ regex: new RegExp(regexStr), paramNames, handler });
  },

  async resolve() {
    const hash = location.hash.replace(/^#/, "") || "/home";
    const path = hash.split("?")[0];

    for (const route of this.routes) {
      const m = path.match(route.regex);
      if (m) {
        const params = {};
        route.paramNames.forEach((name, i) => (params[name] = decodeURIComponent(m[i + 1])));
        const app = document.getElementById("app");
        app.innerHTML = `<div class="loader"><svg viewBox="0 0 40 40"><use href="#rub-el-hizb"></use></svg><span>Yükleniyor…</span></div>`;
        window.scrollTo({ top: 0 });
        try {
          await route.handler(params);
        } catch (err) {
          console.error(err);
          app.innerHTML = `<div class="empty-state"><h4>Bir şeyler ters gitti</h4><p>${escapeHtml(err.message || String(err))}</p></div>`;
        }
        updateActiveNav(path);
        return;
      }
    }
    document.getElementById("app").innerHTML = `<div class="empty-state"><h4>Sayfa bulunamadı</h4></div>`;
  },

  init() {
    window.addEventListener("hashchange", () => this.resolve());
    this.resolve();
  }
};

function updateActiveNav(path) {
  document.querySelectorAll("[data-nav]").forEach((a) => a.classList.remove("active"));
  let key = null;
  if (path === "/home") key = "home";
  else if (path.startsWith("/sure")) key = "sureler";
  else if (path.startsWith("/kume")) key = "kumeler";
  else if (path.startsWith("/konu")) key = "konular";
  if (key) document.querySelectorAll(`[data-nav="${key}"]`).forEach((a) => a.classList.add("active"));
}

/* ---- Üst menü (Daha) açılır kapanır ---- */
// ---- Üst menü (Daha) açılır kapanır ----
const moreBtn = document.getElementById("moreBtn");
const moreMenu = document.getElementById("moreMenu");
moreBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  const open = moreMenu.classList.toggle("open");
  moreBtn.setAttribute("aria-expanded", open);
});
document.addEventListener("click", () => moreMenu.classList.remove("open"));

// ---- Mobil hamburger menü ----
const hamburgerBtn = document.getElementById("hamburgerBtn");
const mobileMenu = document.getElementById("mobileMenu");
hamburgerBtn.addEventListener("click", () => mobileMenu.classList.toggle("open"));
mobileMenu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => mobileMenu.classList.remove("open")));

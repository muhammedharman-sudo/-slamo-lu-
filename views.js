/* views.js — Tüm sayfa görünümleri + rota tanımları + uygulama başlangıcı.
   Bu dosya 'app.js' dosyasından SONRA yüklenmelidir. */

/* views/home.js — Ana sayfa: üç büyük bölüm kartı + kısa erişim */

const ViewHome = {
  async render() {
    const app = document.getElementById("app");

    const [topics, collections, favorites] = await Promise.all([
      DB.getAll("topics"),
      DB.getAll("collections"),
      DB.getAll("favorites")
    ]);

    app.innerHTML = `
      <p class="page-eyebrow">Miftah</p>
      <h1 class="page-title">Kuran-ı Kerim Tefsir</h1>
      <p class="page-sub">Arapça metin, meal ve tefsiri bir arada okuyun; ayetleri konularına göre keşfedin, kendi kümelerinizi ve notlarınızı oluşturun.</p>

      <div class="hero-cards">
        <a class="hero-card" href="#/sureler">
          <svg class="corner" viewBox="0 0 40 40"><use href="#rub-el-hizb"></use></svg>
          <div class="num">114 Sure</div>
          <h3>Sureler</h3>
          <p>Sure sure oku; her ayetin Arapçası, meali ve tefsiri birlikte.</p>
        </a>
        <a class="hero-card" href="#/kumeler">
          <svg class="corner" viewBox="0 0 40 40"><use href="#rub-el-hizb"></use></svg>
          <div class="num">${collections.length} Küme</div>
          <h3>Kümeler</h3>
          <p>Farklı surelerden seçtiğiniz ayet aralıklarını bir araya getirin.</p>
        </a>
        <a class="hero-card" href="#/konular">
          <svg class="corner" viewBox="0 0 40 40"><use href="#rub-el-hizb"></use></svg>
          <div class="num">${topics.length} Konu</div>
          <h3>Konular</h3>
          <p>Ayetleri kendi belirlediğiniz konu başlıklarına göre gruplayın.</p>
        </a>
      </div>

      <div class="hizb-divider"><svg viewBox="0 0 40 40"><use href="#rub-el-hizb"></use></svg></div>

      <div class="panel">
        <h3 style="font-family:var(--font-display);margin:0 0 4px;color:var(--parchment);font-size:20px;">Favorileriniz</h3>
        ${favorites.length === 0 ? `
          <p style="color:var(--text-muted-light);font-size:14px;margin:8px 0 0;">Henüz favori ayet eklemediniz. Bir sureyi açıp ayetin altındaki "Favori" butonuna basarak başlayabilirsiniz.</p>
        ` : `
          <div class="grid-list" style="margin-top:14px;">
            ${favorites.slice(0, 6).map((f) => `
              <a class="list-card" href="#/sure/${f.sure}#ayet-${f.ayet}">
                <div class="lc-no">${escapeHtml(f.sureAdi)}</div>
                <div class="lc-title">${f.ayet}. Ayet</div>
              </a>
            `).join("")}
          </div>
          ${favorites.length > 6 ? `<div style="margin-top:14px;"><a class="back-link" href="#/favoriler">Tüm favorileri gör →</a></div>` : ""}
        `}
      </div>
    `;
  }
};

/* views/surahList.js — 114 surenin listelendiği sayfa (arama destekli) */

const ViewSurahList = {
  async render() {
    const app = document.getElementById("app");
    app.innerHTML = `
      <p class="page-eyebrow">Okuma</p>
      <h1 class="page-title">Sureler</h1>
      <p class="page-sub">Bir sureye tıklayarak Arapça metnini, mealini ve tefsirini birlikte okuyun.</p>

      <div class="field" style="max-width:340px;margin-bottom:26px;">
        <input type="search" id="sureAra" placeholder="Sure adı veya numarası ara…" />
      </div>

      <div class="grid-list" id="sureGrid"></div>
    `;

    const grid = document.getElementById("sureGrid");

    function renderList(list) {
      if (list.length === 0) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><h4>Sonuç bulunamadı</h4><p>Farklı bir arama deneyin.</p></div>`;
        return;
      }
      grid.innerHTML = list.map((s) => `
        <a class="list-card" href="#/sure/${s.no}">
          <div class="lc-no">${String(s.no).padStart(3, "0")}</div>
          <div class="lc-title">${escapeHtml(s.ad)}</div>
          <div class="lc-meta">${s.ayet} ayet · ${s.yer}</div>
        </a>
      `).join("");
    }

    renderList(SURAH_LIST);

    document.getElementById("sureAra").addEventListener("input", (e) => {
      const q = e.target.value.trim().toLocaleLowerCase("tr");
      const filtered = SURAH_LIST.filter((s) =>
        s.ad.toLocaleLowerCase("tr").includes(q) || String(s.no) === q
      );
      renderList(filtered);
    });
  }
};

/* views/surahRead.js — Tek bir surenin ayet ayet okunduğu sayfa.
   Arapça + Meal + Tefsir aynı anda, GitHub kaynaklarından çekilerek gösterilir. */

const ViewSurahRead = {
  async render(sureNo) {
    const app = document.getElementById("app");
    const sureInfo = SURAH_LIST.find((s) => s.no === sureNo);
    if (!sureInfo) {
      app.innerHTML = `<div class="empty-state"><h4>Sure bulunamadı</h4></div>`;
      return;
    }

    const { arabic, meal, tefsir } = await GitHubData.getActiveSources();
    if (!arabic && !meal && !tefsir) {
      app.innerHTML = `
        <a class="back-link" href="#/sureler">← Sureler</a>
        <div class="empty-state">
          <svg viewBox="0 0 40 40"><use href="#rub-el-hizb"></use></svg>
          <h4>Henüz kaynak eklenmedi</h4>
          <p>Ayetleri okuyabilmek için önce "Daha" menüsünden Arapça, Meal ve Tefsir kaynaklarınızı (GitHub bağlantılarınızı) ekleyip aktif hale getirin.</p>
          <a class="btn" href="#/kaynaklar/arabic">Kaynak Ekle</a>
        </div>
      `;
      return;
    }

    app.innerHTML = `
      <a class="back-link" href="#/sureler">← Sureler</a>
      <p class="page-eyebrow">${sureInfo.no}. Sure · ${sureInfo.yer}</p>
      <h1 class="page-title">${escapeHtml(sureInfo.ad)}</h1>
      <p class="page-sub">${sureInfo.ayet} ayet</p>
      <div id="ayetler"></div>
    `;

    const container = document.getElementById("ayetler");
    container.innerHTML = `<div class="loader"><svg viewBox="0 0 40 40"><use href="#rub-el-hizb"></use></svg><span>${escapeHtml(sureInfo.ad)} suresi GitHub'dan getiriliyor…</span></div>`;

    let data;
    try {
      data = await GitHubData.fetchSurahCombined(sureNo);
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><h4>Veri alınamadı</h4><p>${escapeHtml(err.message)}</p></div>`;
      return;
    }

    if (data.errors && data.errors.length) {
      toast("Bazı kaynaklardan veri alınamadı, eksik görünebilir.");
    }

    if (!data.ayetler.length) {
      container.innerHTML = `<div class="empty-state"><h4>Bu sure için veri bulunamadı</h4><p>GitHub reponuzda ${sureDosyaAdi(sureNo)}.json dosyasının bulunduğundan emin olun.</p></div>`;
      return;
    }

    container.innerHTML = "";
    for (const ayet of data.ayetler) {
      const card = document.createElement("div");
      card.className = "ayet-card";
      card.id = `ayet-${ayet.no}`;
      card.innerHTML = `
        <div class="ayet-head">
          <span class="ayet-no">${ayet.no}</span>
        </div>
        ${ayet.arapca ? `<div class="ayet-arabic">${escapeHtml(ayet.arapca)}</div>` : ""}
        ${ayet.meal ? `<div class="ayet-meal">${escapeHtml(ayet.meal)}</div>` : ""}
        ${ayet.tefsir ? `<div class="ayet-tefsir"><span class="tefsir-kaynak">Tefsir</span>${escapeHtml(ayet.tefsir)}</div>` : ""}
      `;
      container.appendChild(card);
      await renderAyetActions(card, { sure: sureNo, ayet: ayet.no, sureAdi: sureInfo.ad });
    }

    // Eğer URL'de #ayet-N varsa oraya kaydır
    const targetHash = location.hash.split("#")[2];
    if (targetHash) {
      const el = document.getElementById(`ayet-${targetHash.replace("ayet-", "")}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
};

/* views/topics.js — Kullanıcının kendi belirlediği konu başlıkları listesi (düzenlenebilir) */

const ViewTopics = {
  async render() {
    const app = document.getElementById("app");
    const topics = await DB.getAll("topics");
    topics.sort((a, b) => (a.name || "").localeCompare(b.name || "", "tr"));

    app.innerHTML = `
      <p class="page-eyebrow">Keşfet</p>
      <h1 class="page-title">Konular</h1>
      <p class="page-sub">Ayetleri kendi belirlediğiniz konu başlıkları altında toplayın. Bir konuya tıklayınca o konuya eklediğiniz ayetleri Arapça, Meal ve Tefsir sekmeleriyle görürsünüz.</p>

      <button class="btn" id="newTopicBtn">+ Yeni Konu</button>

      <div class="hizb-divider"><svg viewBox="0 0 40 40"><use href="#rub-el-hizb"></use></svg></div>

      <div id="topicGrid" class="grid-list"></div>
    `;

    const grid = document.getElementById("topicGrid");
    function renderGrid() {
      if (topics.length === 0) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1;">
            <svg viewBox="0 0 40 40"><use href="#rub-el-hizb"></use></svg>
            <h4>Henüz konu oluşturmadınız</h4>
            <p>Örneğin "Sabır", "Aile", "Kıssalar" gibi bir konu açıp, sure okurken veya buradan ayet ekleyebilirsiniz.</p>
          </div>
        `;
        return;
      }
      grid.innerHTML = topics.map((t) => `
        <a class="list-card" href="#/konu/${t.id}">
          <div class="lc-no">KONU</div>
          <div class="lc-title">${escapeHtml(t.name)}</div>
          <div class="lc-meta">${(t.ayetler || []).length} ayet</div>
        </a>
      `).join("");
    }
    renderGrid();

    document.getElementById("newTopicBtn").addEventListener("click", () => {
      openModal(`
        <h3>Yeni Konu</h3>
        <div class="field">
          <label>Konu Adı</label>
          <input type="text" id="topicName" placeholder="Örn: Sabır" />
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline" data-close>Vazgeç</button>
          <button class="btn" id="createTopicBtn">Oluştur</button>
        </div>
      `, {
        onMount: (modalEl, close) => {
          const input = modalEl.querySelector("#topicName");
          input.focus();
          modalEl.querySelector("[data-close]").addEventListener("click", close);
          modalEl.querySelector("#createTopicBtn").addEventListener("click", async () => {
            const name = input.value.trim();
            if (!name) return;
            const id = uid("topic");
            await DB.put("topics", { id, name, ayetler: [], createdAt: Date.now() });
            close();
            toast("Konu oluşturuldu");
            location.hash = `#/konu/${id}`;
          });
          input.addEventListener("keydown", (e) => { if (e.key === "Enter") modalEl.querySelector("#createTopicBtn").click(); });
        }
      });
    });
  }
};

/* views/topicDetail.js — Bir konunun detay sayfası.
   Üç sekme: Arapça (sadece Arapça), Meal (sadece meal), Tefsir (Arapça+Meal+Tefsir hepsi). */

const ViewTopicDetail = {
  async render(topicId) {
    const app = document.getElementById("app");
    const topic = await DB.get("topics", topicId);
    if (!topic) {
      app.innerHTML = `<div class="empty-state"><h4>Konu bulunamadı</h4><a class="btn" href="#/konular">Konulara Dön</a></div>`;
      return;
    }
    topic.ayetler = topic.ayetler || [];

    app.innerHTML = `
      <a class="back-link" href="#/konular">← Konular</a>
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:20px;flex-wrap:wrap;">
        <div>
          <p class="page-eyebrow">Konu</p>
          <h1 class="page-title" id="topicTitle">${escapeHtml(topic.name)}</h1>
          <p class="page-sub">${topic.ayetler.length} ayet bu konuya eklendi.</p>
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0;">
          <button class="icon-btn" id="renameBtn">Yeniden Adlandır</button>
          <button class="icon-btn" id="deleteTopicBtn" style="color:var(--maroon);border-color:var(--maroon);">Konuyu Sil</button>
        </div>
      </div>

      <button class="btn" id="addAyetBtn" style="margin-bottom:10px;">+ Ayet Ekle</button>

      <div class="tabs">
        <button class="tab-btn active" data-tab="arabic">Arapça</button>
        <button class="tab-btn" data-tab="meal">Meal</button>
        <button class="tab-btn" data-tab="tefsir">Tefsir</button>
      </div>

      <div id="tabContent"></div>
    `;

    document.getElementById("renameBtn").addEventListener("click", () => {
      openModal(`
        <h3>Konuyu Yeniden Adlandır</h3>
        <div class="field"><label>Konu Adı</label><input type="text" id="rnInput" value="${escapeHtml(topic.name)}" /></div>
        <div class="modal-actions">
          <button class="btn btn-outline" data-close>Vazgeç</button>
          <button class="btn" id="rnSave">Kaydet</button>
        </div>
      `, {
        onMount: (m, close) => {
          m.querySelector("[data-close]").addEventListener("click", close);
          m.querySelector("#rnSave").addEventListener("click", async () => {
            const val = m.querySelector("#rnInput").value.trim();
            if (!val) return;
            topic.name = val;
            await DB.put("topics", topic);
            document.getElementById("topicTitle").textContent = val;
            close();
            toast("Konu adı güncellendi");
          });
        }
      });
    });

    document.getElementById("deleteTopicBtn").addEventListener("click", () => {
      openModal(`
        <h3>Konuyu Sil</h3>
        <p style="font-size:14px;">"${escapeHtml(topic.name)}" konusunu ve içindeki ayet eşlemelerini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
        <div class="modal-actions">
          <button class="btn btn-outline" data-close>Vazgeç</button>
          <button class="btn btn-danger" id="confirmDel">Sil</button>
        </div>
      `, {
        onMount: (m, close) => {
          m.querySelector("[data-close]").addEventListener("click", close);
          m.querySelector("#confirmDel").addEventListener("click", async () => {
            await DB.delete("topics", topicId);
            close();
            toast("Konu silindi");
            location.hash = "#/konular";
          });
        }
      });
    });

    document.getElementById("addAyetBtn").addEventListener("click", () => {
      const options = SURAH_LIST.map((s) => `<option value="${s.no}">${s.no}. ${s.ad}</option>`).join("");
      openModal(`
        <h3>Konuya Ayet Ekle</h3>
        <div class="range-row">
          <div class="field"><label>Sure</label><select id="addSure">${options}</select></div>
          <div class="field"><label>Ayet No</label><input type="text" id="addAyet" placeholder="Örn: 153" /></div>
        </div>
        <p style="font-size:12.5px;color:#6B6350;">Birden fazla ayet eklemek için bu işlemi tekrarlayabilirsiniz.</p>
        <div class="modal-actions">
          <button class="btn btn-outline" data-close>Vazgeç</button>
          <button class="btn" id="addSave">Ekle</button>
        </div>
      `, {
        onMount: (m, close) => {
          m.querySelector("[data-close]").addEventListener("click", close);
          m.querySelector("#addSave").addEventListener("click", async () => {
            const sure = parseInt(m.querySelector("#addSure").value, 10);
            const ayet = parseInt(m.querySelector("#addAyet").value, 10);
            if (!sure || !ayet) { toast("Sure ve ayet numarası gerekli"); return; }
            const already = topic.ayetler.find((x) => x.sure === sure && x.ayet === ayet);
            if (already) { toast("Bu ayet zaten konuda ekli"); close(); return; }
            const sureAdi = SURAH_LIST.find((s) => s.no === sure)?.ad || "";
            topic.ayetler.push({ sure, ayet, sureAdi });
            await DB.put("topics", topic);
            close();
            toast("Ayet eklendi");
            ViewTopicDetail.render(topicId);
          });
        }
      });
    });

    // ---- Sekmeler ----
    const tabBtns = app.querySelectorAll(".tab-btn");
    let activeTab = "arabic";
    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        tabBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        activeTab = btn.dataset.tab;
        renderTabContent(activeTab);
      });
    });

    const tabContent = document.getElementById("tabContent");

    async function renderTabContent(tab) {
      if (topic.ayetler.length === 0) {
        tabContent.innerHTML = `
          <div class="empty-state">
            <svg viewBox="0 0 40 40"><use href="#rub-el-hizb"></use></svg>
            <h4>Bu konuya henüz ayet eklenmedi</h4>
            <p>Yukarıdaki "Ayet Ekle" butonunu kullanarak başlayın.</p>
          </div>
        `;
        return;
      }

      tabContent.innerHTML = `<div class="loader"><svg viewBox="0 0 40 40"><use href="#rub-el-hizb"></use></svg><span>Ayetler getiriliyor…</span></div>`;

      // Sure bazında grupla, her sureyi bir kez çek
      const sureNos = [...new Set(topic.ayetler.map((x) => x.sure))];
      const sureDataMap = {};
      try {
        await Promise.all(sureNos.map(async (no) => {
          sureDataMap[no] = await GitHubData.fetchSurahCombined(no);
        }));
      } catch (err) {
        tabContent.innerHTML = `<div class="empty-state"><h4>Veri alınamadı</h4><p>${escapeHtml(err.message)}</p></div>`;
        return;
      }

      tabContent.innerHTML = "";
      for (const ref of topic.ayetler) {
        const sureData = sureDataMap[ref.sure];
        const ayetData = sureData?.ayetler.find((a) => a.no === ref.ayet);

        const card = document.createElement("div");
        card.className = "ayet-card";

        let body = `
          <div class="ayet-head">
            <span class="ayet-no">${ref.ayet}</span>
            <span style="font-size:13px;color:var(--sage);font-weight:600;">${escapeHtml(ref.sureAdi)}</span>
            <button class="icon-btn remove-from-topic" data-sure="${ref.sure}" data-ayet="${ref.ayet}" style="margin-left:auto;">Konudan Çıkar</button>
          </div>
        `;
        if (!ayetData) {
          body += `<p style="color:var(--text-muted-light);font-size:13.5px;">Bu ayet için veri bulunamadı.</p>`;
        } else {
          if (tab === "arabic" && ayetData.arapca) {
            body += `<div class="ayet-arabic">${escapeHtml(ayetData.arapca)}</div>`;
          }
          if (tab === "meal" && ayetData.meal) {
            body += `<div class="ayet-meal">${escapeHtml(ayetData.meal)}</div>`;
          }
          if (tab === "tefsir") {
            if (ayetData.arapca) body += `<div class="ayet-arabic">${escapeHtml(ayetData.arapca)}</div>`;
            if (ayetData.meal) body += `<div class="ayet-meal">${escapeHtml(ayetData.meal)}</div>`;
            if (ayetData.tefsir) body += `<div class="ayet-tefsir"><span class="tefsir-kaynak">Tefsir</span>${escapeHtml(ayetData.tefsir)}</div>`;
          }
        }
        card.innerHTML = body;
        tabContent.appendChild(card);

        if (ayetData) {
          await renderAyetActions(card, { sure: ref.sure, ayet: ref.ayet, sureAdi: ref.sureAdi });
        }
      }

      tabContent.querySelectorAll(".remove-from-topic").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const sure = parseInt(btn.dataset.sure, 10);
          const ayet = parseInt(btn.dataset.ayet, 10);
          topic.ayetler = topic.ayetler.filter((x) => !(x.sure === sure && x.ayet === ayet));
          await DB.put("topics", topic);
          toast("Ayet konudan çıkarıldı");
          ViewTopicDetail.render(topicId);
        });
      });
    }

    renderTabContent(activeTab);
  }
};

/* views/collections.js — Kümeler listesi (kişisel derlemeler) */

const ViewCollections = {
  async render() {
    const app = document.getElementById("app");
    const collections = await DB.getAll("collections");
    collections.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    app.innerHTML = `
      <p class="page-eyebrow">Derleme</p>
      <h1 class="page-title">Kümeler</h1>
      <p class="page-sub">Farklı surelerden seçtiğiniz ayet aralıklarını bir araya getirin. Örneğin bir sohbet veya ders için okuma listesi oluşturabilirsiniz.</p>

      <button class="btn" id="newCollectionBtn">+ Yeni Küme</button>

      <div class="hizb-divider"><svg viewBox="0 0 40 40"><use href="#rub-el-hizb"></use></svg></div>

      <div id="collGrid" class="grid-list"></div>
    `;

    const grid = document.getElementById("collGrid");
    function renderGrid() {
      if (collections.length === 0) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1;">
            <svg viewBox="0 0 40 40"><use href="#rub-el-hizb"></use></svg>
            <h4>Henüz küme oluşturmadınız</h4>
            <p>Bir küme oluşturup içine sure + ayet aralığı ekleyerek başlayın.</p>
          </div>
        `;
        return;
      }
      grid.innerHTML = collections.map((c) => `
        <a class="list-card" href="#/kume/${c.id}">
          <div class="lc-no">KÜME</div>
          <div class="lc-title">${escapeHtml(c.name)}</div>
          <div class="lc-meta">${(c.items || []).length} aralık</div>
        </a>
      `).join("");
    }
    renderGrid();

    document.getElementById("newCollectionBtn").addEventListener("click", () => {
      openModal(`
        <h3>Yeni Küme</h3>
        <div class="field">
          <label>Küme Adı</label>
          <input type="text" id="collName" placeholder="Örn: Cuma Sohbeti Ayetleri" />
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline" data-close>Vazgeç</button>
          <button class="btn" id="createCollBtn">Oluştur</button>
        </div>
      `, {
        onMount: (m, close) => {
          const input = m.querySelector("#collName");
          input.focus();
          m.querySelector("[data-close]").addEventListener("click", close);
          m.querySelector("#createCollBtn").addEventListener("click", async () => {
            const name = input.value.trim();
            if (!name) return;
            const id = uid("coll");
            await DB.put("collections", { id, name, items: [], createdAt: Date.now() });
            close();
            toast("Küme oluşturuldu");
            location.hash = `#/kume/${id}`;
          });
          input.addEventListener("keydown", (e) => { if (e.key === "Enter") m.querySelector("#createCollBtn").click(); });
        }
      });
    });
  }
};

/* views/collectionDetail.js — Bir kümenin detay sayfası: aralık ekleme + birleşik okuma */

const ViewCollectionDetail = {
  async render(collId) {
    const app = document.getElementById("app");
    const coll = await DB.get("collections", collId);
    if (!coll) {
      app.innerHTML = `<div class="empty-state"><h4>Küme bulunamadı</h4><a class="btn" href="#/kumeler">Kümelere Dön</a></div>`;
      return;
    }
    coll.items = coll.items || [];

    app.innerHTML = `
      <a class="back-link" href="#/kumeler">← Kümeler</a>
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:20px;flex-wrap:wrap;">
        <div>
          <p class="page-eyebrow">Küme</p>
          <h1 class="page-title" id="collTitle">${escapeHtml(coll.name)}</h1>
          <p class="page-sub">${coll.items.length} aralık eklendi.</p>
        </div>
        <button class="icon-btn" id="deleteCollBtn" style="color:var(--maroon);border-color:var(--maroon);">Kümeyi Sil</button>
      </div>

      <button class="btn" id="addRangeBtn" style="margin-bottom:18px;">+ Sure / Ayet Aralığı Ekle</button>

      <div class="panel" id="itemsPanel" style="margin-bottom:30px;"></div>

      <div class="hizb-divider"><svg viewBox="0 0 40 40"><use href="#rub-el-hizb"></use></svg></div>

      <div id="readArea"></div>
    `;

    document.getElementById("deleteCollBtn").addEventListener("click", () => {
      openModal(`
        <h3>Kümeyi Sil</h3>
        <p style="font-size:14px;">"${escapeHtml(coll.name)}" kümesini silmek istediğinize emin misiniz?</p>
        <div class="modal-actions">
          <button class="btn btn-outline" data-close>Vazgeç</button>
          <button class="btn btn-danger" id="confirmDel">Sil</button>
        </div>
      `, {
        onMount: (m, close) => {
          m.querySelector("[data-close]").addEventListener("click", close);
          m.querySelector("#confirmDel").addEventListener("click", async () => {
            await DB.delete("collections", collId);
            close();
            toast("Küme silindi");
            location.hash = "#/kumeler";
          });
        }
      });
    });

    function renderItemsPanel() {
      const panel = document.getElementById("itemsPanel");
      if (coll.items.length === 0) {
        panel.innerHTML = `<p style="color:var(--text-muted-light);font-size:14px;margin:0;">Henüz aralık eklenmedi.</p>`;
        return;
      }
      panel.innerHTML = `
        <div class="range-list">
          ${coll.items.map((it, idx) => `
            <div class="range-item" style="background:var(--ink);border-color:rgba(201,162,39,0.2);color:var(--text-light);">
              <span>${escapeHtml(it.sureAdi)} — ${it.ayetStart === it.ayetEnd ? `${it.ayetStart}. ayet` : `${it.ayetStart}–${it.ayetEnd}. ayetler`}</span>
              <button data-idx="${idx}" class="del-range-btn" style="color:var(--maroon);">✕</button>
            </div>
          `).join("")}
        </div>
      `;
      panel.querySelectorAll(".del-range-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          coll.items.splice(parseInt(btn.dataset.idx, 10), 1);
          await DB.put("collections", coll);
          renderItemsPanel();
          renderReadArea();
          toast("Aralık kaldırıldı");
        });
      });
    }
    renderItemsPanel();

    document.getElementById("addRangeBtn").addEventListener("click", () => {
      const options = SURAH_LIST.map((s) => `<option value="${s.no}">${s.no}. ${s.ad} (${s.ayet} ayet)</option>`).join("");
      openModal(`
        <h3>Sure / Ayet Aralığı Ekle</h3>
        <div class="field"><label>Sure</label><select id="rgSure">${options}</select></div>
        <div class="range-row">
          <div class="field"><label>Başlangıç Ayeti</label><input type="text" id="rgStart" placeholder="1" /></div>
          <div class="field"><label>Bitiş Ayeti</label><input type="text" id="rgEnd" placeholder="5 (tek ayet için boş bırakın)" /></div>
        </div>
        <p style="font-size:12.5px;color:#6B6350;">Birden fazla aralık eklemek için bu işlemi tekrarlayabilirsiniz.</p>
        <div class="modal-actions">
          <button class="btn btn-outline" data-close>Vazgeç</button>
          <button class="btn" id="rgSave">Ekle</button>
        </div>
      `, {
        onMount: (m, close) => {
          m.querySelector("[data-close]").addEventListener("click", close);
          m.querySelector("#rgSave").addEventListener("click", async () => {
            const sure = parseInt(m.querySelector("#rgSure").value, 10);
            const start = parseInt(m.querySelector("#rgStart").value, 10);
            const endRaw = m.querySelector("#rgEnd").value.trim();
            const end = endRaw ? parseInt(endRaw, 10) : start;
            if (!sure || !start || !end || end < start) { toast("Geçerli bir ayet aralığı girin"); return; }
            const sureAdi = SURAH_LIST.find((s) => s.no === sure)?.ad || "";
            coll.items.push({ sure, sureAdi, ayetStart: start, ayetEnd: end });
            await DB.put("collections", coll);
            close();
            renderItemsPanel();
            renderReadArea();
            toast("Aralık eklendi");
          });
        }
      });
    });

    async function renderReadArea() {
      const readArea = document.getElementById("readArea");
      if (coll.items.length === 0) {
        readArea.innerHTML = "";
        return;
      }
      readArea.innerHTML = `<div class="loader"><svg viewBox="0 0 40 40"><use href="#rub-el-hizb"></use></svg><span>Ayetler getiriliyor…</span></div>`;

      const sureNos = [...new Set(coll.items.map((it) => it.sure))];
      const sureDataMap = {};
      try {
        await Promise.all(sureNos.map(async (no) => {
          sureDataMap[no] = await GitHubData.fetchSurahCombined(no);
        }));
      } catch (err) {
        readArea.innerHTML = `<div class="empty-state"><h4>Veri alınamadı</h4><p>${escapeHtml(err.message)}</p></div>`;
        return;
      }

      readArea.innerHTML = "";
      for (const it of coll.items) {
        const sureData = sureDataMap[it.sure];
        const heading = document.createElement("h3");
        heading.style.cssText = "font-family:var(--font-display);color:var(--parchment);font-size:20px;margin:26px 0 6px;";
        heading.textContent = `${it.sureAdi} — ${it.ayetStart === it.ayetEnd ? `${it.ayetStart}. ayet` : `${it.ayetStart}-${it.ayetEnd}. ayetler`}`;
        readArea.appendChild(heading);

        for (let n = it.ayetStart; n <= it.ayetEnd; n++) {
          const ayetData = sureData?.ayetler.find((a) => a.no === n);
          const card = document.createElement("div");
          card.className = "ayet-card";
          let body = `<div class="ayet-head"><span class="ayet-no">${n}</span></div>`;
          if (!ayetData) {
            body += `<p style="color:var(--text-muted-light);font-size:13.5px;">Bu ayet için veri bulunamadı.</p>`;
          } else {
            if (ayetData.arapca) body += `<div class="ayet-arabic">${escapeHtml(ayetData.arapca)}</div>`;
            if (ayetData.meal) body += `<div class="ayet-meal">${escapeHtml(ayetData.meal)}</div>`;
            if (ayetData.tefsir) body += `<div class="ayet-tefsir"><span class="tefsir-kaynak">Tefsir</span>${escapeHtml(ayetData.tefsir)}</div>`;
          }
          card.innerHTML = body;
          readArea.appendChild(card);
          if (ayetData) await renderAyetActions(card, { sure: it.sure, ayet: n, sureAdi: it.sureAdi });
        }
      }
    }

    renderReadArea();
  }
};

/* views/sources.js — "Daha" menüsündeki kaynak yönetim sayfaları.
   Kullanıcı burada GitHub raw klasör bağlantılarını (baseUrl) ekler,
   birden fazla kaynak arasından hangisinin aktif kullanılacağını seçer. */

const SOURCE_LABELS = {
  arabic: { title: "Arapça Kaynakları", desc: "Ayetlerin Arapça metnini içeren GitHub klasör bağlantıları." },
  meal: { title: "Meal Kaynakları", desc: "Ayet meallerini içeren GitHub klasör bağlantıları." },
  tefsir: { title: "Tefsir Kaynakları", desc: "Ayet tefsirlerini içeren GitHub klasör bağlantıları." }
};

const ViewSources = {
  async render(type) {
    const app = document.getElementById("app");
    const label = SOURCE_LABELS[type];
    if (!label) {
      app.innerHTML = `<div class="empty-state"><h4>Geçersiz kaynak türü</h4></div>`;
      return;
    }

    const allSources = await DB.getAll("sources");
    const sources = allSources.filter((s) => s.type === type);
    const activeSources = await DB.getSetting("activeSources", {});

    app.innerHTML = `
      <p class="page-eyebrow">Daha › Kaynaklar</p>
      <h1 class="page-title">${label.title}</h1>
      <p class="page-sub">${label.desc} Dosya adları sure numarasına göre olmalı, örn: <code>001.json</code>, <code>002.json</code> ... Aşağıya reponuzun ilgili klasörünün <b>raw.githubusercontent.com</b> bağlantısını ekleyin.</p>

      <div class="chip-row">
        <a class="chip ${type === "arabic" ? "active" : ""}" href="#/kaynaklar/arabic">Arapça</a>
        <a class="chip ${type === "meal" ? "active" : ""}" href="#/kaynaklar/meal">Meal</a>
        <a class="chip ${type === "tefsir" ? "active" : ""}" href="#/kaynaklar/tefsir">Tefsir</a>
      </div>

      <button class="btn" id="addSourceBtn" style="margin-bottom:22px;">+ Kaynak Ekle</button>

      <div id="sourceList"></div>
    `;

    function renderList() {
      const listEl = document.getElementById("sourceList");
      if (sources.length === 0) {
        listEl.innerHTML = `
          <div class="empty-state">
            <svg viewBox="0 0 40 40"><use href="#rub-el-hizb"></use></svg>
            <h4>Henüz kaynak eklenmedi</h4>
            <p>Örnek bağlantı: https://raw.githubusercontent.com/kullaniciadi/repo-adi/main/data/${type}</p>
          </div>
        `;
        return;
      }
      listEl.innerHTML = sources.map((s) => `
        <div class="source-row ${activeSources[type] === s.id ? "active" : ""}">
          <div class="source-info">
            <div class="name">${escapeHtml(s.name)} ${activeSources[type] === s.id ? "· <span style=\"color:var(--gold)\">Aktif</span>" : ""}</div>
            <div class="url">${escapeHtml(s.baseUrl)}</div>
          </div>
          <div class="source-row-actions">
            ${activeSources[type] !== s.id ? `<button class="btn btn-sm" data-activate="${s.id}">Aktif Yap</button>` : ""}
            <button class="icon-btn btn-sm" data-delete="${s.id}" style="color:var(--maroon);">Sil</button>
          </div>
        </div>
      `).join("");

      listEl.querySelectorAll("[data-activate]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const updated = { ...activeSources, [type]: btn.dataset.activate };
          await DB.setSetting("activeSources", updated);
          toast("Aktif kaynak güncellendi");
          ViewSources.render(type);
        });
      });
      listEl.querySelectorAll("[data-delete]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          await DB.delete("sources", btn.dataset.delete);
          if (activeSources[type] === btn.dataset.delete) {
            const updated = { ...activeSources };
            delete updated[type];
            await DB.setSetting("activeSources", updated);
          }
          toast("Kaynak silindi");
          ViewSources.render(type);
        });
      });
    }
    renderList();

    document.getElementById("addSourceBtn").addEventListener("click", () => {
      openModal(`
        <h3>${label.title.replace("ları", "").replace("leri", "")} Ekle</h3>
        <div class="field">
          <label>Kaynak Adı</label>
          <input type="text" id="srcName" placeholder="Örn: Diyanet Meali" />
        </div>
        <div class="field">
          <label>GitHub Klasör Bağlantısı (raw)</label>
          <input type="url" id="srcUrl" placeholder="https://raw.githubusercontent.com/kullanici/repo/main/data/${type}" />
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline" data-close>Vazgeç</button>
          <button class="btn" id="srcSave">Ekle</button>
        </div>
      `, {
        onMount: (m, close) => {
          m.querySelector("[data-close]").addEventListener("click", close);
          m.querySelector("#srcSave").addEventListener("click", async () => {
            const name = m.querySelector("#srcName").value.trim();
            const baseUrl = m.querySelector("#srcUrl").value.trim();
            if (!name || !baseUrl) { toast("Ad ve bağlantı gerekli"); return; }
            const id = uid("src");
            await DB.put("sources", { id, type, name, baseUrl, createdAt: Date.now() });
            // İlk eklenen kaynak otomatik aktif olsun
            const current = await DB.getSetting("activeSources", {});
            if (!current[type]) {
              await DB.setSetting("activeSources", { ...current, [type]: id });
            }
            close();
            toast("Kaynak eklendi");
            ViewSources.render(type);
          });
        }
      });
    });
  }
};

/* views/favorites.js — Tüm favori ayetlerin listelendiği sayfa */

const ViewFavorites = {
  async render() {
    const app = document.getElementById("app");
    const favorites = await DB.getAll("favorites");
    favorites.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    app.innerHTML = `
      <p class="page-eyebrow">Daha › Favorilerim</p>
      <h1 class="page-title">Favorilerim</h1>
      <p class="page-sub">${favorites.length} ayeti favorilerinize eklediniz.</p>
      <div id="favGrid" class="grid-list"></div>
    `;

    const grid = document.getElementById("favGrid");
    if (favorites.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <svg viewBox="0 0 40 40"><use href="#rub-el-hizb"></use></svg>
          <h4>Henüz favori ayetiniz yok</h4>
          <p>Bir sureyi açıp ayetin altındaki "Favori" butonuna basarak ekleyebilirsiniz.</p>
          <a class="btn" href="#/sureler">Surelere Git</a>
        </div>
      `;
      return;
    }

    grid.innerHTML = favorites.map((f) => `
      <a class="list-card" href="#/sure/${f.sure}#ayet-${f.ayet}">
        <div class="lc-no">${escapeHtml(f.sureAdi)}</div>
        <div class="lc-title">${f.ayet}. Ayet</div>
        <div class="lc-meta">${new Date(f.createdAt).toLocaleDateString("tr-TR")}</div>
      </a>
    `).join("");
  }
};

/* views/notes.js — Tüm ayet notlarının listelendiği sayfa */

const ViewNotes = {
  async render() {
    const app = document.getElementById("app");
    const notes = await DB.getAll("notes");
    notes.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    app.innerHTML = `
      <p class="page-eyebrow">Daha › Notlarım</p>
      <h1 class="page-title">Notlarım</h1>
      <p class="page-sub">${notes.length} not eklediniz.</p>
      <div id="notesList"></div>
    `;

    const listEl = document.getElementById("notesList");
    if (notes.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 40 40"><use href="#rub-el-hizb"></use></svg>
          <h4>Henüz not eklemediniz</h4>
          <p>Bir sureyi açıp ayetin altındaki "Not Ekle" butonuna basarak başlayabilirsiniz.</p>
          <a class="btn" href="#/sureler">Surelere Git</a>
        </div>
      `;
      return;
    }

    listEl.innerHTML = notes.map((n) => `
      <a class="list-card" href="#/sure/${n.sure}#ayet-${n.ayet}" style="display:block;margin-bottom:12px;">
        <div class="lc-no">${escapeHtml(n.sureAdi)} · ${n.ayet}. Ayet</div>
        <div style="font-size:14.5px;color:var(--text-light);margin:6px 0;line-height:1.6;">${escapeHtml(n.text)}</div>
        <div class="lc-meta">${new Date(n.createdAt).toLocaleString("tr-TR")}</div>
      </a>
    `).join("");
  }
};

/* views/backup.js — Kişisel verilerin (favoriler, notlar, konular, kümeler, kaynaklar)
   JSON olarak dışa aktarılması ve geri yüklenmesi. localStorage yerine IndexedDB
   kullanıldığı için bu sayfa, cihazlar arası taşımanın tek yoludur. */

const ViewBackup = {
  async render() {
    const app = document.getElementById("app");
    app.innerHTML = `
      <p class="page-eyebrow">Daha › Yedekle</p>
      <h1 class="page-title">Yedekle / Geri Yükle</h1>
      <p class="page-sub">Favorileriniz, notlarınız, konularınız, kümeleriniz ve kaynak ayarlarınız bu cihazda saklanır. Başka bir cihaza taşımak veya kaybolmaması için düzenli olarak yedek indirin.</p>

      <div class="panel" style="margin-bottom:20px;">
        <h3 style="font-family:var(--font-display);margin:0 0 6px;color:var(--parchment);font-size:20px;">Yedek İndir</h3>
        <p style="font-size:13.5px;color:var(--text-muted-light);margin:0 0 16px;">Tüm kişisel verilerinizi tek bir JSON dosyası olarak indirin.</p>
        <button class="btn" id="exportBtn">Yedek Dosyasını İndir</button>
      </div>

      <div class="panel">
        <h3 style="font-family:var(--font-display);margin:0 0 6px;color:var(--parchment);font-size:20px;">Yedekten Geri Yükle</h3>
        <p style="font-size:13.5px;color:var(--text-muted-light);margin:0 0 16px;">Daha önce indirdiğiniz bir yedek dosyasını seçin. Bu işlem, bu cihazdaki mevcut verilerin üzerine yazar.</p>
        <input type="file" id="importFile" accept="application/json" style="margin-bottom:14px;" />
        <br/>
        <button class="btn btn-outline" id="importBtn">Geri Yükle</button>
      </div>
    `;

    document.getElementById("exportBtn").addEventListener("click", async () => {
      const data = await DB.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const tarih = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `miftah-yedek-${tarih}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast("Yedek dosyası indirildi");
    });

    document.getElementById("importBtn").addEventListener("click", async () => {
      const fileInput = document.getElementById("importFile");
      const file = fileInput.files[0];
      if (!file) { toast("Önce bir dosya seçin"); return; }

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        openModal(`
          <h3>Geri Yükleme Onayı</h3>
          <p style="font-size:14px;">Bu cihazdaki mevcut favoriler, notlar, konular, kümeler ve kaynak ayarlarının üzerine yazılacak. Devam etmek istiyor musunuz?</p>
          <div class="modal-actions">
            <button class="btn btn-outline" data-close>Vazgeç</button>
            <button class="btn btn-danger" id="confirmImport">Geri Yükle</button>
          </div>
        `, {
          onMount: (m, close) => {
            m.querySelector("[data-close]").addEventListener("click", close);
            m.querySelector("#confirmImport").addEventListener("click", async () => {
              try {
                await DB.importAll(data, { overwrite: true });
                close();
                toast("Veriler geri yüklendi");
                location.hash = "#/home";
              } catch (err) {
                toast("Hata: " + err.message);
              }
            });
          }
        });
      } catch (err) {
        toast("Dosya okunamadı: " + err.message);
      }
    });
  }
};

/* ---- Rota tanımları ---- */
Router.add("/home", (params) => ViewHome.render());
Router.add("/sureler", (params) => ViewSurahList.render());
Router.add("/sure/:no", (params) => ViewSurahRead.render(parseInt(params.no, 10)));

Router.add("/konular", (params) => ViewTopics.render());
Router.add("/konu/:id", (params) => ViewTopicDetail.render(params.id));

Router.add("/kumeler", (params) => ViewCollections.render());
Router.add("/kume/:id", (params) => ViewCollectionDetail.render(params.id));

Router.add("/kaynaklar/:type", (params) => ViewSources.render(params.type));

Router.add("/favoriler", (params) => ViewFavorites.render());
Router.add("/notlarim", (params) => ViewNotes.render());
Router.add("/yedekle", (params) => ViewBackup.render());

/* ---- Başlangıç ---- */
// ---- Başlangıç: ilk kurulum kontrolü (örnek kaynak yoksa varsayılan ayarları oluştur) ----
async function bootstrap() {
  const existing = await DB.getAll("sources");
  if (existing.length === 0) {
    // Kullanıcı "Daha" menüsünden kendi GitHub repo bağlantılarını ekleyecek.
    // Burada sadece boş başlatıyoruz; sources.js sayfası ekleme formunu sunar.
  }
  Router.init();
}

bootstrap();

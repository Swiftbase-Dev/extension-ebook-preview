/**
 * Standalone Web Component for E-book Previews Manager Admin Page
 * <ext-ebook-previews>
 */
(function() {
  class ExtEbookPreviews extends HTMLElement {
    constructor() {
      super();
      this.previews = [];
      this.products = [];
      this.loading = true;
      this.saving = false;
      this.extracting = false;
      this.extractMsg = "";
      this.showModal = false;
      this.showViewerModal = false;
      this.showAnalyticsModal = false;
      this.activePreview = null;
      this.analyticsData = null;
      this.viewerSpread = 0;
      this.extractCount = 2;
      this.form = {
        id: "",
        productId: "",
        title: "",
        author: "",
        coverImage: "",
        pages: ["Chapter 1\n\nThe quiet dawn illuminated the forgotten library...", "Chapter 1 (Continued)\n\nEndless shelves of leather-bound manuscripts held ancient secrets..."],
        ctaText: "Buy Full Book",
        ctaUrl: "/store"
      };
    }

    get apiBase() {
      return this._apiBase || "/api/extensions/ebook-preview";
    }

    set apiBase(val) {
      this._apiBase = val;
    }

    connectedCallback() {
      this.loadData();
    }

    async loadData() {
      this.loading = true;
      this.render();
      try {
        const [prevRes, prodRes] = await Promise.all([
          fetch(`${this.apiBase}/data/previews`),
          fetch(`/api/products`)
        ]);
        if (prevRes.ok) {
          const recs = await prevRes.json();
          const items = Array.isArray(recs) ? recs : (recs ? [recs] : []);
          this.previews = items.map(r => r.data || r).filter(Boolean);
        }
        if (prodRes.ok) {
          this.products = await prodRes.json();
        }
      } catch (err) {
        console.error("Failed to load previews data:", err);
      } finally {
        this.loading = false;
        this.render();
      }
    }

    render() {
      this.innerHTML = `
        <div class="space-y-6">
          <!-- Top Header -->
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight">E-book Previews Manager</h2>
              <p class="text-xs text-slate-500 mt-0.5">Create interactive excerpt previews for your store books, auto-extract chapters, and track reader engagement.</p>
            </div>

            <button id="btn-new-preview" class="btn btn-sm btn-primary text-white font-bold rounded-2xl px-5 text-xs uppercase tracking-wider shadow-md flex items-center gap-2">
              <span>+ New E-book Preview</span>
            </button>
          </div>

          <!-- Loading state -->
          ${this.loading ? `
            <div class="flex justify-center py-20">
              <span class="loading loading-spinner loading-lg text-primary"></span>
            </div>
          ` : this.previews.length === 0 ? `
            <div class="card bg-white dark:bg-slate-900 border border-base-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-sm">
              <div class="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center text-3xl mx-auto shadow-inner">
                📖
              </div>
              <div>
                <h3 class="font-black text-lg text-slate-900 dark:text-white">No E-book Previews Configured</h3>
                <p class="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Create a preview linked to one of your store books. We can automatically extract the first chapters from your uploaded EPUB file.
                </p>
              </div>
              <button id="btn-empty-create" class="btn btn-primary btn-sm text-white rounded-2xl font-bold px-6 text-xs uppercase shadow-md">
                Create Your First Preview
              </button>
            </div>
          ` : `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              ${this.previews.map(prev => `
                <div class="card bg-white dark:bg-slate-900 border border-base-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between" data-id="${prev.id}">
                  <div class="space-y-4">
                    <div class="flex items-start gap-4">
                      <div class="w-16 h-24 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-sm shrink-0 flex items-center justify-center">
                        ${prev.coverImage ? `<img src="${prev.coverImage}" class="w-full h-full object-cover" />` : `<span class="text-xl opacity-30">📖</span>`}
                      </div>
                      <div class="flex-1 min-w-0">
                        <span class="badge badge-xs font-mono font-bold uppercase text-[9px] bg-slate-100 dark:bg-slate-800 border-none mb-1">
                          ${(prev.pages || []).length} pages
                        </span>
                        <h4 class="font-black text-sm text-slate-900 dark:text-white truncate leading-snug">${prev.title}</h4>
                        <p class="text-xs text-slate-400 mt-0.5 truncate">by ${prev.author || 'Unknown'}</p>
                        <div class="text-[10px] text-slate-500 font-mono mt-2 truncate">
                          ID: ${prev.id}
                        </div>
                      </div>
                    </div>

                    <!-- Metrics Badges -->
                    <div class="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-850 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                      <div>
                        <span class="block text-[9px] font-bold uppercase text-slate-400">Views</span>
                        <span class="text-xs font-black text-slate-800 dark:text-slate-100 font-mono">${prev.viewsCount || 0}</span>
                      </div>
                      <div>
                        <span class="block text-[9px] font-bold uppercase text-slate-400">Flips</span>
                        <span class="text-xs font-black text-slate-800 dark:text-slate-100 font-mono">${prev.readsCount || 0}</span>
                      </div>
                      <div>
                        <span class="block text-[9px] font-bold uppercase text-slate-400">Clicks</span>
                        <span class="text-xs font-black text-primary font-mono">${prev.clicksCount || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center justify-between border-t border-base-200 dark:border-slate-800 pt-3 mt-4">
                    <button class="btn btn-xs btn-ghost text-slate-500 hover:text-primary font-bold text-[10px] btn-stats" data-id="${prev.id}">
                      Stats
                    </button>
                    <div class="flex items-center gap-1.5">
                      <button class="btn btn-xs btn-outline rounded-xl font-bold text-[10px] btn-test" data-id="${prev.id}">
                        Test Reader
                      </button>
                      <button class="btn btn-xs btn-primary text-white rounded-xl font-bold text-[10px] btn-edit" data-id="${prev.id}">
                        Edit
                      </button>
                      <button class="btn btn-xs btn-ghost text-rose-500 hover:bg-rose-500/10 rounded-xl font-bold btn-del" data-id="${prev.id}">
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Create/Edit Modal -->
        <dialog id="modal-preview-form" class="modal modal-bottom sm:modal-middle ${this.showModal ? 'modal-open' : ''}">
          <div class="modal-box bg-white dark:bg-slate-900 border border-base-200 dark:border-slate-800 max-w-3xl w-full rounded-3xl p-6 space-y-5">
            <div class="flex items-center justify-between border-b border-base-200 dark:border-slate-800 pb-3">
              <div>
                <h3 class="font-black text-xl text-slate-900 dark:text-white">${this.form.id ? 'Edit E-book Preview' : 'New E-book Preview'}</h3>
                <p class="text-xs text-slate-400">Configure book details and sample chapters for the Page Designer reader widget.</p>
              </div>
              <button id="btn-close-form" class="btn btn-sm btn-ghost btn-circle">✕</button>
            </div>

            <form id="form-preview" class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="text-[11px] font-bold text-slate-500 mb-1 block">Link Store Product</label>
                  <select id="input-product" class="select select-bordered select-sm w-full rounded-xl text-xs dark:bg-slate-800" required>
                    <option value="" disabled ${!this.form.productId ? 'selected' : ''}>-- Select book product --</option>
                    ${this.products.map(p => `
                      <option value="${p.id}" ${this.form.productId === p.id ? 'selected' : ''}>${p.name}</option>
                    `).join('')}
                  </select>
                </div>
                <div>
                  <label class="text-[11px] font-bold text-slate-500 mb-1 block">Preview Title</label>
                  <input id="input-title" type="text" class="input input-bordered input-sm w-full rounded-xl text-xs dark:bg-slate-800" value="${this.form.title}" required />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="text-[11px] font-bold text-slate-500 mb-1 block">Author</label>
                  <input id="input-author" type="text" class="input input-bordered input-sm w-full rounded-xl text-xs dark:bg-slate-800" value="${this.form.author}" required />
                </div>
                <div>
                  <label class="text-[11px] font-bold text-slate-500 mb-1 block">Cover Image URL</label>
                  <input id="input-cover" type="text" placeholder="https://..." class="input input-bordered input-sm w-full rounded-xl text-xs dark:bg-slate-800" value="${this.form.coverImage || ''}" />
                </div>
              </div>

              <!-- Automated Book Extraction Box -->
              <div class="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-2xl p-4 space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-base">⚡</span>
                    <div>
                      <h4 class="text-xs font-bold text-slate-900 dark:text-white">Auto-Extract Sample from Book File</h4>
                      <p class="text-[10px] text-slate-500 dark:text-slate-400">Upload an EPUB, HTML, or TXT file to automatically extract preview pages without manual entry.</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <label class="text-[10px] font-bold text-slate-400">Chapters/Sections:</label>
                    <select id="select-extract-count" class="select select-bordered select-xs rounded-lg dark:bg-slate-800">
                      <option value="1" ${this.extractCount === 1 ? 'selected' : ''}>1</option>
                      <option value="2" ${this.extractCount === 2 ? 'selected' : ''}>2</option>
                      <option value="3" ${this.extractCount === 3 ? 'selected' : ''}>3</option>
                      <option value="5" ${this.extractCount === 5 ? 'selected' : ''}>5</option>
                      <option value="10" ${this.extractCount === 10 ? 'selected' : ''}>10</option>
                    </select>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <label class="btn btn-xs btn-primary text-white rounded-xl font-bold uppercase tracking-wider cursor-pointer">
                    ${this.extracting ? 'Extracting...' : 'Upload & Extract File'}
                    <input type="file" id="file-extract-input" class="hidden" accept=".epub,.txt,.html,.htm" />
                  </label>
                  ${this.extractMsg ? `<span class="text-xs font-medium text-emerald-600 dark:text-emerald-400">${this.extractMsg}</span>` : ''}
                </div>
              </div>

              <!-- Pages list -->
              <div>
                <div class="flex justify-between items-center mb-1.5">
                  <label class="text-[11px] font-bold text-slate-500">Sample Pages (${this.form.pages.length} total)</label>
                  <button type="button" id="btn-add-page" class="btn btn-xs btn-ghost text-primary font-bold">+ Add Page</button>
                </div>
                <div id="pages-container" class="space-y-3 max-h-56 overflow-y-auto pr-1">
                  ${this.form.pages.map((p, idx) => `
                    <div class="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-base-200 dark:border-slate-800 space-y-2">
                      <div class="flex justify-between items-center text-xs font-bold text-slate-400">
                        <span>Page ${idx + 1}</span>
                        <button type="button" class="btn-remove-page btn btn-xs btn-circle btn-ghost text-rose-500 font-bold" data-idx="${idx}">✕</button>
                      </div>
                      <textarea class="page-content-input textarea textarea-bordered w-full rounded-xl text-xs font-serif leading-relaxed dark:bg-slate-900" rows="3" data-idx="${idx}">${p}</textarea>
                    </div>
                  `).join('')}
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="text-[11px] font-bold text-slate-500 mb-1 block">Purchase CTA Button Text</label>
                  <input id="input-cta-text" type="text" class="input input-bordered input-sm w-full rounded-xl text-xs dark:bg-slate-800" value="${this.form.ctaText || 'Buy Full Book'}" />
                </div>
                <div>
                  <label class="text-[11px] font-bold text-slate-500 mb-1 block">CTA Redirect URL</label>
                  <input id="input-cta-url" type="text" class="input input-bordered input-sm w-full rounded-xl text-xs dark:bg-slate-800" value="${this.form.ctaUrl || '/store'}" />
                </div>
              </div>

              <div class="modal-action">
                <button type="button" id="btn-cancel-form" class="btn btn-sm btn-ghost rounded-xl font-bold text-xs">Cancel</button>
                <button type="submit" class="btn btn-sm btn-primary text-white rounded-xl font-bold px-6 text-xs uppercase tracking-wider" ${this.saving ? 'disabled' : ''}>
                  ${this.saving ? 'Saving...' : 'Save Preview'}
                </button>
              </div>
            </form>
          </div>
        </dialog>

        <!-- Stats / Analytics Modal -->
        <dialog id="modal-analytics" class="modal modal-bottom sm:modal-middle ${this.showAnalyticsModal ? 'modal-open' : ''}">
          <div class="modal-box bg-white dark:bg-slate-900 border border-base-200 dark:border-slate-800 max-w-2xl w-full rounded-3xl p-6 space-y-6">
            <div class="flex items-center justify-between border-b border-base-200 dark:border-slate-800 pb-3">
              <div class="flex items-center gap-2">
                <span class="text-xl">📊</span>
                <div>
                  <h3 class="font-black text-xl text-slate-900 dark:text-white">Reader Engagement Stats</h3>
                  <p class="text-xs text-slate-400 font-medium">${this.activePreview?.title || ''}</p>
                </div>
              </div>
              <button id="btn-close-analytics" class="btn btn-sm btn-ghost btn-circle">✕</button>
            </div>

            <!-- Stats Overview Cards -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-base-200 dark:border-slate-700 text-center">
                <span class="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Views</span>
                <span class="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1 block">
                  ${this.activePreview?.viewsCount || 0}
                </span>
              </div>
              <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-base-200 dark:border-slate-700 text-center">
                <span class="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Page Flips</span>
                <span class="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1 block">
                  ${this.activePreview?.readsCount || 0}
                </span>
              </div>
              <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-base-200 dark:border-slate-700 text-center">
                <span class="block text-[10px] font-bold uppercase tracking-wider text-slate-400">CTA Clicks</span>
                <span class="text-2xl font-black text-primary font-mono mt-1 block">
                  ${this.activePreview?.clicksCount || 0}
                </span>
              </div>
              <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-base-200 dark:border-slate-700 text-center">
                <span class="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Conversion</span>
                <span class="text-2xl font-black text-emerald-500 font-mono mt-1 block">
                  ${this.calculateCtr(this.activePreview)}%
                </span>
              </div>
            </div>

            <!-- Detailed Breakdown -->
            <div class="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-base-200 dark:border-slate-700 space-y-3">
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500">Preview Performance</h4>
              <div class="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div class="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700">
                  <span>Available Excerpt Pages</span>
                  <span class="font-mono font-bold">${(this.activePreview?.pages || []).length} pages</span>
                </div>
                <div class="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700">
                  <span>Average Flips per Visitor</span>
                  <span class="font-mono font-bold">
                    ${this.activePreview?.viewsCount ? (this.activePreview.readsCount / this.activePreview.viewsCount).toFixed(1) : '0.0'}
                  </span>
                </div>
                <div class="flex justify-between items-center py-1">
                  <span>Purchase Redirect URL</span>
                  <span class="font-mono text-primary truncate max-w-[240px]">${this.activePreview?.ctaUrl || '/store'}</span>
                </div>
              </div>
            </div>

            <div class="modal-action">
              <button type="button" id="btn-analytics-ok" class="btn btn-sm btn-primary text-white rounded-xl font-bold px-6 text-xs uppercase">Close</button>
            </div>
          </div>
        </dialog>

        <!-- Two-Page Viewer Modal -->
        <dialog id="modal-viewer" class="modal modal-bottom sm:modal-middle ${this.showViewerModal ? 'modal-open' : ''}">
          <div class="modal-box bg-white dark:bg-slate-900 border border-base-200 dark:border-slate-800 max-w-4xl w-full rounded-3xl p-6 space-y-6">
            <div class="flex items-center justify-between border-b border-base-200 dark:border-slate-800 pb-3">
              <div class="flex items-center gap-3">
                <span class="badge badge-primary font-bold text-[9px] uppercase tracking-wider">Live Viewer</span>
                <h3 class="font-black text-xl text-slate-900 dark:text-white">${this.activePreview?.title || ''}</h3>
              </div>
              <button id="btn-close-viewer" class="btn btn-sm btn-ghost btn-circle">✕</button>
            </div>

            <!-- Two-Page Spread -->
            <div class="relative min-h-[340px] bg-slate-50 dark:bg-slate-950/60 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-inner grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="hidden md:block absolute top-6 bottom-6 left-1/2 -ml-[1px] w-[2px] bg-gradient-to-b from-transparent via-slate-300 dark:via-slate-700 to-transparent"></div>
              
              <div class="flex flex-col justify-between">
                <div class="text-xs text-slate-700 dark:text-slate-200 font-serif leading-relaxed">
                  ${this.formatContent(this.activePreview?.pages?.[this.viewerSpread])}
                </div>
                <div class="text-center font-mono text-[10px] text-slate-400 pt-3">${this.viewerSpread + 1}</div>
              </div>

              <div class="flex flex-col justify-between">
                <div class="text-xs text-slate-700 dark:text-slate-200 font-serif leading-relaxed">
                  ${this.formatContent(this.activePreview?.pages?.[this.viewerSpread + 1])}
                </div>
                <div class="text-center font-mono text-[10px] text-slate-400 pt-3">${this.viewerSpread + 2}</div>
              </div>
            </div>

            <!-- Spread Nav -->
            <div class="flex items-center justify-between pt-2">
              <button id="btn-viewer-prev" class="btn btn-sm btn-outline rounded-xl font-bold text-xs" ${this.viewerSpread === 0 ? 'disabled' : ''}>
                &larr; Previous Page
              </button>
              <span class="text-xs font-mono font-bold text-slate-500">
                Pages ${this.viewerSpread + 1}-${Math.min(this.viewerSpread + 2, this.activePreview?.pages?.length || 0)} of ${this.activePreview?.pages?.length || 0}
              </span>
              <button id="btn-viewer-next" class="btn btn-sm btn-primary text-white rounded-xl font-bold text-xs" ${this.viewerSpread + 2 >= (this.activePreview?.pages?.length || 0) ? 'disabled' : ''}>
                Next Page &rarr;
              </button>
            </div>
          </div>
        </dialog>
      `;

      this.attachEventListeners();
    }

    attachEventListeners() {
      this.querySelector("#btn-new-preview")?.addEventListener("click", () => this.openCreateModal());
      this.querySelector("#btn-empty-create")?.addEventListener("click", () => this.openCreateModal());
      this.querySelector("#btn-close-form")?.addEventListener("click", () => { this.showModal = false; this.render(); });
      this.querySelector("#btn-cancel-form")?.addEventListener("click", () => { this.showModal = false; this.render(); });
      this.querySelector("#btn-close-viewer")?.addEventListener("click", () => { this.showViewerModal = false; this.render(); });

      this.querySelector("#btn-close-analytics")?.addEventListener("click", () => { this.showAnalyticsModal = false; this.render(); });
      this.querySelector("#btn-analytics-ok")?.addEventListener("click", () => { this.showAnalyticsModal = false; this.render(); });

      this.querySelector("#select-extract-count")?.addEventListener("change", (e) => {
        this.extractCount = parseInt(e.target.value, 10) || 2;
      });

      this.querySelector("#file-extract-input")?.addEventListener("change", async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        await this.handleFileExtraction(file);
      });

      this.querySelector("#btn-add-page")?.addEventListener("click", () => {
        this.syncFormFields();
        this.form.pages.push("New excerpt page content...");
        this.render();
      });

      this.querySelectorAll(".btn-remove-page").forEach(b => {
        b.addEventListener("click", (e) => {
          this.syncFormFields();
          const idx = parseInt(e.currentTarget.dataset.idx, 10);
          this.form.pages.splice(idx, 1);
          this.render();
        });
      });

      this.querySelector("#input-product")?.addEventListener("change", (e) => {
        const prod = this.products.find(p => p.id === e.target.value);
        if (prod) {
          this.form.productId = prod.id;
          this.form.title = prod.name;
          if (prod.images && prod.images.length > 0) this.form.coverImage = prod.images[0];
          this.form.ctaUrl = `/store/${prod.slug || prod.id}`;
          this.render();
        }
      });

      this.querySelector("#form-preview")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        this.syncFormFields();
        this.saving = true;
        this.render();
        try {
          const prevId = this.form.id || `prev_${Date.now()}`;
          const item = { ...this.form, id: prevId, updatedAt: new Date().toISOString() };
          await fetch(`${this.apiBase}/data/previews`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: prevId, data: item })
          });
          this.showModal = false;
          await this.loadData();
        } catch (err) {
          console.error("Save preview failed:", err);
        } finally {
          this.saving = false;
          this.render();
        }
      });

      this.querySelectorAll(".btn-stats").forEach(b => {
        b.addEventListener("click", (e) => {
          const id = e.currentTarget.dataset.id;
          const p = this.previews.find(x => x.id === id);
          if (p) {
            this.activePreview = p;
            this.showAnalyticsModal = true;
            this.render();
          }
        });
      });

      this.querySelectorAll(".btn-test").forEach(b => {
        b.addEventListener("click", (e) => {
          const id = e.currentTarget.dataset.id;
          const p = this.previews.find(x => x.id === id);
          if (p) {
            this.activePreview = p;
            this.viewerSpread = 0;
            this.showViewerModal = true;
            this.render();
          }
        });
      });

      this.querySelectorAll(".btn-edit").forEach(b => {
        b.addEventListener("click", (e) => {
          const id = e.currentTarget.dataset.id;
          const p = this.previews.find(x => x.id === id);
          if (p) {
            this.form = JSON.parse(JSON.stringify(p));
            this.extractMsg = "";
            this.showModal = true;
            this.render();
          }
        });
      });

      this.querySelectorAll(".btn-del").forEach(b => {
        b.addEventListener("click", async (e) => {
          if (!confirm("Are you sure you want to delete this preview?")) return;
          const id = e.currentTarget.dataset.id;
          await fetch(`${this.apiBase}/data/previews?key=${id}`, { method: "DELETE" });
          await this.loadData();
        });
      });

      this.querySelector("#btn-viewer-prev")?.addEventListener("click", () => {
        if (this.viewerSpread >= 2) {
          this.viewerSpread -= 2;
          this.render();
        }
      });

      this.querySelector("#btn-viewer-next")?.addEventListener("click", () => {
        if (this.viewerSpread + 2 < (this.activePreview?.pages?.length || 0)) {
          this.viewerSpread += 2;
          this.render();
        }
      });
    }

    async handleFileExtraction(file) {
      this.extracting = true;
      this.extractMsg = "";
      this.render();

      try {
        const text = await this.readBookFileContent(file);
        const pages = this.splitContentIntoPages(text, this.extractCount);

        if (pages.length > 0) {
          this.syncFormFields();
          this.form.pages = pages;
          this.extractMsg = `Extracted ${pages.length} sample pages successfully!`;
        } else {
          this.extractMsg = "Could not extract text chapters from this file.";
        }
      } catch (err) {
        console.error("Extraction failed:", err);
        this.extractMsg = "Extraction error: " + (err.message || "Failed to parse file");
      } finally {
        this.extracting = false;
        this.render();
      }
    }

    async readBookFileContent(file) {
      const ext = (file.name.split('.').pop() || '').toLowerCase();

      if (ext === 'txt' || ext === 'html' || ext === 'htm') {
        const raw = await file.text();
        return raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
      }

      // EPUB is a ZIP archive containing XML and XHTML chapters
      if (ext === 'epub') {
        return await this.extractFromEpubArchive(file);
      }

      const raw = await file.text();
      return raw.replace(/<[^>]*>/g, ' ');
    }

    async extractFromEpubArchive(file) {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Search for HTML/XHTML text stream entries in EPUB ZIP structure
      const textDecoder = new TextDecoder('utf-8', { fatal: false });
      const fullText = textDecoder.decode(bytes);

      // Extract text content from chapter blocks matching <p> tags
      const pMatches = fullText.match(/<p[\s\S]*?<\/p>/gi);
      if (pMatches && pMatches.length > 0) {
        const cleanParagraphs = pMatches
          .map(p => p.replace(/<[^>]*>/g, '').trim())
          .filter(t => t.length > 30 && !t.includes('DOCTYPE') && !t.includes('xmlns'));
        if (cleanParagraphs.length >= 2) {
          return cleanParagraphs.join('\n\n');
        }
      }

      // Fallback: clean raw XML/HTML tags
      const cleaned = fullText
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      return cleaned;
    }

    splitContentIntoPages(text, count) {
      if (!text) return [];
      const paragraphs = text.split(/\n\n+/).map(p => p.trim()).filter(Boolean);

      if (paragraphs.length >= count) {
        const perPage = Math.max(1, Math.floor(paragraphs.length / count));
        const pages = [];
        for (let i = 0; i < count; i++) {
          const chunk = paragraphs.slice(i * perPage, (i + 1) * perPage).join('\n\n');
          if (chunk) pages.push(`Chapter ${i + 1}\n\n${chunk.substring(0, 1500)}`);
        }
        return pages;
      }

      // Chunk by sentence/length if paragraphs are sparse
      const pageSize = 800;
      const pages = [];
      for (let i = 0; i < count; i++) {
        const start = i * pageSize;
        if (start < text.length) {
          pages.push(`Chapter ${i + 1}\n\n${text.substring(start, start + pageSize).trim()}`);
        }
      }
      return pages;
    }

    calculateCtr(preview) {
      if (!preview || !preview.viewsCount || !preview.clicksCount) return "0.0";
      return ((preview.clicksCount / preview.viewsCount) * 100).toFixed(1);
    }

    syncFormFields() {
      const title = this.querySelector("#input-title");
      if (title) this.form.title = title.value;
      const author = this.querySelector("#input-author");
      if (author) this.form.author = author.value;
      const cover = this.querySelector("#input-cover");
      if (cover) this.form.coverImage = cover.value;
      const ctaText = this.querySelector("#input-cta-text");
      if (ctaText) this.form.ctaText = ctaText.value;
      const ctaUrl = this.querySelector("#input-cta-url");
      if (ctaUrl) this.form.ctaUrl = ctaUrl.value;

      this.querySelectorAll(".page-content-input").forEach(tx => {
        const idx = parseInt(tx.dataset.idx, 10);
        this.form.pages[idx] = tx.value;
      });
    }

    openCreateModal() {
      this.form = {
        id: "",
        productId: "",
        title: "",
        author: "",
        coverImage: "",
        pages: [
          "Chapter 1\n\nThe quiet dawn illuminated the forgotten library halls. Endless shelves held ancient knowledge waiting to be uncovered...",
          "Chapter 1 (Continued)\n\nSecrets carved into parchment whispered in the silence. The journey of thousands of miles begins with a single turn of the page..."
        ],
        ctaText: "Buy Full Book",
        ctaUrl: "/store"
      };
      this.extractMsg = "";
      this.showModal = true;
      this.render();
    }

    formatContent(text) {
      if (!text) return '<p class="text-slate-400 italic">No content on this page.</p>';
      return text.replace(/\n\n/g, '</p><p class="mb-3">').replace(/\n/g, '<br/>');
    }
  }

  if (typeof customElements !== "undefined" && !customElements.get("ext-ebook-previews")) {
    customElements.define("ext-ebook-previews", ExtEbookPreviews);
  }
})();

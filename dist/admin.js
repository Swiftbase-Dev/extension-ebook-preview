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
      this.extractCount = 4;
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
                    <label class="text-[10px] font-bold text-slate-400">Sample Pages:</label>
                    <select id="select-extract-count" class="select select-bordered select-xs rounded-lg dark:bg-slate-800">
                      <option value="2" ${this.extractCount === 2 ? 'selected' : ''}>2 pages</option>
                      <option value="4" ${this.extractCount === 4 ? 'selected' : ''}>4 pages</option>
                      <option value="6" ${this.extractCount === 6 ? 'selected' : ''}>6 pages</option>
                      <option value="8" ${this.extractCount === 8 ? 'selected' : ''}>8 pages</option>
                      <option value="10" ${this.extractCount === 10 ? 'selected' : ''}>10 pages</option>
                      <option value="12" ${this.extractCount === 12 ? 'selected' : ''}>12 pages</option>
                      <option value="16" ${this.extractCount === 16 ? 'selected' : ''}>16 pages</option>
                      <option value="20" ${this.extractCount === 20 ? 'selected' : ''}>20 pages</option>
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

    async loadEpubDependencies() {
      // Load JSZip then ePub.js from CDN if not already loaded in window
      if (!window.JSZip) {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
          s.onload = () => resolve();
          s.onerror = (e) => reject(new Error("Failed to load JSZip dependency"));
          document.head.appendChild(s);
        });
      }

      if (!window.ePub) {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://cdn.jsdelivr.net/npm/epubjs/dist/epub.min.js";
          s.onload = () => resolve();
          s.onerror = (e) => reject(new Error("Failed to load ePub.js engine"));
          document.head.appendChild(s);
        });
      }
    }

    async handleFileExtraction(file) {
      this.extracting = true;
      this.extractMsg = "Analyzing book structure...";
      this.render();

      try {
        const ext = (file.name.split('.').pop() || '').toLowerCase();
        const targetPages = parseInt(this.extractCount, 10) || 4;

        if (ext === 'epub') {
          await this.loadEpubDependencies();
          const arrayBuffer = await file.arrayBuffer();
          const zip = await window.JSZip.loadAsync(arrayBuffer);
          const book = window.ePub(arrayBuffer);
          await book.opened;

          // 1. Automatically populate metadata from EPUB package
          try {
            const meta = await book.loaded.metadata;
            if (meta) {
              if (meta.title && !this.form.title) this.form.title = meta.title;
              if (meta.creator && !this.form.author) this.form.author = meta.creator;
            }
            const coverUrl = await book.coverUrl();
            if (coverUrl && !this.form.coverImage) {
              this.form.coverImage = coverUrl;
            }
          } catch (mErr) {
            console.debug("Non-critical metadata reading error:", mErr);
          }

          // Build zip image resolver map for resolving relative <img> tags to base64 data URIs
          const imageMap = {};
          const imageFiles = Object.keys(zip.files).filter(p => /\.(png|jpe?g|gif|svg|webp)$/i.test(p));
          for (const imgPath of imageFiles) {
            const baseName = imgPath.split('/').pop().toLowerCase();
            imageMap[imgPath] = imgPath;
            imageMap[baseName] = imgPath;
          }

          const resolveImageDataUri = async (rawSrc, currentDocPath) => {
            if (!rawSrc || rawSrc.startsWith('data:') || rawSrc.startsWith('http')) return rawSrc;
            try {
              // Normalize relative path
              let clean = rawSrc.replace(/^(\.\.\/)+/, '').replace(/^\.\//, '');
              let zipPath = imageMap[clean] || imageMap[clean.toLowerCase()] || imageMap[clean.split('/').pop().toLowerCase()];
              if (!zipPath && currentDocPath) {
                const docDir = currentDocPath.split('/').slice(0, -1).join('/');
                const candidate = docDir ? `${docDir}/${clean}` : clean;
                zipPath = imageMap[candidate] || imageMap[candidate.toLowerCase()];
              }
              if (zipPath && zip.files[zipPath]) {
                const mime = zipPath.endsWith('.png') ? 'image/png'
                  : zipPath.endsWith('.gif') ? 'image/gif'
                  : zipPath.endsWith('.svg') ? 'image/svg+xml'
                  : zipPath.endsWith('.webp') ? 'image/webp'
                  : 'image/jpeg';
                const base64 = await zip.files[zipPath].async("base64");
                return `data:${mime};base64,${base64}`;
              }
            } catch (err) {
              console.warn("Failed to resolve EPUB image data URI:", err);
            }
            return rawSrc;
          };

          // 2. Extract structured content from spine items
          const spine = await book.loaded.spine;
          const spineItems = (spine && spine.spineItems) || [];
          const collectedBlocks = [];

          for (const item of spineItems) {
            if (collectedBlocks.length >= targetPages * 12) break;
            const href = (item.href || '').toLowerCase();
            if (/cover|nav|toc/i.test(href)) continue;

            try {
              await item.load(book.load.bind(book));
              const doc = item.document;
              if (doc) {
                // Find and convert image sources to data URIs
                const imgs = Array.from(doc.querySelectorAll('img, image'));
                for (const img of imgs) {
                  const srcAttr = img.getAttribute('src') || img.getAttribute('xlink:href') || '';
                  if (srcAttr) {
                    const dataUri = await resolveImageDataUri(srcAttr, item.href);
                    if (dataUri) img.setAttribute('src', dataUri);
                  }
                }

                // Extract all relevant content elements in DOM order
                const elements = Array.from(doc.body.querySelectorAll('h1, h2, h3, h4, h5, h6, p, hr, blockquote, figure, img, .section-break, .break, .page-number, .header, .footer'));
                for (const el of elements) {
                  // Skip nested elements if their parent was already captured
                  if (el.parentElement && ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'FIGURE'].includes(el.parentElement.tagName)) {
                    continue;
                  }
                  const text = el.textContent.trim();
                  const tag = el.tagName.toLowerCase();
                  if (tag === 'hr' || tag === 'img') {
                    collectedBlocks.push(el.outerHTML);
                  } else if (text.length > 0 && !/copyright|all rights reserved/i.test(text)) {
                    collectedBlocks.push(el.outerHTML);
                  }
                }
              }
              item.unload();
            } catch (itemErr) {
              console.warn("Spine item load error:", itemErr);
            }
          }

          // Fallback if spine was empty
          if (collectedBlocks.length === 0) {
            const xhtmlFiles = Object.keys(zip.files).filter(k => /\.(xhtml|html|htm)$/i.test(k) && !/toc|nav/i.test(k));
            for (const xf of xhtmlFiles.slice(0, 10)) {
              if (collectedBlocks.length >= targetPages * 12) break;
              const htmlStr = await zip.files[xf].async("text");
              const parser = new DOMParser();
              const doc = parser.parseFromString(htmlStr, "text/html");
              const imgs = Array.from(doc.querySelectorAll('img'));
              for (const img of imgs) {
                const srcAttr = img.getAttribute('src') || '';
                if (srcAttr) {
                  const dataUri = await resolveImageDataUri(srcAttr, xf);
                  if (dataUri) img.setAttribute('src', dataUri);
                }
              }
              const elements = Array.from(doc.body ? doc.body.querySelectorAll('h1, h2, h3, h4, p, hr, blockquote, img') : []);
              for (const el of elements) {
                if (el.parentElement && ['P', 'H1', 'H2', 'H3', 'H4', 'BLOCKQUOTE'].includes(el.parentElement.tagName)) continue;
                const text = el.textContent.trim();
                const tag = el.tagName.toLowerCase();
                if (tag === 'hr' || tag === 'img' || (text.length > 0 && !/copyright|all rights reserved/i.test(text))) {
                  collectedBlocks.push(el.outerHTML);
                }
              }
            }
          }

          const pages = this.paginateBlocks(collectedBlocks, targetPages);
          if (pages.length > 0) {
            this.syncFormFields();
            this.form.pages = pages;
            this.extractMsg = `Extracted ${pages.length} sample pages from ${file.name}!`;
          } else {
            this.extractMsg = "Could not extract readable pages from this EPUB.";
          }
        } else if (ext === 'txt' || ext === 'html' || ext === 'htm') {
          const raw = await file.text();
          let blocks = [];
          if (ext === 'txt') {
            blocks = raw.split(/\n\n+/).map(p => p.trim()).filter(Boolean).map(p => `<p>${this.escapeHtml(p)}</p>`);
          } else {
            const parser = new DOMParser();
            const doc = parser.parseFromString(raw, "text/html");
            const elements = Array.from(doc.body ? doc.body.querySelectorAll('h1, h2, h3, h4, p, hr, blockquote, img') : []);
            blocks = elements.map(el => el.outerHTML);
          }
          const pages = this.paginateBlocks(blocks, targetPages);
          if (pages.length > 0) {
            this.syncFormFields();
            this.form.pages = pages;
            this.extractMsg = `Extracted ${pages.length} sample pages successfully!`;
          }
        } else {
          this.extractMsg = "Unsupported file type. Please upload .epub, .txt, or .html";
        }
      } catch (err) {
        console.error("Extraction failed:", err);
        this.extractMsg = "Extraction error: " + (err.message || "Failed to parse file");
      } finally {
        this.extracting = false;
        this.render();
      }
    }

    paginateBlocks(blocks, targetPageCount) {
      if (!blocks || blocks.length === 0) return [];
      const pages = [];
      let currentPageHtml = [];
      let currentWordCount = 0;
      const targetWordsPerPage = 270; // Natural book page density

      for (let i = 0; i < blocks.length; i++) {
        if (pages.length >= targetPageCount) break;

        const block = blocks[i];
        // Estimate word count from text inside HTML
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = block;
        const text = tempDiv.textContent || "";
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const isHeader = /^<h[1-4]/i.test(block);
        const isSectionBreak = /^<hr/i.test(block) || /section-break|separator/i.test(block);

        // If block is a major header (e.g. Chapter header) and current page already has substantial text, start fresh page
        if (isHeader && currentWordCount > 100 && currentPageHtml.length > 0) {
          pages.push(currentPageHtml.join("\n\n"));
          currentPageHtml = [block];
          currentWordCount = words;
          if (pages.length >= targetPageCount) break;
          continue;
        }

        // If adding this block exceeds page target words, push page if we have content
        if (currentWordCount + words > targetWordsPerPage && currentPageHtml.length > 0) {
          // If current block is section break, keep it on previous or new page cleanly
          if (isSectionBreak) {
            currentPageHtml.push(block);
            pages.push(currentPageHtml.join("\n\n"));
            currentPageHtml = [];
            currentWordCount = 0;
          } else {
            pages.push(currentPageHtml.join("\n\n"));
            currentPageHtml = [block];
            currentWordCount = words;
          }
          if (pages.length >= targetPageCount) break;
          continue;
        }

        currentPageHtml.push(block);
        currentWordCount += words;
      }

      if (currentPageHtml.length > 0 && pages.length < targetPageCount) {
        pages.push(currentPageHtml.join("\n\n"));
      }

      // If we don't have enough pages, split oversized pages or return what we have
      return pages.slice(0, targetPageCount);
    }

    escapeHtml(str) {
      return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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

    formatContent(content) {
      if (!content) return '<p class="text-slate-400 italic">No content on this page.</p>';
      const isHtml = /<[a-z][\s\S]*>/i.test(content);
      if (isHtml) {
        // Remove potentially unsafe script or iframe tags
        let safe = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                          .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
                          .replace(/\son\w+="[^"]*"/gi, '')
                          .replace(/\son\w+='[^']*'/gi, '');
        return safe;
      }
      return content.replace(/\n\n/g, '</p><p class="mb-3">').replace(/\n/g, '<br/>');
    }
  }

  if (typeof customElements !== "undefined") {
    if (!customElements.get("ext-ebook-previews-v2")) {
      customElements.define("ext-ebook-previews-v2", ExtEbookPreviews);
    }
    if (!customElements.get("ext-ebook-previews")) {
      try {
        customElements.define("ext-ebook-previews", class extends ExtEbookPreviews {});
      } catch (e) {}
    }
  }
})();

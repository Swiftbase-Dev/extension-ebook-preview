/**
 * Standalone Web Component for E-book Two-Page Spread Reader Widget
 * <ext-ebook-preview>
 */
(function() {
  class ExtEbookPreviewWidget extends HTMLElement {
    constructor() {
      super();
      this.currentSpread = 0;
      this.fontSize = 14;
      this.isDark = false;
      this.pages = [];
      this.viewTracked = false;
    }

    get apiBase() {
      return this._apiBase || "/api/extensions/ebook-preview";
    }

    set apiBase(val) {
      this._apiBase = val;
    }

    connectedCallback() {
      this.initData();
      this.render();
      this.trackEvent("view");
    }

    static get observedAttributes() {
      return ['data-preview-id', 'data-book-title', 'data-author', 'data-cover-image', 'data-cta-text', 'data-cta-url', 'data-pages'];
    }

    attributeChangedCallback(name) {
      if (name === 'data-preview-id') {
        this.loadPreviewById();
      } else {
        this.initData();
        this.render();
      }
    }

    async loadPreviewById() {
      const prevId = this.getAttribute('data-preview-id');
      if (!prevId) return;
      try {
        const res = await fetch(`${this.apiBase}/data/previews?key=${encodeURIComponent(prevId)}`);
        if (res.ok) {
          const rec = await res.json();
          const data = (rec && rec.data) ? rec.data : (Array.isArray(rec) && rec[0] ? (rec[0].data || rec[0]) : rec);
          if (data) {
            if (data.title) this.setAttribute('data-book-title', data.title);
            if (data.author) this.setAttribute('data-author', data.author);
            if (data.coverImage) this.setAttribute('data-cover-image', data.coverImage);
            if (data.ctaText) this.setAttribute('data-cta-text', data.ctaText);
            if (data.ctaUrl) this.setAttribute('data-cta-url', data.ctaUrl);
            if (Array.isArray(data.pages)) {
              this.pages = data.pages;
              this.render();
            }
          }
        }
      } catch (err) {
        console.warn("Failed to load preview by ID:", err);
      }
    }

    async trackEvent(type) {
      const prevId = this.getAttribute('data-preview-id');
      if (!prevId) return;
      if (type === 'view') {
        if (this.viewTracked) return;
        this.viewTracked = true;
      }
      try {
        const res = await fetch(`${this.apiBase}/data/previews?key=${encodeURIComponent(prevId)}`);
        if (!res.ok) return;
        const rec = await res.json();
        const data = (rec && rec.data) ? rec.data : (Array.isArray(rec) && rec[0] ? (rec[0].data || rec[0]) : rec);
        if (!data) return;

        if (type === 'view') data.viewsCount = (data.viewsCount || 0) + 1;
        if (type === 'flip') data.readsCount = (data.readsCount || 0) + 1;
        if (type === 'click') data.clicksCount = (data.clicksCount || 0) + 1;

        await fetch(`${this.apiBase}/data/previews`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: prevId, data })
        });
      } catch (err) {
        // Non-blocking telemetry
      }
    }

    initData() {
      const rawPages = this.getAttribute('data-pages');
      if (rawPages) {
        try {
          this.pages = JSON.parse(decodeURIComponent(rawPages));
        } catch {
          this.pages = rawPages.split('---PAGE---');
        }
      }
      if (!this.pages || this.pages.length === 0) {
        this.pages = [
          "Chapter 1: The Beginning\n\nThe quiet dawn illuminated the forgotten library halls. Endless shelves held ancient knowledge waiting to be uncovered by those brave enough to seek the truth.",
          "Chapter 1 (Continued)\n\nSecrets carved into weathered parchment whispered in the morning silence. Every shadow held memories of forgotten empires and untold wonders."
        ];
      }
    }

    render() {
      const title = this.getAttribute('data-book-title') || 'Sample Book Title';
      const author = this.getAttribute('data-author') || 'Author Name';
      const coverImage = this.getAttribute('data-cover-image') || '';
      const ctaText = this.getAttribute('data-cta-text') || 'Buy Full Book';
      const ctaUrl = this.getAttribute('data-cta-url') || '/store';
      const totalPages = this.pages.length;

      const p1 = this.pages[this.currentSpread] || '';
      const p2 = this.pages[this.currentSpread + 1] || '';

      this.innerHTML = `
        <div style="
          max-width: 56rem;
          margin: 2rem auto;
          padding: 1.5rem;
          background: ${this.isDark ? '#0f172a' : '#ffffff'};
          color: ${this.isDark ? '#f8fafc' : '#1e293b'};
          border: 1px solid ${this.isDark ? '#1e293b' : '#e2e8f0'};
          border-radius: 1.5rem;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
          font-family: ui-sans-serif, system-ui, sans-serif;
          transition: all 0.2s ease;
        ">
          <!-- Header Bar -->
          <div style="display: flex; flex-direction: row; gap: 1.25rem; align-items: flex-start; padding-bottom: 1.25rem; border-bottom: 1px solid ${this.isDark ? '#1e293b' : '#f1f5f9'};">
            <div style="width: 4rem; height: 6rem; border-radius: 0.75rem; overflow: hidden; background: #e2e8f0; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
              ${coverImage ? `<img src="${coverImage}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover;" />` : `<span style="font-size: 1.5rem; opacity: 0.4;">📖</span>`}
            </div>

            <div style="flex: 1;">
              <span style="display: inline-block; background: rgba(2, 132, 199, 0.1); color: #0284c7; font-size: 0.65rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.2rem 0.6rem; border-radius: 0.375rem; margin-bottom: 0.35rem;">
                Sample Preview
              </span>
              <h3 style="margin: 0; font-size: 1.25rem; font-weight: 900; color: ${this.isDark ? '#ffffff' : '#0f172a'}; line-height: 1.2;">${title}</h3>
              <p style="margin: 0.25rem 0 0 0; font-size: 0.8rem; color: ${this.isDark ? '#94a3b8' : '#64748b'};">by ${author}</p>

              <!-- Controls -->
              <div style="display: flex; gap: 0.4rem; margin-top: 0.75rem; align-items: center;">
                <button type="button" class="btn-zoom-out" style="padding: 0.2rem 0.5rem; border-radius: 0.5rem; border: 1px solid ${this.isDark ? '#334155' : '#cbd5e1'}; background: ${this.isDark ? '#1e293b' : '#f8fafc'}; color: ${this.isDark ? '#fff' : '#334155'}; font-size: 0.75rem; font-weight: 700; cursor: pointer;">A-</button>
                <button type="button" class="btn-zoom-in" style="padding: 0.2rem 0.5rem; border-radius: 0.5rem; border: 1px solid ${this.isDark ? '#334155' : '#cbd5e1'}; background: ${this.isDark ? '#1e293b' : '#f8fafc'}; color: ${this.isDark ? '#fff' : '#334155'}; font-size: 0.75rem; font-weight: 700; cursor: pointer;">A+</button>
                <button type="button" class="btn-theme" style="padding: 0.2rem 0.6rem; border-radius: 0.5rem; border: 1px solid ${this.isDark ? '#334155' : '#cbd5e1'}; background: ${this.isDark ? '#1e293b' : '#f8fafc'}; color: ${this.isDark ? '#fff' : '#334155'}; font-size: 0.75rem; font-weight: 700; cursor: pointer;">🌓 Theme</button>
              </div>
            </div>

            <div style="flex-shrink: 0;">
              <a href="${ctaUrl}" class="btn-preview-cta" style="display: inline-block; background: #0284c7; color: white; padding: 0.5rem 1rem; border-radius: 0.75rem; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; text-decoration: none; box-shadow: 0 4px 6px rgba(2, 132, 199, 0.2);">
                ${ctaText} &rarr;
              </a>
            </div>
          </div>

          <!-- Two-Page Spread Reader Canvas -->
          <div style="
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.5rem;
            position: relative;
            background: ${this.isDark ? '#020617' : '#f8fafc'};
            padding: 1.5rem;
            border-radius: 1rem;
            margin: 1.25rem 0;
            min-height: 200px;
            border: 1px solid ${this.isDark ? '#1e293b' : '#e2e8f0'};
          ">
            <!-- Spine Divider -->
            <div style="position: absolute; top: 1rem; bottom: 1rem; left: 50%; width: 1px; background: ${this.isDark ? '#1e293b' : '#cbd5e1'};"></div>

            <!-- Left Page -->
            <div style="display: flex; flex-direction: column; justify-content: space-between;">
              <div style="font-family: Georgia, serif; font-size: ${this.fontSize}px; line-height: 1.7; color: ${this.isDark ? '#cbd5e1' : '#334155'};">
                ${this.formatText(p1)}
              </div>
              <div style="text-align: center; font-size: 0.65rem; color: #94a3b8; font-family: monospace; padding-top: 1rem;">
                Page ${this.currentSpread + 1}
              </div>
            </div>

            <!-- Right Page -->
            <div style="display: flex; flex-direction: column; justify-content: space-between;">
              <div style="font-family: Georgia, serif; font-size: ${this.fontSize}px; line-height: 1.7; color: ${this.isDark ? '#cbd5e1' : '#334155'};">
                ${this.formatText(p2)}
              </div>
              <div style="text-align: center; font-size: 0.65rem; color: #94a3b8; font-family: monospace; padding-top: 1rem;">
                Page ${Math.min(this.currentSpread + 2, totalPages)}
              </div>
            </div>
          </div>

          <!-- Footer / Spread Nav -->
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: #94a3b8; padding-top: 0.5rem;">
            <button type="button" class="btn-prev-page" style="padding: 0.3rem 0.8rem; border-radius: 0.5rem; border: 1px solid ${this.isDark ? '#334155' : '#cbd5e1'}; background: transparent; color: ${this.isDark ? '#fff' : '#334155'}; cursor: pointer;" ${this.currentSpread === 0 ? 'disabled' : ''}>
              &larr; Previous
            </button>
            <span style="font-family: monospace; font-weight: 700;">
              Pages ${this.currentSpread + 1}-${Math.min(this.currentSpread + 2, totalPages)} of ${totalPages}
            </span>
            <button type="button" class="btn-next-page" style="padding: 0.3rem 0.8rem; border-radius: 0.5rem; border: none; background: #0284c7; color: white; font-weight: 700; cursor: pointer;" ${this.currentSpread + 2 >= totalPages ? 'disabled' : ''}>
              Next &rarr;
            </button>
          </div>
        </div>
      `;

      this.querySelector('.btn-preview-cta')?.addEventListener('click', () => {
        this.trackEvent('click');
      });

      this.querySelector('.btn-zoom-out')?.addEventListener('click', () => {
        if (this.fontSize > 11) {
          this.fontSize -= 1;
          this.render();
        }
      });

      this.querySelector('.btn-zoom-in')?.addEventListener('click', () => {
        if (this.fontSize < 22) {
          this.fontSize += 1;
          this.render();
        }
      });

      this.querySelector('.btn-theme')?.addEventListener('click', () => {
        this.isDark = !this.isDark;
        this.render();
      });

      this.querySelector('.btn-prev-page')?.addEventListener('click', () => {
        if (this.currentSpread >= 2) {
          this.currentSpread -= 2;
          this.render();
        }
      });

      this.querySelector('.btn-next-page')?.addEventListener('click', () => {
        if (this.currentSpread + 2 < this.pages.length) {
          this.trackEvent('flip');
          this.currentSpread += 2;
          this.render();
        }
      });
    }

    formatText(str) {
      if (!str) return '<p style="color: #94a3b8; font-style: italic;">(End of excerpt)</p>';
      const isHtml = /<[a-z][\s\S]*>/i.test(str);
      if (isHtml) {
        let safe = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
                      .replace(/\son\w+="[^"]*"/gi, '')
                      .replace(/\son\w+='[^']*'/gi, '');

        // Enhance styling of common book elements
        safe = safe.replace(/<h([1-6])([^>]*)>/gi, (match, level, rest) => {
          const size = level === '1' ? '1.35rem' : level === '2' ? '1.2rem' : '1.05rem';
          return `<h${level} style="font-family: inherit; font-size: ${size}; font-weight: 800; text-align: center; margin: 0.5rem 0 1rem 0; line-height: 1.3;"${rest}>`;
        });

        safe = safe.replace(/<hr([^>]*)>/gi, '<hr style="border: none; border-top: 1px solid rgba(148, 163, 184, 0.4); margin: 1.25rem auto; width: 60%; text-align: center;"$1/>');

        safe = safe.replace(/<img([^>]*?)(\/?>)/gi, (m, attrs) => {
          return `<img style="max-width: 100%; height: auto; border-radius: 0.5rem; display: block; margin: 0.75rem auto;" ${attrs} />`;
        });

        safe = safe.replace(/<blockquote([^>]*)>/gi, '<blockquote style="border-left: 3px solid #0284c7; padding-left: 0.75rem; margin: 0.75rem 0; font-style: italic;"$1>');

        safe = safe.replace(/<p([^>]*)>/gi, '<p style="margin-bottom: 0.75rem; text-indent: 1em; line-height: 1.7;"$1>');

        return safe;
      }
      return str.replace(/\n\n/g, '</p><p style="margin-bottom: 0.75rem; text-indent: 1em; line-height: 1.7;">').replace(/\n/g, '<br/>');
    }
  }

  if (typeof customElements !== 'undefined' && !customElements.get('ext-ebook-preview')) {
    customElements.define('ext-ebook-preview', ExtEbookPreviewWidget);
  }
})();

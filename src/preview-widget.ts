/**
 * E-book Sample Preview Widget Web Component
 * Standalone client script for embedding interactive book excerpts on any page.
 */
(function() {
  class CmsEbookPreviewWidget extends HTMLElement {
    private currentSize: number = 16;
    private isDark: boolean = false;

    connectedCallback() {
      this.render();
    }

    render() {
      const title = this.getAttribute('data-book-title') || 'Sample Book Preview';
      const author = this.getAttribute('data-author') || 'Author';
      const coverImage = this.getAttribute('data-cover-image') || '';
      const storeLink = this.getAttribute('data-store-link') || '/store';
      const rawExcerpt = this.getAttribute('data-sample-content') || this.innerHTML.trim() || 'Welcome to this excerpt preview. Enjoy reading the first chapter.';
      
      let excerpt = rawExcerpt;
      try {
        excerpt = decodeURIComponent(rawExcerpt.replace(/&quot;/g, '"'));
      } catch (e) {
        excerpt = rawExcerpt;
      }

      this.innerHTML = `
        <div class="cms-ebook-preview-container" style="
          max-width: 48rem;
          margin: 2rem auto;
          padding: 2rem;
          background: ${this.isDark ? '#0f172a' : '#ffffff'};
          color: ${this.isDark ? '#f8fafc' : '#1e293b'};
          border: 1px solid ${this.isDark ? '#1e293b' : '#e2e8f0'};
          border-radius: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          font-family: inherit;
          transition: all 0.2s ease;
        ">
          <!-- Header Area -->
          <div style="display: flex; flex-direction: row; gap: 1.5rem; align-items: flex-start; border-bottom: 1px solid ${this.isDark ? '#1e293b' : '#f1f5f9'}; padding-bottom: 1.5rem;">
            ${coverImage ? `
              <div style="width: 5rem; height: 7.5rem; flex-shrink: 0; border-radius: 0.75rem; overflow: hidden; background: #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <img src="${coverImage}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover;" />
              </div>
            ` : `
              <div style="width: 5rem; height: 7.5rem; flex-shrink: 0; border-radius: 0.75rem; background: #0284c7; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: 800; font-size: 0.65rem; text-transform: uppercase;">
                Sample
              </div>
            `}

            <div style="flex: 1;">
              <span style="display: inline-block; background: rgba(2, 132, 199, 0.1); color: #0284c7; font-size: 0.65rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.2rem 0.6rem; border-radius: 0.375rem; margin-bottom: 0.5rem;">
                Sample Excerpt
              </span>
              <h3 style="margin: 0; font-size: 1.35rem; font-weight: 900; line-height: 1.25; color: ${this.isDark ? '#ffffff' : '#0f172a'};">${title}</h3>
              <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: ${this.isDark ? '#94a3b8' : '#64748b'};">by ${author}</p>
              
              <!-- Controls -->
              <div style="display: flex; gap: 0.5rem; margin-top: 1rem; align-items: center;">
                <button type="button" class="btn-zoom-out" style="padding: 0.25rem 0.6rem; border-radius: 0.5rem; border: 1px solid #cbd5e1; background: ${this.isDark ? '#1e293b' : '#f8fafc'}; color: ${this.isDark ? '#fff' : '#334155'}; font-size: 0.75rem; font-weight: 700; cursor: pointer;">A-</button>
                <button type="button" class="btn-zoom-in" style="padding: 0.25rem 0.6rem; border-radius: 0.5rem; border: 1px solid #cbd5e1; background: ${this.isDark ? '#1e293b' : '#f8fafc'}; color: ${this.isDark ? '#fff' : '#334155'}; font-size: 0.75rem; font-weight: 700; cursor: pointer;">A+</button>
                <button type="button" class="btn-theme" style="padding: 0.25rem 0.75rem; border-radius: 0.5rem; border: 1px solid #cbd5e1; background: ${this.isDark ? '#1e293b' : '#f8fafc'}; color: ${this.isDark ? '#fff' : '#334155'}; font-size: 0.75rem; font-weight: 700; cursor: pointer;">🌓 Theme</button>
              </div>
            </div>

            ${storeLink ? `
              <div style="flex-shrink: 0;">
                <a href="${storeLink}" style="display: inline-block; background: #0284c7; color: white; padding: 0.6rem 1.2rem; border-radius: 0.75rem; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; text-decoration: none; box-shadow: 0 4px 6px rgba(2, 132, 199, 0.2);">
                  Buy Full Book &rarr;
                </a>
              </div>
            ` : ''}
          </div>

          <!-- Reading Body Excerpt -->
          <div class="excerpt-viewport" style="
            font-family: Georgia, Cambria, 'Times New Roman', Times, serif;
            font-size: ${this.currentSize}px;
            line-height: 1.8;
            padding: 1.5rem 0;
            color: ${this.isDark ? '#cbd5e1' : '#334155'};
          ">
            ${excerpt.replace(/\\n\\n/g, '</p><p style=\"margin-bottom: 1rem;\">').replace(/\\n/g, '<br/>')}
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid ${this.isDark ? '#1e293b' : '#f1f5f9'}; padding-top: 1rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: #94a3b8;">
            <span>End of Preview</span>
            <span>Powered by Swiftbase Extensions</span>
          </div>
        </div>
      `;

      this.querySelector('.btn-zoom-out')?.addEventListener('click', () => {
        if (this.currentSize > 12) {
          this.currentSize -= 2;
          this.render();
        }
      });

      this.querySelector('.btn-zoom-in')?.addEventListener('click', () => {
        if (this.currentSize < 28) {
          this.currentSize += 2;
          this.render();
        }
      });

      this.querySelector('.btn-theme')?.addEventListener('click', () => {
        this.isDark = !this.isDark;
        this.render();
      });
    }
  }

  if (typeof customElements !== 'undefined' && !customElements.get('cms-ebook-preview-widget')) {
    customElements.define('cms-ebook-preview-widget', CmsEbookPreviewWidget);
  }
})();

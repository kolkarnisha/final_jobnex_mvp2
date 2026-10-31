/**
 * KeywordAnalysis Component
 * Displays matched and missing keywords between the target JD and candidate resume.
 * Features live keyword filtering, copy-to-clipboard, and match statistics.
 */
(function () {
  'use strict';

  class KeywordAnalysis {
    constructor(container, options = {}) {
      this.container = typeof container === 'string' ? document.querySelector(container) : container;
      this.options = Object.assign({
        matchedKeywords: [],
        missingKeywords: []
      }, options);

      this.filterText = '';
      this.render();
    }

    setKeywords(matched, missing) {
      this.options.matchedKeywords = matched || [];
      this.options.missingKeywords = missing || [];
      this.render();
    }

    render() {
      if (!this.container) return;

      const matched = this.options.matchedKeywords || [];
      const missing = this.options.missingKeywords || [];
      const total = matched.length + missing.length;
      const matchPct = total ? Math.round((matched.length / total) * 100) : 0;

      const filterLower = this.filterText.toLowerCase().trim();
      const filteredMatched = filterLower ? matched.filter(k => k.toLowerCase().includes(filterLower)) : matched;
      const filteredMissing = filterLower ? missing.filter(k => k.toLowerCase().includes(filterLower)) : missing;

      const escape = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

      this.container.innerHTML = `
        <div class="card" id="kw-analysis-root">
          <div class="card-header" style="flex-wrap: wrap; gap: 12px;">
            <div>
              <h3 style="margin: 0; font-size: 1.15rem; display: flex; align-items: center; gap: 8px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                Keyword Match Analysis
              </h3>
              <p class="text-sm text-muted" style="margin: 2px 0 0;">
                Comparing exact terminology extracted from the job description against candidate resume.
              </p>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <span class="badge badge-neutral">${matched.length} of ${total} Matched (${matchPct}%)</span>
            </div>
          </div>

          <!-- Keyword Filter Bar -->
          <div style="margin-bottom: 16px;">
            <input
              type="search"
              id="kw-search-input"
              placeholder="Filter keywords…"
              value="${escape(this.filterText)}"
              style="width: 100%; max-width: 320px; font-size: 0.875rem; padding: 8px 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color);"
            >
          </div>

          <!-- Matched vs Missing Grid -->
          <div class="grid-2">
            <!-- Matched Keywords -->
            <div style="background: var(--surface-muted); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px;">
              <h4 style="margin: 0 0 10px; font-size: 0.9375rem; color: #065F46; display: flex; align-items: center; justify-content: space-between;">
                <span style="display: flex; align-items: center; gap: 6px;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Matched Keywords
                </span>
                <span class="badge" style="background: #D1FAE5; color: #065F46; font-size: 0.75rem;">${matched.length}</span>
              </h4>
              <div class="jd-tag-cloud" id="matched-kw-list">
                ${filteredMatched.length > 0
                  ? filteredMatched.map(kw => `
                      <span class="matched-pill" title="Present in your resume">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        ${escape(kw)}
                      </span>
                    `).join('')
                  : `<span class="text-sm text-muted">${matched.length === 0 ? 'No exact keyword matches found.' : 'No matched keywords match search.'}</span>`
                }
              </div>
            </div>

            <!-- Missing Keywords -->
            <div style="background: var(--surface-muted); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px;">
              <h4 style="margin: 0 0 10px; font-size: 0.9375rem; color: #9A3412; display: flex; align-items: center; justify-content: space-between;">
                <span style="display: flex; align-items: center; gap: 6px;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Missing Keywords
                </span>
                <span class="badge" style="background: #FEF3C7; color: #9A3412; font-size: 0.75rem;">${missing.length}</span>
              </h4>
              <div class="jd-tag-cloud" id="missing-kw-list">
                ${filteredMissing.length > 0
                  ? filteredMissing.map(kw => `
                      <button
                        type="button"
                        class="missing-pill"
                        data-copy-kw="${escape(kw)}"
                        title="Click to copy '${escape(kw)}' for your resume"
                        style="cursor: pointer; font-family: inherit; border: 1px solid #FDE68A;"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        ${escape(kw)}
                        <span style="font-size: 0.7rem; opacity: 0.7;">+</span>
                      </button>
                    `).join('')
                  : `<span class="text-sm text-muted">${missing.length === 0 ? 'All key keywords found in your resume!' : 'No missing keywords match search.'}</span>`
                }
              </div>
            </div>
          </div>
        </div>
      `;

      this.bindEvents();
    }

    bindEvents() {
      const root = this.container.querySelector('#kw-analysis-root');
      if (!root) return;

      const searchInput = root.querySelector('#kw-search-input');
      if (searchInput) {
        searchInput.addEventListener('input', e => {
          this.filterText = e.target.value;
          this.render();
          const newSearch = this.container.querySelector('#kw-search-input');
          if (newSearch) {
            newSearch.focus();
            newSearch.setSelectionRange(newSearch.value.length, newSearch.value.length);
          }
        });
      }

      root.querySelectorAll('[data-copy-kw]').forEach(btn => {
        btn.addEventListener('click', () => {
          const kw = btn.dataset.copyKw;
          navigator.clipboard.writeText(kw).then(() => {
            if (window.JOBNEX && window.JOBNEX.showToast) {
              window.JOBNEX.showToast(`Copied "${kw}" to clipboard`, 'info');
            }
          });
        });
      });
    }
  }

  window.KeywordAnalysis = KeywordAnalysis;
})();

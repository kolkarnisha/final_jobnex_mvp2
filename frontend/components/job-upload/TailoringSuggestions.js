/**
 * TailoringSuggestions Component
 * Categorized Resume Tailoring Recommendations & Improvement Priority Meter:
 * - Content Improvements
 * - Skill Improvements
 * - Experience Improvements
 * - ATS Optimization Tips
 * Includes Improvement Priority Meter (High, Medium, Low Priority) with score impact simulation.
 */
(function () {
  'use strict';

  class TailoringSuggestions {
    constructor(container, options = {}) {
      this.container = typeof container === 'string' ? document.querySelector(container) : container;
      this.options = Object.assign({
        suggestions: [],
        priorityMeter: null
      }, options);

      this.activeCategory = 'all'; // 'all' | 'Content' | 'Skill' | 'Experience' | 'ATS'
      this.render();
    }

    setData(suggestions, priorityMeter) {
      this.options.suggestions = suggestions || [];
      this.options.priorityMeter = priorityMeter || null;
      this.render();
    }

    render() {
      if (!this.container) return;

      const suggestions = this.options.suggestions || [];
      const priorityMeter = this.options.priorityMeter || { high: [], medium: [], low: [], potentialScoreBoost: 18 };

      const filtered = this.activeCategory === 'all'
        ? suggestions
        : suggestions.filter(s => (s.category || '').toLowerCase().includes(this.activeCategory.toLowerCase()));

      const escape = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

      this.container.innerHTML = `
        <div class="card" id="tailoring-suggestions-root">
          <div class="card-header" style="flex-wrap: wrap; gap: 12px;">
            <div>
              <h3 style="margin: 0; font-size: 1.15rem; display: flex; align-items: center; gap: 8px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand-purple)" stroke-width="2.2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                Resume Tailoring Recommendations
              </h3>
              <p class="text-sm text-muted" style="margin: 2px 0 0;">
                Actionable enhancements to elevate match score and pass recruiter screening.
              </p>
            </div>
            <div>
              <span class="badge badge-primary">+${priorityMeter.potentialScoreBoost || 15} Pts Potential Boost</span>
            </div>
          </div>

          <!-- Section 5: Improvement Priority Meter -->
          <div style="background: var(--surface-muted); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 18px; margin-bottom: 24px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
              <h4 style="margin: 0; font-size: 0.9375rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
                Improvement Priority Meter
              </h4>
              <span class="text-sm text-muted">Ranked by algorithm weighting</span>
            </div>

            <div class="priority-meter-wrap">
              <!-- High Priority -->
              ${(priorityMeter.high || []).map(item => `
                <div class="priority-row high">
                  <div style="width: 22px; height: 22px; border-radius: 50%; background: #FEE2E2; color: #DC2626; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; flex-shrink: 0;">!</div>
                  <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 0.875rem; color: #991B1B;">${escape(item.title)}</div>
                    <div style="font-size: 0.8125rem; color: var(--text-secondary);">${escape(item.detail)}</div>
                  </div>
                  <span class="points-boost-pill">+${item.pointsBoost} ATS Pts</span>
                </div>
              `).join('')}

              <!-- Medium Priority -->
              ${(priorityMeter.medium || []).map(item => `
                <div class="priority-row medium">
                  <div style="width: 22px; height: 22px; border-radius: 50%; background: #FEF3C7; color: #D97706; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; flex-shrink: 0;">•</div>
                  <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 0.875rem; color: #92400E;">${escape(item.title)}</div>
                    <div style="font-size: 0.8125rem; color: var(--text-secondary);">${escape(item.detail)}</div>
                  </div>
                  <span class="points-boost-pill">+${item.pointsBoost} ATS Pts</span>
                </div>
              `).join('')}

              <!-- Low Priority -->
              ${(priorityMeter.low || []).map(item => `
                <div class="priority-row low">
                  <div style="width: 22px; height: 22px; border-radius: 50%; background: #EFF6FF; color: #3B82F6; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; flex-shrink: 0;">i</div>
                  <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 0.875rem; color: #1E40AF;">${escape(item.title)}</div>
                    <div style="font-size: 0.8125rem; color: var(--text-secondary);">${escape(item.detail)}</div>
                  </div>
                  <span class="points-boost-pill">+${item.pointsBoost} ATS Pts</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Section 4: Categorized Recommendations Filter Tabs -->
          <div style="margin-bottom: 16px;">
            <div class="ju-tabs" style="margin-bottom: 16px;">
              <button type="button" class="ju-tab-btn ${this.activeCategory === 'all' ? 'active' : ''}" data-cat="all">
                All Categories (${suggestions.length})
              </button>
              <button type="button" class="ju-tab-btn ${this.activeCategory === 'content' ? 'active' : ''}" data-cat="content">
                Content Improvements
              </button>
              <button type="button" class="ju-tab-btn ${this.activeCategory === 'skill' ? 'active' : ''}" data-cat="skill">
                Skill Improvements
              </button>
              <button type="button" class="ju-tab-btn ${this.activeCategory === 'experience' ? 'active' : ''}" data-cat="experience">
                Experience Improvements
              </button>
              <button type="button" class="ju-tab-btn ${this.activeCategory === 'ats' ? 'active' : ''}" data-cat="ats">
                ATS Optimization Tips
              </button>
            </div>
          </div>

          <!-- Suggestions List -->
          <div id="suggestions-list-container">
            ${filtered.length > 0 ? filtered.map(s => `
              <div class="tailoring-card">
                <div class="tailoring-header">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="badge ${s.priority === 'High' ? 'badge-danger' : s.priority === 'Medium' ? 'badge-warning' : 'badge-neutral'}" style="font-size: 0.7rem;">
                      ${escape(s.priority)} Priority
                    </span>
                    <strong style="font-size: 0.9375rem; color: var(--text-primary);">${escape(s.title)}</strong>
                  </div>
                  <span class="badge badge-primary" style="font-size: 0.75rem;">+${s.estimatedImpactPoints || 5} Pts</span>
                </div>
                <p style="margin: 4px 0 0; font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5;">
                  ${escape(s.description)}
                </p>

                ${s.actionableSnippet ? `
                  <div class="snippet-box">
                    <div style="font-size: 0.8125rem; color: var(--text-primary); font-style: italic;">
                      ${escape(s.actionableSnippet)}
                    </div>
                    <button
                      type="button"
                      class="btn btn-outline btn-sm"
                      data-copy-snippet="${escape(s.actionableSnippet)}"
                      style="flex-shrink: 0; padding: 3px 8px; font-size: 0.75rem;"
                    >
                      Copy Snippet
                    </button>
                  </div>
                ` : ''}
              </div>
            `).join('') : `
              <div class="text-center text-muted" style="padding: 24px;">
                No recommendations found in this category.
              </div>
            `}
          </div>
        </div>
      `;

      this.bindEvents();
    }

    bindEvents() {
      const root = this.container.querySelector('#tailoring-suggestions-root');
      if (!root) return;

      root.querySelectorAll('[data-cat]').forEach(btn => {
        btn.addEventListener('click', () => {
          this.activeCategory = btn.dataset.cat;
          this.render();
        });
      });

      root.querySelectorAll('[data-copy-snippet]').forEach(btn => {
        btn.addEventListener('click', () => {
          const text = btn.dataset.copySnippet;
          navigator.clipboard.writeText(text).then(() => {
            if (window.JOBNEX && window.JOBNEX.showToast) {
              window.JOBNEX.showToast('Copied tailoring snippet to clipboard!', 'success');
            }
          });
        });
      });
    }
  }

  window.TailoringSuggestions = TailoringSuggestions;
})();

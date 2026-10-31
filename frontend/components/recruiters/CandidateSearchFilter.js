/**
 * CandidateSearchFilter Component (Section D)
 * Advanced candidate search and multi-parameter filtering:
 * - Skill filter
 * - Experience filter
 * - Location filter
 * - ATS Score Range filter
 * - Live keyword search bar
 */
(function () {
  'use strict';

  class CandidateSearchFilter {
    constructor(container, options = {}) {
      this.container = typeof container === 'string' ? document.querySelector(container) : container;
      this.options = Object.assign({
        onFilterChange: null,
        availableSkills: ['React', 'TypeScript', 'Python', 'FastAPI', 'Docker', 'Kubernetes', 'AWS', 'SQL', 'PostgreSQL', 'Kafka', 'CSS3', 'Jest'],
        totalCandidates: 0,
        matchingCandidates: 0
      }, options);

      this.filters = {
        search: '',
        skill: 'all',
        experience: 'all',
        location: 'all',
        minScore: 0
      };

      this.render();
    }

    setStats(total, matching) {
      this.options.totalCandidates = total;
      this.options.matchingCandidates = matching;
      const countEl = this.container.querySelector('#filter-results-count');
      if (countEl) {
        countEl.textContent = `Showing ${matching} of ${total} candidates`;
      }
    }

    render() {
      if (!this.container) return;

      const f = this.filters;
      const skills = this.options.availableSkills;
      const escape = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

      this.container.innerHTML = `
        <div class="card" id="cand-filter-root" style="margin-bottom: var(--space-6);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; flex-wrap: wrap; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand-purple)" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-primary);">Search & Candidate Filters</h3>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <span id="filter-results-count" class="text-sm text-muted">
                Showing ${this.options.matchingCandidates} of ${this.options.totalCandidates} candidates
              </span>
              <button type="button" class="btn btn-outline btn-sm" id="reset-filters-btn" style="padding: 3px 10px; font-size: 0.75rem;">
                Reset Filters
              </button>
            </div>
          </div>

          <!-- Filter Grid -->
          <div style="display: grid; grid-template-columns: 2fr 1.2fr 1fr 1fr 1.2fr; gap: 12px; align-items: flex-end;" id="filter-inputs-grid">
            <!-- Search Bar -->
            <div>
              <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px; display: block;">
                Keyword Search
              </label>
              <input
                type="search"
                id="cand-search-input"
                placeholder="Candidate name, target role, or skills…"
                value="${escape(f.search)}"
                style="width: 100%; min-height: 38px; font-size: 0.875rem;"
              >
            </div>

            <!-- Skill Filter -->
            <div>
              <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px; display: block;">
                Primary Skill
              </label>
              <select id="cand-skill-select" style="min-height: 38px; font-size: 0.875rem;">
                <option value="all" ${f.skill === 'all' ? 'selected' : ''}>All Skills</option>
                ${skills.map(skill => `
                  <option value="${escape(skill)}" ${f.skill === skill ? 'selected' : ''}>${escape(skill)}</option>
                `).join('')}
              </select>
            </div>

            <!-- Experience Filter -->
            <div>
              <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px; display: block;">
                Experience
              </label>
              <select id="cand-exp-select" style="min-height: 38px; font-size: 0.875rem;">
                <option value="all" ${f.experience === 'all' ? 'selected' : ''}>All Levels</option>
                <option value="junior" ${f.experience === 'junior' ? 'selected' : ''}>0-2 Yrs (Junior)</option>
                <option value="mid" ${f.experience === 'mid' ? 'selected' : ''}>3-5 Yrs (Mid)</option>
                <option value="senior" ${f.experience === 'senior' ? 'selected' : ''}>5+ Yrs (Senior)</option>
              </select>
            </div>

            <!-- Location Filter -->
            <div>
              <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px; display: block;">
                Location
              </label>
              <select id="cand-loc-select" style="min-height: 38px; font-size: 0.875rem;">
                <option value="all" ${f.location === 'all' ? 'selected' : ''}>All Locations</option>
                <option value="remote" ${f.location === 'remote' ? 'selected' : ''}>Remote</option>
                <option value="bengaluru" ${f.location === 'bengaluru' ? 'selected' : ''}>Bengaluru</option>
                <option value="hyderabad" ${f.location === 'hyderabad' ? 'selected' : ''}>Hyderabad</option>
                <option value="pune" ${f.location === 'pune' ? 'selected' : ''}>Pune</option>
              </select>
            </div>

            <!-- Minimum ATS Score -->
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin: 0;">
                  Min ATS Score: <strong id="score-val-label" style="color: var(--brand-purple);">${f.minScore > 0 ? f.minScore + '%' : 'Any'}</strong>
                </label>
              </div>
              <input
                type="range"
                id="cand-score-range"
                min="0"
                max="90"
                step="5"
                value="${f.minScore}"
                style="width: 100%; accent-color: var(--brand-purple); margin-top: 6px;"
              >
            </div>
          </div>
        </div>
      `;

      // Responsive styles for filter grid
      const style = document.createElement('style');
      style.textContent = `
        @media (max-width: 992px) {
          #filter-inputs-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 580px) {
          #filter-inputs-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `;
      this.container.appendChild(style);

      this.bindEvents();
    }

    bindEvents() {
      const root = this.container.querySelector('#cand-filter-root');
      if (!root) return;

      const searchInput = root.querySelector('#cand-search-input');
      const skillSelect = root.querySelector('#cand-skill-select');
      const expSelect = root.querySelector('#cand-exp-select');
      const locSelect = root.querySelector('#cand-loc-select');
      const scoreRange = root.querySelector('#cand-score-range');
      const scoreLabel = root.querySelector('#score-val-label');
      const resetBtn = root.querySelector('#reset-filters-btn');

      const notifyChange = () => {
        if (typeof this.options.onFilterChange === 'function') {
          this.options.onFilterChange({ ...this.filters });
        }
      };

      if (searchInput) {
        searchInput.addEventListener('input', e => {
          this.filters.search = e.target.value;
          notifyChange();
        });
      }

      if (skillSelect) {
        skillSelect.addEventListener('change', e => {
          this.filters.skill = e.target.value;
          notifyChange();
        });
      }

      if (expSelect) {
        expSelect.addEventListener('change', e => {
          this.filters.experience = e.target.value;
          notifyChange();
        });
      }

      if (locSelect) {
        locSelect.addEventListener('change', e => {
          this.filters.location = e.target.value;
          notifyChange();
        });
      }

      if (scoreRange) {
        scoreRange.addEventListener('input', e => {
          const val = parseInt(e.target.value, 10);
          this.filters.minScore = val;
          if (scoreLabel) scoreLabel.textContent = val > 0 ? val + '%' : 'Any';
          notifyChange();
        });
      }

      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          this.filters = {
            search: '',
            skill: 'all',
            experience: 'all',
            location: 'all',
            minScore: 0
          };
          this.render();
          notifyChange();
          if (window.JOBNEX && window.JOBNEX.showToast) {
            window.JOBNEX.showToast('Reset all filters', 'info');
          }
        });
      }
    }
  }

  window.CandidateSearchFilter = CandidateSearchFilter;
})();

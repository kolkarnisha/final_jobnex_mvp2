/**
 * CandidatePipelineKanban Component (Section C)
 * 7-Column Pipeline Kanban Board:
 * 1. Applied
 * 2. Screening
 * 3. Interview
 * 4. Technical Round
 * 5. HR Round
 * 6. Offer
 * 7. Hired
 * Features native HTML5 Drag and Drop, accessible stage progression, and drawer activation.
 */
(function () {
  'use strict';

  const KANBAN_STAGES = [
    { id: 'Applied', label: 'Applied', icon: '📥', color: '#2563EB' },
    { id: 'Screening', label: 'Screening', icon: '🔍', color: '#7C3AED' },
    { id: 'Interview', label: 'Interview', icon: '💬', color: '#D97706' },
    { id: 'Technical Round', label: 'Technical Round', icon: '💻', color: '#059669' },
    { id: 'HR Round', label: 'HR Round', icon: '👥', color: '#9333EA' },
    { id: 'Offer', label: 'Offer', icon: '📜', color: '#10B981' },
    { id: 'Hired', label: 'Hired', icon: '🎉', color: '#047857' }
  ];

  class CandidatePipelineKanban {
    constructor(container, options = {}) {
      this.container = typeof container === 'string' ? document.querySelector(container) : container;
      this.options = Object.assign({
        candidates: [],
        onCandidateClick: null,
        onStageChanged: null
      }, options);

      this.candidates = this.options.candidates || [];
      this.draggedCandidateId = null;
      this.render();
    }

    setCandidates(candidates) {
      this.candidates = candidates || [];
      this.render();
    }

    render() {
      if (!this.container) return;

      const escape = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

      this.container.innerHTML = `
        <div class="card" id="rec-pipeline-root" style="margin-bottom: var(--space-6);">
          <div class="card-header" style="flex-wrap: wrap; gap: 12px;">
            <div>
              <h2 style="margin: 0; font-size: 1.25rem; display: flex; align-items: center; gap: 8px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand-purple)" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Candidate Hiring Pipeline
              </h2>
              <p class="text-sm text-muted" style="margin: 2px 0 0;">
                Drag & drop candidate cards across stages or click to inspect full candidate dossiers.
              </p>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <span class="badge badge-primary">${this.candidates.length} Total in Pipeline</span>
            </div>
          </div>

          <!-- 7 Column Kanban Board -->
          <div class="rec-kanban-board" id="rec-kanban-board">
            ${KANBAN_STAGES.map(stage => {
              const stageCandidates = this.candidates.filter(c => c.stage === stage.id);
              return `
                <div class="rec-kanban-col" data-stage-id="${stage.id}">
                  <div class="rec-kanban-header">
                    <span class="rec-kanban-col-title">
                      <span>${stage.icon}</span>
                      <span>${stage.label}</span>
                    </span>
                    <span class="rec-kanban-count">${stageCandidates.length}</span>
                  </div>

                  <div class="rec-kanban-cards" data-drop-zone="${stage.id}">
                    ${stageCandidates.length > 0 ? stageCandidates.map(c => {
                      const initials = (c.name || 'Candidate').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                      const scoreClass = c.atsScore >= 85 ? 'high' : c.atsScore >= 70 ? 'mid' : 'low';
                      return `
                        <div
                          class="rec-cand-card"
                          draggable="true"
                          data-candidate-id="${escape(c.id)}"
                          tabindex="0"
                          role="button"
                          aria-label="${escape(c.name)}, ${c.atsScore}% ATS Score, Stage: ${stage.label}"
                        >
                          <div class="cand-top-row">
                            <div style="display: flex; align-items: center; gap: 8px;">
                              <div class="cand-avatar">${initials}</div>
                              <div>
                                <h4 class="cand-name">${escape(c.name)}</h4>
                                <div class="cand-role">${escape(c.targetJobTitle || 'Software Engineer')}</div>
                              </div>
                            </div>
                            <span class="cand-score-pill ${scoreClass}" title="ATS Match Score">
                              ${c.atsScore}%
                            </span>
                          </div>

                          <div class="cand-skills-row">
                            ${(c.skills || []).slice(0, 3).map(skill => `
                              <span class="cand-skill-tag">${escape(skill)}</span>
                            `).join('')}
                            ${(c.skills || []).length > 3 ? `
                              <span class="cand-skill-tag" style="background: transparent; color: var(--text-muted);">+${c.skills.length - 3}</span>
                            ` : ''}
                          </div>

                          <div class="cand-footer">
                            <span>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: -1px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                              ${escape(c.experience)}
                            </span>
                            <span>${escape(c.appliedDate ? c.appliedDate.slice(5) : 'Active')}</span>
                          </div>
                        </div>
                      `;
                    }).join('') : `
                      <div class="text-center text-muted" style="padding: 24px 8px; font-size: 0.8125rem;">
                        No candidates in ${stage.label}.
                      </div>
                    `}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;

      this.bindEvents();
    }

    bindEvents() {
      const root = this.container.querySelector('#rec-pipeline-root');
      if (!root) return;

      // Click card to open drawer
      root.querySelectorAll('.rec-cand-card').forEach(card => {
        card.addEventListener('click', (e) => {
          const candId = card.dataset.candidateId;
          const candidate = this.candidates.find(c => c.id === candId);
          if (candidate && typeof this.options.onCandidateClick === 'function') {
            this.options.onCandidateClick(candidate);
          }
        });

        // Keyboard accessible activation
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const candId = card.dataset.candidateId;
            const candidate = this.candidates.find(c => c.id === candId);
            if (candidate && typeof this.options.onCandidateClick === 'function') {
              this.options.onCandidateClick(candidate);
            }
          }
        });

        // Drag start
        card.addEventListener('dragstart', (e) => {
          this.draggedCandidateId = card.dataset.candidateId;
          card.classList.add('dragging');
          e.dataTransfer.setData('text/plain', this.draggedCandidateId);
          e.dataTransfer.effectAllowed = 'move';
        });

        // Drag end
        card.addEventListener('dragend', () => {
          card.classList.remove('dragging');
          root.querySelectorAll('.rec-kanban-col').forEach(col => col.classList.remove('drag-over'));
        });
      });

      // Drop zones
      root.querySelectorAll('.rec-kanban-col').forEach(col => {
        const targetStage = col.dataset.stageId;

        col.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          col.classList.add('drag-over');
        });

        col.addEventListener('dragleave', (e) => {
          if (!col.contains(e.relatedTarget)) {
            col.classList.remove('drag-over');
          }
        });

        col.addEventListener('drop', async (e) => {
          e.preventDefault();
          col.classList.remove('drag-over');
          const candId = e.dataTransfer.getData('text/plain') || this.draggedCandidateId;
          if (!candId) return;

          const candidate = this.candidates.find(c => c.id === candId);
          if (candidate && candidate.stage !== targetStage) {
            const previousStage = candidate.stage;
            candidate.stage = targetStage;

            // Persist through API
            const api = window.JOBNEX_API || {};
            if (api.updateCandidateStage) {
              try {
                await api.updateCandidateStage(candId, targetStage);
              } catch (err) {
                candidate.stage = previousStage;
                if (window.JOBNEX && window.JOBNEX.showToast) {
                  window.JOBNEX.showToast(`Could not update candidate stage: ${err.message}`, 'error');
                }
                this.render();
                return;
              }
            }

            if (window.JOBNEX && window.JOBNEX.showToast) {
              window.JOBNEX.showToast(`Moved ${candidate.name} to "${targetStage}"`, 'success');
            }

            if (typeof this.options.onStageChanged === 'function') {
              this.options.onStageChanged(candidate, targetStage, previousStage);
            }

            this.render();
          }
        });
      });
    }
  }

  window.CandidatePipelineKanban = CandidatePipelineKanban;
})();

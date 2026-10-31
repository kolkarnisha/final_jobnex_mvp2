/**
 * CandidateDrawer Component (Section E)
 * Slide-out details drawer presenting:
 * - Candidate Header & Current Stage
 * - ATS Score & Fit Overview
 * - Resume Summary
 * - Key Skills & Missing Skills
 * - Interview Notes Timeline + Interactive Add Note Form
 * - Contact Details & Stage Advance Buttons
 */
(function () {
  'use strict';

  class CandidateDrawer {
    constructor(options = {}) {
      this.options = Object.assign({
        onStageUpdate: null,
        onNoteAdded: null
      }, options);

      this.candidate = null;
      this.isOpen = false;
      this.createBackdrop();
    }

    createBackdrop() {
      let el = document.getElementById('rec-drawer-backdrop');
      if (!el) {
        el = document.createElement('div');
        el.id = 'rec-drawer-backdrop';
        el.className = 'rec-drawer-backdrop';
        document.body.appendChild(el);
      }
      this.backdrop = el;
      this.backdrop.addEventListener('click', (e) => {
        if (e.target === this.backdrop) this.close();
      });

      // ESC key listener
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      });
    }

    open(candidate) {
      this.candidate = candidate;
      this.isOpen = true;
      this.render();
      setTimeout(() => {
        this.backdrop.classList.add('open');
      }, 10);
    }

    close() {
      this.isOpen = false;
      this.backdrop.classList.remove('open');
    }

    render() {
      if (!this.candidate) return;
      const c = this.candidate;
      const escape = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
      const initials = (c.name || 'Candidate').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

      const scoreColor = c.atsScore >= 85 ? '#10B981' : c.atsScore >= 70 ? '#D97706' : '#DC2626';

      this.backdrop.innerHTML = `
        <div class="rec-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-cand-name">
          <!-- Drawer Header -->
          <div class="rec-drawer-header">
            <div style="display: flex; align-items: center; gap: 14px;">
              <div class="cand-avatar" style="width: 48px; height: 48px; font-size: 1.1rem;">${initials}</div>
              <div>
                <h3 id="drawer-cand-name" style="margin: 0 0 4px; font-size: 1.2rem; color: var(--text-primary);">${escape(c.name)}</h3>
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                  <span class="badge badge-primary">${escape(c.stage)}</span>
                  <span class="text-sm text-muted">${escape(c.targetJobTitle)}</span>
                </div>
              </div>
            </div>
            <button type="button" class="btn btn-ghost btn-sm" id="close-drawer-btn" aria-label="Close drawer" style="font-size: 1.25rem; line-height: 1; padding: 4px 8px;">
              &times;
            </button>
          </div>

          <!-- Drawer Scrollable Body -->
          <div class="rec-drawer-body">
            <!-- ATS Match Score Banner -->
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; background: var(--surface-purple-subtle); border: 1px solid var(--brand-purple-border); border-radius: var(--radius-lg);">
              <div>
                <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--brand-purple); margin-bottom: 2px;">
                  ATS Resume Match Score
                </div>
                <div style="font-size: 0.875rem; color: var(--text-secondary);">
                  ${c.atsScore >= 85 ? 'Strong match for role requirements' : 'Moderate alignment with role prerequisites'}
                </div>
              </div>
              <div style="text-align: right;">
                <span style="font-size: 1.8rem; font-weight: 800; color: ${scoreColor}; line-height: 1;">${c.atsScore}%</span>
                <div class="text-xs text-muted">Out of 100</div>
              </div>
            </div>

            <!-- Resume Summary -->
            <div>
              <h4 style="font-size: 0.875rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin: 0 0 8px;">
                Resume Summary
              </h4>
              <p style="margin: 0; font-size: 0.875rem; color: var(--text-secondary); line-height: 1.6; background: var(--surface-muted); padding: 12px 14px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                ${escape(c.resumeSummary || 'Candidate has proven technical track record across enterprise software delivery.')}
              </p>
            </div>

            <!-- Key Skills & Missing Skills -->
            <div class="grid-2">
              <div>
                <h4 style="font-size: 0.8125rem; font-weight: 700; text-transform: uppercase; color: #065F46; margin: 0 0 8px;">
                  Key Verified Skills
                </h4>
                <div class="jd-tag-cloud">
                  ${(c.skills || []).map(skill => `
                    <span class="matched-pill" style="font-size: 0.75rem; padding: 3px 8px;">
                      ✓ ${escape(skill)}
                    </span>
                  `).join('')}
                </div>
              </div>
              <div>
                <h4 style="font-size: 0.8125rem; font-weight: 700; text-transform: uppercase; color: #9A3412; margin: 0 0 8px;">
                  Unmatched Skills
                </h4>
                <div class="jd-tag-cloud">
                  ${(c.missingSkills && c.missingSkills.length) ? c.missingSkills.map(skill => `
                    <span class="missing-pill" style="font-size: 0.75rem; padding: 3px 8px;">
                      • ${escape(skill)}
                    </span>
                  `).join('') : '<span class="text-xs text-muted">All primary skills matched.</span>'}
                </div>
              </div>
            </div>

            <!-- Contact Details -->
            <div>
              <h4 style="font-size: 0.875rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin: 0 0 10px;">
                Contact & Profile Information
              </h4>
              <div style="background: var(--surface-muted); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; font-size: 0.875rem;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <span class="text-muted">Email</span>
                  <a href="mailto:${escape(c.email)}" style="font-weight: 600; color: var(--brand-purple);">${escape(c.email)}</a>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <span class="text-muted">Phone</span>
                  <span>${escape(c.phone || '+91 98765 00000')}</span>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <span class="text-muted">Location</span>
                  <span>${escape(c.location || 'Remote')}</span>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <span class="text-muted">Experience</span>
                  <span style="font-weight: 600;">${escape(c.experience)}</span>
                </div>
              </div>
            </div>

            <!-- Interview Notes Timeline -->
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                <h4 style="font-size: 0.875rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin: 0;">
                  Interview Feedback & Notes (${(c.interviewNotes || []).length})
                </h4>
              </div>

              <!-- Add Note Form -->
              <div style="margin-bottom: 14px;">
                <textarea
                  id="drawer-note-input"
                  rows="2"
                  placeholder="Add evaluation note or interview feedback…"
                  style="width: 100%; font-size: 0.8125rem; padding: 8px 10px; border-radius: var(--radius-md); border: 1px solid var(--border-color); box-sizing: border-box; margin-bottom: 6px;"
                ></textarea>
                <div style="display: flex; justify-content: flex-end;">
                  <button type="button" class="btn btn-sm" id="drawer-add-note-btn" style="padding: 4px 12px; font-size: 0.75rem;">
                    Post Note
                  </button>
                </div>
              </div>

              <!-- Notes List -->
              <div class="notes-timeline" id="drawer-notes-timeline">
                ${(c.interviewNotes && c.interviewNotes.length > 0) ? c.interviewNotes.map(n => `
                  <div class="note-item">
                    <div class="note-meta">
                      <strong>${escape(n.author)} (${escape(n.role)})</strong>
                      <span>${escape(n.date)}</span>
                    </div>
                    <div style="font-size: 0.8125rem; color: var(--text-secondary); line-height: 1.5;">
                      ${escape(n.text)}
                    </div>
                  </div>
                `).join('') : `
                  <div class="text-center text-muted" style="padding: 16px; font-size: 0.8125rem;">
                    No interviewer notes recorded yet. Add the first note above!
                  </div>
                `}
              </div>
            </div>
          </div>

          <!-- Drawer Footer Stage Progression -->
          <div class="rec-drawer-footer">
            <button type="button" class="btn btn-secondary btn-sm" id="drawer-sched-btn">
              Schedule Interview
            </button>
            <button type="button" class="btn btn-sm" id="drawer-advance-btn">
              Advance to Next Stage &rarr;
            </button>
          </div>
        </div>
      `;

      this.bindEvents();
    }

    bindEvents() {
      const closeBtn = this.backdrop.querySelector('#close-drawer-btn');
      if (closeBtn) closeBtn.addEventListener('click', () => this.close());

      const addNoteBtn = this.backdrop.querySelector('#drawer-add-note-btn');
      const noteInput = this.backdrop.querySelector('#drawer-note-input');
      const advanceBtn = this.backdrop.querySelector('#drawer-advance-btn');
      const schedBtn = this.backdrop.querySelector('#drawer-sched-btn');

      if (addNoteBtn && noteInput) {
        addNoteBtn.addEventListener('click', async () => {
          const text = noteInput.value.trim();
          if (!text) return;

          const api = window.JOBNEX_API || {};
          let newNote = null;
          if (api.addCandidateNote) {
            try {
              newNote = await api.addCandidateNote(this.candidate.id, text);
            } catch (err) {
              if (window.JOBNEX && window.JOBNEX.showToast) {
                window.JOBNEX.showToast(`Could not add note: ${err.message}`, 'error');
              }
              return;
            }
          } else {
            newNote = {
              id: 'n-' + Date.now(),
              author: 'Parameshachari G',
              role: 'Recruitment Lead',
              date: new Date().toISOString().slice(0, 10),
              text
            };
          }

          if (!Array.isArray(this.candidate.interviewNotes)) this.candidate.interviewNotes = [];
          this.candidate.interviewNotes.unshift(newNote);
          if (window.JOBNEX && window.JOBNEX.showToast) {
            window.JOBNEX.showToast('Note added to candidate timeline.', 'success');
          }
          if (typeof this.options.onNoteAdded === 'function') {
            this.options.onNoteAdded(this.candidate, newNote);
          }
          this.render();
        });
      }

      if (advanceBtn) {
        advanceBtn.addEventListener('click', async () => {
          const STAGES = ['Applied', 'Screening', 'Interview', 'Technical Round', 'HR Round', 'Offer', 'Hired'];
          const currentIdx = STAGES.indexOf(this.candidate.stage);
          if (currentIdx < STAGES.length - 1) {
            const nextStage = STAGES[currentIdx + 1];
            const previousStage = this.candidate.stage;
            this.candidate.stage = nextStage;

            const api = window.JOBNEX_API || {};
            if (api.updateCandidateStage) {
              try {
                await api.updateCandidateStage(this.candidate.id, nextStage);
              } catch (err) {
                this.candidate.stage = previousStage;
                if (window.JOBNEX && window.JOBNEX.showToast) {
                  window.JOBNEX.showToast(`Could not update candidate stage: ${err.message}`, 'error');
                }
                this.render();
                return;
              }
            }

            if (window.JOBNEX && window.JOBNEX.showToast) {
              window.JOBNEX.showToast(`Advanced ${this.candidate.name} to "${nextStage}"`, 'success');
            }
            if (typeof this.options.onStageUpdate === 'function') {
              this.options.onStageUpdate(this.candidate, nextStage);
            }
            this.render();
          } else {
            if (window.JOBNEX && window.JOBNEX.showToast) {
              window.JOBNEX.showToast(`${this.candidate.name} has already reached the final stage (Hired).`, 'info');
            }
          }
        });
      }

      if (schedBtn) {
        schedBtn.addEventListener('click', () => {
          if (window.JOBNEX && window.JOBNEX.showToast) {
            window.JOBNEX.showToast(`Interview calendar invite drafted for ${this.candidate.name}`, 'info');
          }
        });
      }
    }
  }

  window.CandidateDrawer = CandidateDrawer;
})();

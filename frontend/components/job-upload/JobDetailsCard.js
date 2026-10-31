/**
 * JobDetailsCard Component
 * Displays extracted job specifications:
 * - Job Title & Company
 * - Required Skills
 * - Preferred Skills
 * - Experience
 * - Keywords
 * - Responsibilities
 * Allows inline tag additions and triggering ATS match analysis.
 */
(function () {
  'use strict';

  class JobDetailsCard {
    constructor(container, options = {}) {
      this.container = typeof container === 'string' ? document.querySelector(container) : container;
      this.options = Object.assign({
        jobDetails: null,
        onTriggerMatch: null,
        onDetailsChanged: null
      }, options);

      this.data = this.options.jobDetails;
      this.isEditing = false;
      this.render();
    }

    setJobDetails(data) {
      this.data = data;
      this.render();
    }

    render() {
      if (!this.container) return;
      if (!this.data) {
        this.container.innerHTML = `
          <div class="card text-center" style="padding: 40px 20px; border: 2px dashed var(--border-color); background: var(--surface-muted);">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.8" style="margin-bottom: 8px;"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            <h3 style="font-size: 1.1rem; color: var(--text-primary); margin: 0 0 4px;">No Extracted Job Details Yet</h3>
            <p class="text-sm text-muted" style="margin: 0;">Upload or paste a job description above to inspect extracted skills and keywords.</p>
          </div>
        `;
        return;
      }

      const d = this.data;
      const escape = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

      this.container.innerHTML = `
        <div class="jd-card" id="jd-card-root">
          <!-- Card Header -->
          <div class="jd-header">
            <div class="jd-title-group">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span class="badge badge-primary">Extracted Specification</span>
                <span class="badge badge-neutral">${escape(d.jobType || 'Full-time')}</span>
              </div>
              <h2>${escape(d.title)}</h2>
              <div class="jd-meta-row">
                <span class="jd-meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 7v14M21 7v14M6 11h2M6 15h2M16 11h2M16 15h2M10 21V3h4v18"/></svg>
                  <strong>${escape(d.company)}</strong>
                </span>
                <span class="text-muted">•</span>
                <span class="jd-meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  ${escape(d.experience)}
                </span>
                <span class="text-muted">•</span>
                <span class="jd-meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  ${escape(d.location || 'Remote / Hybrid')}
                </span>
              </div>
            </div>

            <!-- Header Quick Actions -->
            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
              <button type="button" class="btn btn-outline btn-sm" id="jd-edit-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                ${this.isEditing ? 'Cancel Edit' : 'Edit Details'}
              </button>
              <button type="button" class="btn btn-secondary btn-sm" id="jd-copy-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copy Specs
              </button>
            </div>
          </div>

          <!-- Edit Mode Panel (when toggled) -->
          <div id="jd-edit-panel" ${this.isEditing ? '' : 'hidden'} style="background: var(--surface-purple-subtle); border: 1px solid var(--brand-purple-border); border-radius: var(--radius-md); padding: 16px; margin-bottom: 20px;">
            <h4 style="margin: 0 0 12px; font-size: 0.9375rem; color: var(--brand-purple);">Edit Extracted Parameters</h4>
            <div class="grid-2" style="margin-bottom: 12px;">
              <div>
                <label style="font-size: 0.8125rem;">Job Title</label>
                <input type="text" id="jd-edit-title" value="${escape(d.title)}" style="font-size: 0.875rem;">
              </div>
              <div>
                <label style="font-size: 0.8125rem;">Company Name</label>
                <input type="text" id="jd-edit-company" value="${escape(d.company)}" style="font-size: 0.875rem;">
              </div>
            </div>
            <div class="grid-2" style="margin-bottom: 12px;">
              <div>
                <label style="font-size: 0.8125rem;">Experience Required</label>
                <input type="text" id="jd-edit-experience" value="${escape(d.experience)}" style="font-size: 0.875rem;">
              </div>
              <div>
                <label style="font-size: 0.8125rem;">Required Skills (Comma separated)</label>
                <input type="text" id="jd-edit-req-skills" value="${escape((d.requiredSkills || []).join(', '))}" style="font-size: 0.875rem;">
              </div>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 8px;">
              <button type="button" class="btn btn-sm" id="jd-save-edit-btn">Save Changes</button>
            </div>
          </div>

          <!-- Skills Breakdown Grid -->
          <div class="jd-skills-grid">
            <!-- Required Skills -->
            <div>
              <div class="jd-section-title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--brand-purple)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Required Skills (${(d.requiredSkills || []).length})
              </div>
              <div class="jd-tag-cloud">
                ${(d.requiredSkills || []).map(skill => `
                  <span class="jd-tag required">${escape(skill)}</span>
                `).join('')}
              </div>
            </div>

            <!-- Preferred Skills -->
            <div>
              <div class="jd-section-title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                Preferred / Nice to Have (${(d.preferredSkills || []).length})
              </div>
              <div class="jd-tag-cloud">
                ${(d.preferredSkills && d.preferredSkills.length) ? d.preferredSkills.map(skill => `
                  <span class="jd-tag preferred">${escape(skill)}</span>
                `).join('') : '<span class="text-sm text-muted">None explicitly listed.</span>'}
              </div>
            </div>
          </div>

          <!-- Keywords Section -->
          <div style="margin-bottom: 20px;">
            <div class="jd-section-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Extracted Keywords (${(d.keywords || []).length})
            </div>
            <div class="jd-tag-cloud">
              ${(d.keywords || []).map(kw => `
                <span class="jd-tag keyword">${escape(kw)}</span>
              `).join('')}
            </div>
          </div>

          <!-- Responsibilities Section -->
          <div style="margin-bottom: 24px;">
            <div class="jd-section-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              Core Responsibilities (${(d.responsibilities || []).length})
            </div>
            <ul class="jd-responsibilities">
              ${(d.responsibilities || []).map(r => `
                <li>${escape(r)}</li>
              `).join('')}
            </ul>
          </div>

          <!-- Trigger Match CTA -->
          <div style="padding-top: 16px; border-top: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
            <span class="text-sm text-muted">
              Connect this job specification directly to your candidate resume for tailored ATS alignment.
            </span>
            <button type="button" class="btn btn-lg" id="jd-connect-ats-btn" style="min-width: 220px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>
              Run Job Match Analysis
            </button>
          </div>
        </div>
      `;

      this.bindEvents();
    }

    bindEvents() {
      const root = this.container.querySelector('#jd-card-root');
      if (!root) return;

      const editBtn = root.querySelector('#jd-edit-btn');
      const copyBtn = root.querySelector('#jd-copy-btn');
      const saveEditBtn = root.querySelector('#jd-save-edit-btn');
      const connectAtsBtn = root.querySelector('#jd-connect-ats-btn');

      if (editBtn) {
        editBtn.addEventListener('click', () => {
          this.isEditing = !this.isEditing;
          this.render();
        });
      }

      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          const d = this.data;
          const text = `${d.title} at ${d.company}\nExperience: ${d.experience}\nRequired Skills: ${(d.requiredSkills || []).join(', ')}\nKeywords: ${(d.keywords || []).join(', ')}`;
          navigator.clipboard.writeText(text).then(() => {
            if (window.JOBNEX && window.JOBNEX.showToast) {
              window.JOBNEX.showToast('Job details copied to clipboard!', 'success');
            }
          });
        });
      }

      if (saveEditBtn) {
        saveEditBtn.addEventListener('click', () => {
          const title = root.querySelector('#jd-edit-title').value.trim();
          const company = root.querySelector('#jd-edit-company').value.trim();
          const experience = root.querySelector('#jd-edit-experience').value.trim();
          const reqStr = root.querySelector('#jd-edit-req-skills').value.trim();

          this.data.title = title || this.data.title;
          this.data.company = company || this.data.company;
          this.data.experience = experience || this.data.experience;
          if (reqStr) {
            this.data.requiredSkills = reqStr.split(',').map(s => s.trim()).filter(Boolean);
          }
          this.isEditing = false;
          try {
            localStorage.setItem('jobnex.current_extracted_jd', JSON.stringify(this.data));
          } catch (e) {}

          if (window.JOBNEX && window.JOBNEX.showToast) {
            window.JOBNEX.showToast('Updated job details.', 'success');
          }
          if (typeof this.options.onDetailsChanged === 'function') {
            this.options.onDetailsChanged(this.data);
          }
          this.render();
        });
      }

      if (connectAtsBtn) {
        connectAtsBtn.addEventListener('click', () => {
          if (typeof this.options.onTriggerMatch === 'function') {
            this.options.onTriggerMatch(this.data);
          }
        });
      }
    }
  }

  window.JobDetailsCard = JobDetailsCard;
})();

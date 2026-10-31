/**
 * JobManagementTable Component (Section B)
 * Table/Grid of managed job openings:
 * - Columns: Job Title, Company, Status, Applicants, Created Date, Actions
 * - Actions: View, Edit, Archive
 * - Includes "+ Post New Job" modal and status filtering
 */
(function () {
  'use strict';

  class JobManagementTable {
    constructor(container, options = {}) {
      this.container = typeof container === 'string' ? document.querySelector(container) : container;
      this.options = Object.assign({
        jobs: [],
        onViewJobCandidates: null,
        onJobUpdated: null,
        onJobCreated: null
      }, options);

      this.jobs = this.options.jobs || [];
      this.activeStatusFilter = 'all'; // 'all' | 'Active' | 'Paused' | 'Archived'
      this.render();
    }

    setJobs(jobs) {
      this.jobs = jobs || [];
      this.render();
    }

    render() {
      if (!this.container) return;

      const filteredJobs = this.activeStatusFilter === 'all'
        ? this.jobs
        : this.jobs.filter(j => (j.status || '').toLowerCase() === this.activeStatusFilter.toLowerCase());

      const escape = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

      this.container.innerHTML = `
        <div class="card" id="job-mgmt-root">
          <div class="card-header" style="flex-wrap: wrap; gap: 12px;">
            <div>
              <h2 style="margin: 0; font-size: 1.25rem; display: flex; align-items: center; gap: 8px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand-purple)" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                Job Management & Requisitions
              </h2>
              <p class="text-sm text-muted" style="margin: 2px 0 0;">
                Manage open postings, track candidate volume, and create new job requisitions.
              </p>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <button type="button" class="btn" id="post-new-job-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Post New Job
              </button>
            </div>
          </div>

          <!-- Status Filter Tabs -->
          <div style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;">
            <button type="button" class="btn btn-sm ${this.activeStatusFilter === 'all' ? 'btn-secondary' : 'btn-outline'}" data-filter-status="all">
              All Jobs (${this.jobs.length})
            </button>
            <button type="button" class="btn btn-sm ${this.activeStatusFilter === 'active' ? 'btn-secondary' : 'btn-outline'}" data-filter-status="active">
              Active (${this.jobs.filter(j => j.status === 'Active').length})
            </button>
            <button type="button" class="btn btn-sm ${this.activeStatusFilter === 'paused' ? 'btn-secondary' : 'btn-outline'}" data-filter-status="paused">
              Paused (${this.jobs.filter(j => j.status === 'Paused').length})
            </button>
            <button type="button" class="btn btn-sm ${this.activeStatusFilter === 'archived' ? 'btn-secondary' : 'btn-outline'}" data-filter-status="archived">
              Archived (${this.jobs.filter(j => j.status === 'Archived').length})
            </button>
          </div>

          <!-- Jobs Table -->
          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th scope="col">Job Title</th>
                  <th scope="col">Company</th>
                  <th scope="col">Status</th>
                  <th scope="col">Applicants</th>
                  <th scope="col">Created Date</th>
                  <th scope="col" style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${filteredJobs.length > 0 ? filteredJobs.map(job => `
                  <tr>
                    <td>
                      <div style="font-weight: 700; color: var(--text-primary);">${escape(job.title)}</div>
                      <div class="text-xs text-muted">${escape(job.department || 'Engineering')} • ${escape(job.location || 'Remote')}</div>
                    </td>
                    <td>
                      <span style="font-weight: 500;">${escape(job.company)}</span>
                    </td>
                    <td>
                      <span class="badge ${job.status === 'Active' ? 'badge-success' : job.status === 'Paused' ? 'badge-warning' : 'badge-neutral'}">
                        <span class="badge-dot" style="background: ${job.status === 'Active' ? '#10B981' : job.status === 'Paused' ? '#F59E0B' : '#94A3B8'};"></span>
                        ${escape(job.status)}
                      </span>
                    </td>
                    <td>
                      <button type="button" class="badge badge-primary" data-action="view-job" data-job-id="${escape(job.id)}" style="cursor: pointer; border: none; font-family: inherit;">
                        ${job.applicantsCount || 0} Candidates &rarr;
                      </button>
                    </td>
                    <td class="text-sm text-secondary">
                      ${escape(job.createdDate || 'Recently')}
                    </td>
                    <td style="text-align: right;">
                      <div style="display: inline-flex; gap: 6px;">
                        <button type="button" class="btn btn-outline btn-sm" data-action="view-job" data-job-id="${escape(job.id)}" title="View candidates in pipeline">
                          View
                        </button>
                        <button type="button" class="btn btn-secondary btn-sm" data-action="edit-job" data-job-id="${escape(job.id)}" title="Edit requisition">
                          Edit
                        </button>
                        ${job.status !== 'Archived' ? `
                          <button type="button" class="btn btn-outline btn-sm" data-action="archive-job" data-job-id="${escape(job.id)}" title="Archive posting" style="color: var(--color-danger);">
                            Archive
                          </button>
                        ` : ''}
                      </div>
                    </td>
                  </tr>
                `).join('') : `
                  <tr>
                    <td colspan="6" class="text-center text-muted" style="padding: 32px;">
                      No jobs matching this filter.
                    </td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>
      `;

      this.bindEvents();
    }

    bindEvents() {
      const root = this.container.querySelector('#job-mgmt-root');
      if (!root) return;

      // Status filters
      root.querySelectorAll('[data-filter-status]').forEach(btn => {
        btn.addEventListener('click', () => {
          this.activeStatusFilter = btn.dataset.filterStatus;
          this.render();
        });
      });

      // Actions
      root.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const action = btn.dataset.action;
          const jobId = btn.dataset.jobId;
          const job = this.jobs.find(j => j.id === jobId);

          if (action === 'view-job') {
            if (typeof this.options.onViewJobCandidates === 'function') {
              this.options.onViewJobCandidates(jobId);
            }
          } else if (action === 'edit-job') {
            this.openEditModal(job);
          } else if (action === 'archive-job') {
            this.confirmArchiveJob(job);
          }
        });
      });

      // Post New Job Modal
      const postBtn = root.querySelector('#post-new-job-btn');
      if (postBtn) {
        postBtn.addEventListener('click', () => this.openPostJobModal());
      }
    }

    openPostJobModal() {
      const modalContent = document.createElement('div');
      modalContent.innerHTML = `
        <form id="create-job-form" novalidate style="display: flex; flex-direction: column; gap: 14px;">
          <div>
            <label style="font-size: 0.8125rem; font-weight: 600;">Job Title *</label>
            <input type="text" id="cj-title" placeholder="e.g. Senior Full Stack Engineer" required>
          </div>
          <div class="grid-2">
            <div>
              <label style="font-size: 0.8125rem; font-weight: 600;">Company *</label>
              <input type="text" id="cj-company" value="JOBNEX Core Platform" required>
            </div>
            <div>
              <label style="font-size: 0.8125rem; font-weight: 600;">Department</label>
              <input type="text" id="cj-dept" value="Engineering">
            </div>
          </div>
          <div class="grid-2">
            <div>
              <label style="font-size: 0.8125rem; font-weight: 600;">Location</label>
              <input type="text" id="cj-location" value="Remote / Hybrid">
            </div>
            <div>
              <label style="font-size: 0.8125rem; font-weight: 600;">Experience Level</label>
              <input type="text" id="cj-exp" value="3-6 Years">
            </div>
          </div>
          <div>
            <label style="font-size: 0.8125rem; font-weight: 600;">Required Skills (comma separated)</label>
            <input type="text" id="cj-skills" placeholder="React, TypeScript, Python, Docker, AWS" value="React, TypeScript, CSS3, REST APIs">
          </div>
          <div>
            <label style="font-size: 0.8125rem; font-weight: 600;">Role Description & Overview</label>
            <textarea id="cj-desc" rows="3" placeholder="Brief outline of role expectations…">Build accessible, responsive SaaS interfaces with state-of-the-art UX.</textarea>
          </div>
        </form>
      `;

      if (window.JOBNEX && window.JOBNEX.showModal) {
        window.JOBNEX.showModal({
          title: 'Post New Job Requisition',
          content: modalContent,
          confirmText: 'Publish Requisition',
          cancelText: 'Cancel',
          onConfirm: async () => {
            const title = modalContent.querySelector('#cj-title').value.trim();
            const company = modalContent.querySelector('#cj-company').value.trim();
            const dept = modalContent.querySelector('#cj-dept').value.trim();
            const loc = modalContent.querySelector('#cj-location').value.trim();
            const exp = modalContent.querySelector('#cj-exp').value.trim();
            const skillsStr = modalContent.querySelector('#cj-skills').value.trim();
            const desc = modalContent.querySelector('#cj-desc').value.trim();

            if (!title) {
              if (window.JOBNEX.showToast) window.JOBNEX.showToast('Please provide a job title', 'error');
              return;
            }

            const api = window.JOBNEX_API || {};
            let created = null;
            if (api.createRecruiterJob) {
              created = await api.createRecruiterJob({
                title, company, department: dept, location: loc,
                experienceLevel: exp, requiredSkills: skillsStr, description: desc
              });
            } else {
              created = {
                id: 'rj-' + Date.now(),
                title, company, department: dept, location: loc,
                status: 'Active', applicantsCount: 0, createdDate: new Date().toISOString().slice(0, 10),
                experienceLevel: exp, requiredSkills: skillsStr.split(',').map(s => s.trim()), description: desc
              };
            }

            this.jobs.unshift(created);
            if (window.JOBNEX.showToast) {
              window.JOBNEX.showToast(`Published job: "${title}"`, 'success');
            }
            if (typeof this.options.onJobCreated === 'function') {
              this.options.onJobCreated(created);
            }
            this.render();
          }
        });
      }
    }

    openEditModal(job) {
      if (!job) return;
      const modalContent = document.createElement('div');
      const escape = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

      modalContent.innerHTML = `
        <form id="edit-job-form" style="display: flex; flex-direction: column; gap: 14px;">
          <div>
            <label style="font-size: 0.8125rem; font-weight: 600;">Job Title</label>
            <input type="text" id="ej-title" value="${escape(job.title)}" required>
          </div>
          <div class="grid-2">
            <div>
              <label style="font-size: 0.8125rem; font-weight: 600;">Company</label>
              <input type="text" id="ej-company" value="${escape(job.company)}">
            </div>
            <div>
              <label style="font-size: 0.8125rem; font-weight: 600;">Status</label>
              <select id="ej-status">
                <option value="Active" ${job.status === 'Active' ? 'selected' : ''}>Active</option>
                <option value="Paused" ${job.status === 'Paused' ? 'selected' : ''}>Paused</option>
                <option value="Archived" ${job.status === 'Archived' ? 'selected' : ''}>Archived</option>
              </select>
            </div>
          </div>
          <div>
            <label style="font-size: 0.8125rem; font-weight: 600;">Location</label>
            <input type="text" id="ej-location" value="${escape(job.location || '')}">
          </div>
          <div>
            <label style="font-size: 0.8125rem; font-weight: 600;">Required Skills</label>
            <input type="text" id="ej-skills" value="${escape((job.requiredSkills || []).join(', '))}">
          </div>
        </form>
      `;

      if (window.JOBNEX && window.JOBNEX.showModal) {
        window.JOBNEX.showModal({
          title: `Edit Requisition: ${job.title}`,
          content: modalContent,
          confirmText: 'Save Changes',
          cancelText: 'Cancel',
          onConfirm: async () => {
            const title = modalContent.querySelector('#ej-title').value.trim();
            const company = modalContent.querySelector('#ej-company').value.trim();
            const status = modalContent.querySelector('#ej-status').value;
            const location = modalContent.querySelector('#ej-location').value.trim();
            const skillsStr = modalContent.querySelector('#ej-skills').value.trim();

            const updated = {
              title: title || job.title,
              company: company || job.company,
              status,
              location,
              requiredSkills: skillsStr ? skillsStr.split(',').map(s => s.trim()).filter(Boolean) : job.requiredSkills
            };

            const api = window.JOBNEX_API || {};
            if (api.updateRecruiterJob) {
              await api.updateRecruiterJob(job.id, updated);
            }
            Object.assign(job, updated);

            if (window.JOBNEX.showToast) {
              window.JOBNEX.showToast(`Updated requisition: "${job.title}"`, 'success');
            }
            if (typeof this.options.onJobUpdated === 'function') {
              this.options.onJobUpdated(job);
            }
            this.render();
          }
        });
      }
    }

    confirmArchiveJob(job) {
      if (!job) return;
      if (window.JOBNEX && window.JOBNEX.showModal) {
        window.JOBNEX.showModal({
          title: `Archive "${job.title}"?`,
          content: document.createTextNode('Archiving will close candidate applications for this position. You can restore it anytime.'),
          confirmText: 'Archive Requisition',
          cancelText: 'Keep Active',
          isDanger: true,
          onConfirm: async () => {
            const api = window.JOBNEX_API || {};
            if (api.archiveRecruiterJob) {
              await api.archiveRecruiterJob(job.id);
            }
            job.status = 'Archived';
            if (window.JOBNEX.showToast) {
              window.JOBNEX.showToast(`Archived "${job.title}"`, 'info');
            }
            if (typeof this.options.onJobUpdated === 'function') {
              this.options.onJobUpdated(job);
            }
            this.render();
          }
        });
      }
    }
  }

  window.JobManagementTable = JobManagementTable;
})();

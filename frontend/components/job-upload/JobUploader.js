/**
 * JobUploader Component
 * Multi-mode job description intake: pasted text or server-parsed PDF/DOCX/TXT upload.
 * Provides sample roles, loading states, and validation.
 */
(function () {
  'use strict';

  const SAMPLE_ROLES = {
    python: {
      label: 'Python Backend Engineer',
      text: `Python Backend Engineer (3-6 Years)
Company: CloudScale Infrastructure
Location: Remote / Bengaluru
Requirements:
- 3+ years experience with Python, FastAPI, and Flask microservices
- Hands-on expertise with PostgreSQL, Redis caching, and Docker containers
- Experience with AWS (EC2, S3, RDS, Lambda) and CI/CD pipelines
- Building high-throughput RESTful APIs, event streaming with Kafka, and automated unit testing

Preferred Qualifications:
- Experience with Kubernetes and Terraform IaC
- Solid understanding of distributed system design and database indexing

Responsibilities:
- Architect and deploy scalable backend microservices powering global SaaS analytics
- Optimize SQL queries and caching strategies for sub-50ms API responses
- Collaborate with frontend engineers, product designers, and DevOps in two-week agile sprints
- Maintain high code coverage with automated pytest test suites and CI deployment gates`
    },
    frontend: {
      label: 'Senior React Developer',
      text: `Senior React & TypeScript Developer (4+ Years)
Company: JOBNEX Core Platform
Location: Bengaluru, India (Hybrid)
Requirements:
- 4+ years building production-grade web applications in React, TypeScript, and modern JavaScript
- Deep mastery of semantic HTML5, accessible CSS (WCAG AA), and component design systems
- Experience with state management (Zustand/Redux), REST APIs, and Jest/React Testing Library
- Understanding of Core Web Vitals, performance profiling, and bundle optimization

Preferred Qualifications:
- Familiarity with Next.js SSR/SSG and Tailwind CSS
- Experience building drag-and-drop Kanban interfaces and data dashboards

Responsibilities:
- Lead the architecture and implementation of accessible, responsive frontend interfaces
- Collaborate with UX designers to craft high-conversion SaaS user flows and micro-animations
- Review pull requests, mentor associate developers, and enforce code quality standards
- Partner with backend engineers to define clean REST API payload contracts`
    },
    devops: {
      label: 'Cloud DevOps Architect',
      text: `Cloud DevOps & Site Reliability Lead (4-8 Years)
Company: Apex Cloud Systems
Location: Hyderabad / Remote
Requirements:
- 4+ years managing cloud infrastructure on AWS or GCP with Kubernetes and Docker
- Production experience with Terraform or CloudFormation for Infrastructure as Code (IaC)
- Designing and automating CI/CD pipelines using GitHub Actions, GitLab, or Jenkins
- Strong Linux systems administration, bash scripting, and networking fundamentals

Preferred Qualifications:
- Observability setup using Prometheus, Grafana, and Datadog
- Experience with zero-downtime blue/green or canary production deployments

Responsibilities:
- Maintain 99.95% system uptime across multi-region Kubernetes clusters
- Automate deployment workflows to enable continuous, zero-downtime microservice releases
- Implement security best practices, vulnerability scanning, and IAM least-privilege policies
- Conduct blameless post-mortems and engineer automated self-healing mechanisms`
    },
    data: {
      label: 'AI & Data Platform Lead',
      text: `AI & Data Platform Engineer (3-5 Years)
Company: Orbit Telemetry Labs
Location: Remote / Bengaluru
Requirements:
- 3+ years experience with Python, SQL, PostgreSQL, and Pandas
- Experience building real-time data ingestion pipelines using Apache Kafka or RabbitMQ
- Experience with Docker, cloud storage (AWS S3), and data hygiene workflows
- Strong analytical querying skills, database schema design, and query optimization

Preferred Qualifications:
- Familiarity with machine learning model serving via FastAPI or TorchServe
- Experience with BI dashboard tools and Redis caching layers

Responsibilities:
- Design real-time data pipelines processing millions of candidate and telemetry events
- Maintain analytical data warehouses with high data consistency and fast query execution
- Work alongside product and AI engineering teams to deploy automated scoring models
- Write automated regression tests and documentation for analytical API endpoints`
    }
  };

  class JobUploader {
    constructor(container, options = {}) {
      this.container = typeof container === 'string' ? document.querySelector(container) : container;
      this.options = Object.assign({
        onJobExtracted: null,
        initialText: '',
        showSamples: true
      }, options);

      this.activeTab = 'paste'; // 'paste' | 'file'
      this.currentFile = null;
      this.isExtracting = false;
      this.render();
    }

    render() {
      if (!this.container) return;
      this.container.innerHTML = `
        <div class="ju-uploader" id="ju-uploader-root">
          <div class="card-header" style="margin-bottom: 14px; padding-bottom: 10px;">
            <div>
              <h3 style="margin: 0; font-size: 1.15rem; display: flex; align-items: center; gap: 8px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand-purple)" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                Job Description Intake
              </h3>
              <p class="text-sm text-muted" style="margin: 2px 0 0;">Upload or paste the target job specification for instant semantic extraction and ATS matching.</p>
            </div>
            <span class="badge badge-primary">Step 1</span>
          </div>

          <!-- Tabs -->
          <div class="ju-tabs" role="tablist">
            <button type="button" class="ju-tab-btn ${this.activeTab === 'paste' ? 'active' : ''}" id="ju-tab-paste" role="tab" aria-selected="${this.activeTab === 'paste'}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
              Paste JD Text
            </button>
            <button type="button" class="ju-tab-btn ${this.activeTab === 'file' ? 'active' : ''}" id="ju-tab-file" role="tab" aria-selected="${this.activeTab === 'file'}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Upload JD File (PDF/DOCX/TXT)
            </button>
          </div>

          <!-- Paste Tab View -->
          <div id="ju-paste-view" ${this.activeTab !== 'paste' ? 'hidden' : ''}>
            ${this.options.showSamples ? `
              <div style="margin-bottom: 12px;">
                <label style="font-size: 0.8125rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; display: block;">
                  Quick Sample Job Openings:
                </label>
                <div class="ju-sample-roles">
                  ${Object.entries(SAMPLE_ROLES).map(([key, role]) => `
                    <button type="button" class="ju-sample-chip" data-sample-role="${key}">${role.label}</button>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <div style="margin-bottom: 14px;">
              <label for="ju-text-input" style="font-size: 0.875rem; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; display: block;">
                Job Description Plain Text
              </label>
              <textarea
                id="ju-text-input"
                rows="7"
                placeholder="Paste the full job specification including requirements, required tech stack, and responsibilities…"
                style="width: 100%; font-family: inherit; font-size: 0.875rem; padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color); background: var(--surface-main); color: var(--text-primary); resize: vertical; box-sizing: border-box;"
              >${this.options.initialText || SAMPLE_ROLES.python.text}</textarea>
              <p class="field-error" id="ju-text-error" style="margin: 4px 0 0; color: var(--color-danger); font-size: 0.8125rem;"></p>
            </div>
          </div>

          <!-- File Upload Tab View -->
          <div id="ju-file-view" ${this.activeTab !== 'file' ? 'hidden' : ''}>
            <div class="ju-dropzone" id="ju-dropzone" tabindex="0" role="button" aria-label="Drop JD file or click to browse">
              <div class="ju-dropzone-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </div>
              <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">
                Drag & Drop Job Description Document
              </div>
              <div class="text-sm text-muted">
                Accepts <strong>.pdf</strong>, <strong>.docx</strong>, or <strong>.txt</strong> (Max 10MB)
              </div>
              <input type="file" id="ju-file-input" accept=".pdf,.docx,.txt,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" style="display: none;">
            </div>

            <div id="ju-file-pill" style="display: none; margin-top: 12px; padding: 10px 14px; background: var(--surface-purple-subtle); border: 1px solid var(--brand-purple-border); border-radius: var(--radius-md); align-items: center; justify-content: space-between;">
              <span id="ju-file-name" style="font-size: 0.875rem; font-weight: 600; color: var(--brand-purple); display: flex; align-items: center; gap: 8px;"></span>
              <button type="button" id="ju-clear-file-btn" class="btn btn-outline btn-sm" style="padding: 2px 8px; font-size: 0.75rem;">Remove</button>
            </div>
          </div>

          <!-- Action & Extract Button -->
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 16px; flex-wrap: wrap; gap: 12px;">
            <div id="ju-status" class="text-sm text-muted" role="status">Ready to extract job requirements.</div>
            <button type="button" class="btn" id="ju-extract-btn" style="min-width: 190px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
              Extract Job Details
            </button>
          </div>
        </div>
      `;

      this.bindEvents();
    }

    bindEvents() {
      const root = this.container.querySelector('#ju-uploader-root');
      if (!root) return;

      const tabPaste = root.querySelector('#ju-tab-paste');
      const tabFile = root.querySelector('#ju-tab-file');
      const viewPaste = root.querySelector('#ju-paste-view');
      const viewFile = root.querySelector('#ju-file-view');
      const extractBtn = root.querySelector('#ju-extract-btn');
      const statusEl = root.querySelector('#ju-status');
      const textArea = root.querySelector('#ju-text-input');
      const fileInput = root.querySelector('#ju-file-input');
      const dropzone = root.querySelector('#ju-dropzone');
      const filePill = root.querySelector('#ju-file-pill');
      const fileNameEl = root.querySelector('#ju-file-name');
      const clearFileBtn = root.querySelector('#ju-clear-file-btn');

      // Tab switcher
      tabPaste.addEventListener('click', () => {
        this.activeTab = 'paste';
        tabPaste.classList.add('active');
        tabFile.classList.remove('active');
        tabPaste.setAttribute('aria-selected', 'true');
        tabFile.setAttribute('aria-selected', 'false');
        viewPaste.hidden = false;
        viewFile.hidden = true;
      });

      tabFile.addEventListener('click', () => {
        this.activeTab = 'file';
        tabFile.classList.add('active');
        tabPaste.classList.remove('active');
        tabFile.setAttribute('aria-selected', 'true');
        tabPaste.setAttribute('aria-selected', 'false');
        viewFile.hidden = false;
        viewPaste.hidden = true;
      });

      // Sample JD chips
      root.querySelectorAll('[data-sample-role]').forEach(btn => {
        btn.addEventListener('click', () => {
          const key = btn.dataset.sampleRole;
          if (SAMPLE_ROLES[key] && textArea) {
            textArea.value = SAMPLE_ROLES[key].text;
            if (window.JOBNEX && window.JOBNEX.showToast) {
              window.JOBNEX.showToast(`Loaded ${SAMPLE_ROLES[key].label} sample JD`, 'info');
            }
          }
        });
      });

      // File handling
      const handleSelectedFile = (file) => {
        if (!file) return;
        const extension = file.name.split('.').pop().toLowerCase();
        if (!['pdf', 'docx', 'txt'].includes(extension)) {
          this.currentFile = null;
          filePill.style.display = 'none';
          if (fileInput) fileInput.value = '';
          statusEl.textContent = 'Only PDF, DOCX, and TXT files are supported.';
          statusEl.style.color = 'var(--color-danger)';
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          this.currentFile = null;
          filePill.style.display = 'none';
          if (fileInput) fileInput.value = '';
          statusEl.textContent = 'The selected file exceeds the 10 MB limit.';
          statusEl.style.color = 'var(--color-danger)';
          return;
        }
        this.currentFile = file;
        statusEl.style.color = '';
        fileNameEl.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          ${file.name} <span class="text-muted text-sm">(${Math.round(file.size / 1024)} KB)</span>
        `;
        filePill.style.display = 'flex';
        statusEl.textContent = `File ready: ${file.name}`;
      };

      if (fileInput) {
        fileInput.addEventListener('change', e => {
          if (e.target.files && e.target.files[0]) {
            handleSelectedFile(e.target.files[0]);
          }
        });
      }

      if (dropzone) {
        dropzone.addEventListener('click', () => fileInput && fileInput.click());
        dropzone.addEventListener('keydown', e => {
          if ((e.key === 'Enter' || e.key === ' ') && fileInput) {
            e.preventDefault();
            fileInput.click();
          }
        });
        ['dragenter', 'dragover'].forEach(evt => {
          dropzone.addEventListener(evt, e => {
            e.preventDefault();
            dropzone.classList.add('dragover');
          });
        });
        ['dragleave', 'drop'].forEach(evt => {
          dropzone.addEventListener(evt, e => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
          });
        });
        dropzone.addEventListener('drop', e => {
          if (e.dataTransfer && e.dataTransfer.files.length) {
            handleSelectedFile(e.dataTransfer.files[0]);
          }
        });
      }

      if (clearFileBtn) {
        clearFileBtn.addEventListener('click', () => {
          this.currentFile = null;
          filePill.style.display = 'none';
          if (fileInput) fileInput.value = '';
          statusEl.style.color = '';
          statusEl.textContent = 'File removed.';
        });
      }

      // Extraction action
      extractBtn.addEventListener('click', async () => {
        await this.handleExtract();
      });
    }

    async handleExtract() {
      const root = this.container.querySelector('#ju-uploader-root');
      const statusEl = root.querySelector('#ju-status');
      const extractBtn = root.querySelector('#ju-extract-btn');
      const textArea = root.querySelector('#ju-text-input');
      const errEl = root.querySelector('#ju-text-error');

      let textContent = '';
      let sourceName = '';
      let uploadFile = null;

      if (this.activeTab === 'paste') {
        textContent = textArea ? textArea.value.trim() : '';
        if (!textContent) {
          if (errEl) errEl.textContent = 'Please paste a job description to extract.';
          return;
        }
        if (errEl) errEl.textContent = '';
      } else {
        if (!this.currentFile) {
          statusEl.textContent = 'Please choose a document to upload.';
          statusEl.style.color = 'var(--color-danger)';
          return;
        }
        sourceName = this.currentFile.name;
        uploadFile = this.currentFile;
        statusEl.style.color = '';
        statusEl.textContent = `Uploading ${sourceName}…`;
      }

      // Loading state
      extractBtn.disabled = true;
      extractBtn.innerHTML = '<span class="spinner" style="width: 14px; height: 14px;"></span> Extracting…';
      statusEl.textContent = 'Analyzing job requirements, skills, and qualifications…';

      try {
        const api = window.JOBNEX_API || {};
        let extracted = null;
        if (uploadFile && api.uploadJobDescription) {
          extracted = await api.uploadJobDescription(uploadFile);
        } else if (uploadFile) {
          throw new Error('Job-description file upload is unavailable.');
        } else if (api.parseJobDescription) {
          extracted = await api.parseJobDescription({ text: textContent, fileName: sourceName });
        } else {
          throw new Error('Job-description extraction is unavailable.');
        }

        statusEl.textContent = 'Extraction complete!';
        if (window.JOBNEX && window.JOBNEX.showToast) {
          window.JOBNEX.showToast(`Extracted requirements for "${extracted.title}"`, 'success');
        }

        // Store for state persistence
        try {
          localStorage.setItem('jobnex.current_extracted_jd', JSON.stringify(extracted));
        } catch (e) {}

        if (typeof this.options.onJobExtracted === 'function') {
          this.options.onJobExtracted(extracted);
        }
      } catch (err) {
        statusEl.textContent = 'Extraction error: ' + err.message;
        if (window.JOBNEX && window.JOBNEX.showToast) {
          window.JOBNEX.showToast('Extraction failed: ' + err.message, 'error');
        }
      } finally {
        extractBtn.disabled = false;
        extractBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> Extract Job Details';
      }
    }
  }

  window.JobUploader = JobUploader;
})();

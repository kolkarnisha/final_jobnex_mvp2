/**
 * SkillGapCard Component
 * Displays 3-tier Skill Gap Analysis:
 * 1. Skills Found (present in resume)
 * 2. Skills Missing (in JD, not detected)
 * 3. Critical Missing Skills (essential role requirements highlighted with priority pulse)
 * Connects directly to recommended courses to bridge gaps.
 */
(function () {
  'use strict';

  class SkillGapCard {
    constructor(container, options = {}) {
      this.container = typeof container === 'string' ? document.querySelector(container) : container;
      this.options = Object.assign({
        skillsFound: [],
        skillsMissing: [],
        criticalMissingSkills: [],
        coveragePercentage: 0
      }, options);

      this.render();
    }

    setSkillData(skillData) {
      this.options = Object.assign(this.options, skillData);
      this.render();
    }

    render() {
      if (!this.container) return;

      const found = this.options.skillsFound || [];
      const missing = this.options.skillsMissing || [];
      const critical = this.options.criticalMissingSkills || [];
      const coverage = Math.round(this.options.coveragePercentage || 0);

      const escape = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

      this.container.innerHTML = `
        <div class="card" id="skill-gap-card-root">
          <div class="card-header" style="flex-wrap: wrap; gap: 12px;">
            <div>
              <h3 style="margin: 0; font-size: 1.15rem; display: flex; align-items: center; gap: 8px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand-purple)" stroke-width="2.2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                Skill Gap Analysis
              </h3>
              <p class="text-sm text-muted" style="margin: 2px 0 0;">
                Comprehensive evaluation of candidate competencies against required and preferred specifications.
              </p>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <span class="badge badge-primary">${coverage}% Coverage</span>
            </div>
          </div>

          <!-- Critical Missing Skills Alert Banner (if any) -->
          ${critical.length > 0 ? `
            <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: var(--radius-md); padding: 14px 18px; margin-bottom: 20px; display: flex; align-items: flex-start; gap: 12px;">
              <span style="font-size: 1.25rem; line-height: 1;">🚨</span>
              <div style="flex: 1;">
                <div style="font-weight: 700; color: #991B1B; font-size: 0.9375rem; margin-bottom: 2px;">
                  Critical Competencies Missing (${critical.length})
                </div>
                <div style="font-size: 0.8125rem; color: #7F1D1D; margin-bottom: 8px;">
                  These skills are explicitly listed as required core prerequisites in the job posting. Automated applicant filtering may disqualify candidates lacking these terms.
                </div>
                <div class="jd-tag-cloud">
                  ${critical.map(skill => `
                    <span class="critical-pill">
                      <span>⚡</span> ${escape(skill)}
                    </span>
                  `).join('')}
                </div>
              </div>
            </div>
          ` : `
            <div style="background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: var(--radius-md); padding: 12px 16px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 1.15rem; color: #047857;">✓</span>
              <div style="font-size: 0.875rem; color: #065F46; font-weight: 600;">
                Great news! All required core prerequisite competencies were identified in your profile.
              </div>
            </div>
          `}

          <!-- Three Tier Skills Breakdown -->
          <div class="grid-2" style="margin-bottom: 20px;">
            <!-- Skills Found -->
            <div style="background: var(--surface-muted); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px;">
              <h4 style="margin: 0 0 10px; font-size: 0.9375rem; color: #065F46; display: flex; align-items: center; justify-content: space-between;">
                <span style="display: flex; align-items: center; gap: 6px;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Skills Found (${found.length})
                </span>
                <span class="badge" style="background: #D1FAE5; color: #065F46; font-size: 0.75rem;">Verified</span>
              </h4>
              <div class="jd-tag-cloud">
                ${found.length > 0
                  ? found.map(skill => `
                      <span class="matched-pill">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        ${escape(skill)}
                      </span>
                    `).join('')
                  : '<span class="text-sm text-muted">No matching skills detected.</span>'
                }
              </div>
            </div>

            <!-- Skills Missing (Secondary & Preferred) -->
            <div style="background: var(--surface-muted); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px;">
              <h4 style="margin: 0 0 10px; font-size: 0.9375rem; color: #9A3412; display: flex; align-items: center; justify-content: space-between;">
                <span style="display: flex; align-items: center; gap: 6px;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Skills Missing (${missing.length})
                </span>
                <span class="badge" style="background: #FEF3C7; color: #9A3412; font-size: 0.75rem;">To Address</span>
              </h4>
              <div class="jd-tag-cloud">
                ${missing.length > 0
                  ? missing.map(skill => `
                      <span class="missing-pill">
                        ${escape(skill)}
                      </span>
                    `).join('')
                  : '<span class="text-sm text-muted">No secondary skill gaps detected!</span>'
                }
              </div>
            </div>
          </div>

          <!-- Upskilling CTA Connection to Courses -->
          <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 14px; border-top: 1px solid var(--border-subtle); flex-wrap: wrap; gap: 12px;">
            <div class="text-sm text-muted">
              Looking to bridge these competencies quickly with verified credentials?
            </div>
            <a href="courses.html" class="btn btn-secondary btn-sm" id="sg-bridge-courses-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
              Bridge Gaps via Recommended Courses &rarr;
            </a>
          </div>
        </div>
      `;

      // Store missing skills so Courses page can read them
      try {
        if (missing.length > 0) {
          localStorage.setItem('jobnex.missing', JSON.stringify(missing));
        }
      } catch (e) {}
    }
  }

  window.SkillGapCard = SkillGapCard;
})();

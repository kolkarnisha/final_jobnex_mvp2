/**
 * RecruiterDashboardCards Component (Section A)
 * Displays top-level recruiter KPI metrics:
 * - Total Jobs
 * - Active Jobs
 * - Candidates Applied
 * - Interviews Scheduled
 * - Hires Completed
 */
(function () {
  'use strict';

  class RecruiterDashboardCards {
    constructor(container, options = {}) {
      this.container = typeof container === 'string' ? document.querySelector(container) : container;
      this.options = Object.assign({
        metrics: null
      }, options);

      this.data = this.options.metrics;
      this.render();
    }

    setMetrics(metrics) {
      this.data = metrics;
      this.render();
    }

    render() {
      if (!this.container) return;

      const m = this.data || {
        totalJobs: 0,
        activeJobs: 0,
        candidatesApplied: 0,
        interviewsScheduled: 0,
        hiresCompleted: 0,
        trends: {
          jobsTrend: 'No data available',
          activeTrend: 'No active requisitions',
          candidatesTrend: 'No data available',
          interviewsTrend: 'No interviews scheduled',
          hiresTrend: 'No hires completed'
        }
      };

      const trends = m.trends || {};

      this.container.innerHTML = `
        <div class="rec-kpi-grid" id="rec-kpi-grid-root">
          <!-- Total Jobs -->
          <div class="rec-kpi-card">
            <div class="rec-kpi-top">
              <span class="rec-kpi-label">Total Jobs</span>
              <div class="rec-kpi-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              </div>
            </div>
            <div class="rec-kpi-value">${m.totalJobs}</div>
            <div class="rec-kpi-trend positive">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              ${trends.jobsTrend || 'All time'}
            </div>
          </div>

          <!-- Active Jobs -->
          <div class="rec-kpi-card">
            <div class="rec-kpi-top">
              <span class="rec-kpi-label">Active Jobs</span>
              <div class="rec-kpi-icon" style="background: #ECFDF5; color: #059669;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
              </div>
            </div>
            <div class="rec-kpi-value" style="color: #059669;">${m.activeJobs}</div>
            <div class="rec-kpi-trend positive">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="6" fill="#10B981"/></svg>
              ${trends.activeTrend || 'Accepting candidates'}
            </div>
          </div>

          <!-- Candidates Applied -->
          <div class="rec-kpi-card">
            <div class="rec-kpi-top">
              <span class="rec-kpi-label">Candidates Applied</span>
              <div class="rec-kpi-icon" style="background: #EFF6FF; color: #2563EB;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
            </div>
            <div class="rec-kpi-value" style="color: #2563EB;">${m.candidatesApplied}</div>
            <div class="rec-kpi-trend positive">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              ${trends.candidatesTrend || '+18% this month'}
            </div>
          </div>

          <!-- Interviews Scheduled -->
          <div class="rec-kpi-card">
            <div class="rec-kpi-top">
              <span class="rec-kpi-label">Interviews Scheduled</span>
              <div class="rec-kpi-icon" style="background: #FFFBEB; color: #D97706;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
            </div>
            <div class="rec-kpi-value" style="color: #D97706;">${m.interviewsScheduled}</div>
            <div class="rec-kpi-trend neutral">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${trends.interviewsTrend || 'In progress'}
            </div>
          </div>

          <!-- Hires Completed -->
          <div class="rec-kpi-card">
            <div class="rec-kpi-top">
              <span class="rec-kpi-label">Hires Completed</span>
              <div class="rec-kpi-icon" style="background: #F3E8FF; color: #7C3AED;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
            </div>
            <div class="rec-kpi-value" style="color: var(--brand-purple);">${m.hiresCompleted}</div>
            <div class="rec-kpi-trend positive">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg>
              ${trends.hiresTrend || 'On target'}
            </div>
          </div>
        </div>
      `;
    }
  }

  window.RecruiterDashboardCards = RecruiterDashboardCards;
})();

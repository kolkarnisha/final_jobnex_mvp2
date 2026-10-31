/**
 * RecruitmentAnalytics Component (Section F)
 * Displays deep recruitment analytics & metric visualizations:
 * 1. Hiring Funnel (stepped funnel with stage dropouts)
 * 2. Source Effectiveness (channels & hire ratios)
 * 3. Time To Hire (stage duration breakdown vs benchmark)
 * 4. Candidate Conversion Rate & Offer Acceptance Rate
 */
(function () {
  'use strict';

  class RecruitmentAnalytics {
    constructor(container, options = {}) {
      this.container = typeof container === 'string' ? document.querySelector(container) : container;
      this.options = Object.assign({
        analyticsData: null
      }, options);

      this.data = this.options.analyticsData;
      this.render();
    }

    setAnalyticsData(data) {
      this.data = data;
      this.render();
    }

    render() {
      if (!this.container) return;

      const d = this.data || {
        totalCandidates: 0,
        funnel: [],
        sources: [],
        timeToHireDays: {
          average: 0,
          industryBenchmark: 24.5,
          breakdown: { sourcingDays: 0, screeningDays: 0, techRoundDays: 0, offerDays: 0 }
        },
        conversionRate: {
          overallConversionPct: 0,
          offerAcceptancePct: 0,
          totalOffers: 0,
          totalHires: 0
        }
      };

      const escape = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
      const timeToHire = Number(d.timeToHireDays.average) || 0;
      const benchmark = Number(d.timeToHireDays.industryBenchmark) || 0;
      const timeDelta = benchmark - timeToHire;
      const timeComparison = timeToHire
        ? `${timeDelta >= 0 ? '-' : '+'}${Math.abs(timeDelta).toFixed(1)} Days vs Industry`
        : 'No completed hires yet';

      this.container.innerHTML = `
        <div class="card" id="rec-analytics-root">
          <div class="card-header" style="flex-wrap: wrap; gap: 12px;">
            <div>
              <h2 style="margin: 0; font-size: 1.25rem; display: flex; align-items: center; gap: 8px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand-purple)" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                Recruitment Metrics & Analytics
              </h2>
              <p class="text-sm text-muted" style="margin: 2px 0 0;">
                Comprehensive pipeline telemetry, channel performance, and velocity benchmarking.
              </p>
            </div>
            <span class="badge badge-primary">Live Pipeline Data</span>
          </div>

          <div class="analytics-grid">
            <!-- 1. Hiring Funnel -->
            <div style="background: var(--surface-muted); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 20px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <h3 style="margin: 0; font-size: 1rem; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                  Hiring Funnel Velocity
                </h3>
                <span class="badge badge-neutral" style="font-size: 0.75rem;">${d.totalCandidates || 0} Candidates</span>
              </div>
              <p class="text-xs text-muted" style="margin: 0 0 14px;">Conversion progression from initial application to hire.</p>

              <div class="funnel-container">
                ${(d.funnel || []).map(f => `
                  <div class="funnel-step">
                    <span class="funnel-step-name">${escape(f.stage)}</span>
                    <div class="funnel-bar-wrap">
                      <div class="funnel-bar-fill" style="width: ${Math.max(12, f.conversionRate)}%;">
                        ${f.count} (${f.conversionRate}%)
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- 2. Source Effectiveness -->
            <div style="background: var(--surface-muted); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 20px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <h3 style="margin: 0; font-size: 1rem; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M16.2 7.8l-2 6.3-6.4 2.1 2-6.3z"/></svg>
                  Source Effectiveness
                </h3>
                <span class="badge badge-success" style="font-size: 0.75rem;">Quality of Hire</span>
              </div>
              <p class="text-xs text-muted" style="margin: 0 0 14px;">Candidate acquisition volume and completed hires by channel.</p>

              <div>
                ${(d.sources || []).map(s => `
                  <div class="source-stat-row">
                    <div>
                      <div style="font-weight: 600; color: var(--text-primary);">${escape(s.source)}</div>
                      <div class="text-xs text-muted">${s.candidatesCount} candidates • ${s.hiresCount} hired</div>
                    </div>
                    <div style="text-align: right;">
                      <span style="font-weight: 700; color: var(--brand-purple);">${s.percentage}%</span>
                      <div class="viz-bar-bg" style="width: 80px; height: 6px; margin-top: 4px;">
                        <div class="viz-bar-fill" style="width: ${s.percentage}%; background: var(--brand-purple);"></div>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- 3. Time To Hire -->
            <div style="background: var(--surface-muted); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 20px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <h3 style="margin: 0; font-size: 1rem; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Time To Hire Velocity
                </h3>
                <span class="badge ${timeToHire && timeDelta >= 0 ? 'badge-success' : 'badge-neutral'}" style="font-size: 0.75rem;">${escape(timeComparison)}</span>
              </div>
              <p class="text-xs text-muted" style="margin: 0 0 14px;">Average days spent across key recruitment milestones.</p>

              <div style="display: flex; align-items: baseline; gap: 10px; margin-bottom: 12px;">
                <span style="font-size: 2.2rem; font-weight: 800; color: #059669; line-height: 1;">
                  ${d.timeToHireDays.average} Days
                </span>
                <span class="text-sm text-muted">
                  vs <strong>${d.timeToHireDays.industryBenchmark} days</strong> industry average
                </span>
              </div>

              <div style="display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; justify-content: space-between; font-size: 0.8125rem;">
                  <span>Sourcing & Screening</span>
                  <strong>${d.timeToHireDays.breakdown.sourcingDays + d.timeToHireDays.breakdown.screeningDays}d</strong>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.8125rem;">
                  <span>Technical & Coding Evaluations</span>
                  <strong>${d.timeToHireDays.breakdown.techRoundDays}d</strong>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.8125rem;">
                  <span>Final Decision & Offer Rollout</span>
                  <strong>${d.timeToHireDays.breakdown.offerDays}d</strong>
                </div>
              </div>
            </div>

            <!-- 4. Candidate Conversion Rate -->
            <div style="background: var(--surface-muted); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 20px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <h3 style="margin: 0; font-size: 1rem; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  Candidate Conversion Rate
                </h3>
                <span class="badge badge-primary" style="font-size: 0.75rem;">High Yield</span>
              </div>
              <p class="text-xs text-muted" style="margin: 0 0 14px;">End-to-end recruitment yield and offer acceptance efficiency.</p>

              <div class="grid-2" style="margin-top: 10px;">
                <div style="background: var(--surface-main); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px; text-align: center;">
                  <div style="font-size: 1.8rem; font-weight: 800; color: var(--brand-purple); line-height: 1; margin-bottom: 4px;">
                    ${d.conversionRate.overallConversionPct}%
                  </div>
                  <div class="text-xs text-muted font-semibold">OVERALL CONVERSION</div>
                  <div class="text-xs text-secondary" style="margin-top: 4px;">${d.conversionRate.totalHires} hires from 186 applicants</div>
                </div>

                <div style="background: var(--surface-main); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px; text-align: center;">
                  <div style="font-size: 1.8rem; font-weight: 800; color: #10B981; line-height: 1; margin-bottom: 4px;">
                    ${d.conversionRate.offerAcceptancePct}%
                  </div>
                  <div class="text-xs text-muted font-semibold">OFFER ACCEPTANCE</div>
                  <div class="text-xs text-secondary" style="margin-top: 4px;">${d.conversionRate.totalHires} accepted of ${d.conversionRate.totalOffers} offers</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  }

  window.RecruitmentAnalytics = RecruitmentAnalytics;
})();

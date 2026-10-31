/**
 * MatchScoreWidget Component
 * Displays the Circular ATS Match Score gauge (Score out of 100)
 * along with match visualization cards:
 * - ATS Score Progress Bar
 * - Keyword Match Percentage
 * - Skill Coverage Percentage
 */
(function () {
  'use strict';

  class MatchScoreWidget {
    constructor(container, options = {}) {
      this.container = typeof container === 'string' ? document.querySelector(container) : container;
      this.options = Object.assign({
        score: 0,
        scoreLabel: 'Evaluating…',
        keywordMatchPct: 0,
        skillCoveragePct: 0,
        passingBenchmark: 75
      }, options);

      this.score = this.options.score;
      this.render();
    }

    setScoreData(scoreData) {
      this.options = Object.assign(this.options, scoreData);
      this.score = this.options.score;
      this.render();
    }

    render() {
      if (!this.container) return;
      const score = Math.min(100, Math.max(0, Math.round(this.score || 0)));
      const kwPct = Math.min(100, Math.max(0, Math.round(this.options.keywordMatchPct || 0)));
      const skillPct = Math.min(100, Math.max(0, Math.round(this.options.skillCoveragePct || 0)));
      const benchmark = this.options.passingBenchmark || 75;

      // SVG Circle circumference: 2 * Math.PI * radius (radius = 54) => ~339.29
      const radius = 54;
      const circumference = 2 * Math.PI * radius;
      const strokeDashoffset = circumference - (circumference * score) / 100;

      // Color coding
      let strokeColor = 'var(--brand-purple)';
      let tierClass = 'strong';
      let tierText = 'Strong ATS Alignment';
      let tierIcon = '✓';

      if (score >= 80) {
        strokeColor = '#10B981'; // Success Emerald
        tierClass = 'strong';
        tierText = 'Strong ATS Alignment';
      } else if (score >= 60) {
        strokeColor = '#D97706'; // Warning Amber
        tierClass = 'moderate';
        tierText = 'Moderate Alignment – Needs Tailoring';
        tierIcon = '⚠️';
      } else {
        strokeColor = '#DC2626'; // Danger Rose
        tierClass = 'gaps';
        tierText = 'Critical Gaps Detected';
        tierIcon = '!';
      }

      this.container.innerHTML = `
        <div class="match-score-widget" id="match-score-widget-root">
          <!-- Circular Score Card -->
          <div class="circular-gauge-wrap" aria-label="ATS Match Score: ${score} out of 100">
            <svg viewBox="0 0 130 130">
              <circle class="circular-gauge-bg" cx="65" cy="65" r="${radius}"></circle>
              <circle
                class="circular-gauge-fill"
                cx="65"
                cy="65"
                r="${radius}"
                style="stroke: ${strokeColor}; stroke-dasharray: ${circumference}; stroke-dashoffset: ${circumference};"
                id="circ-fill-ring"
              ></circle>
            </svg>
            <div class="circular-gauge-content">
              <span class="circular-score-val" id="circ-score-num">${score}</span>
              <span class="circular-score-max">OUT OF 100</span>
            </div>
          </div>

          <!-- Score Overview Meta -->
          <div class="match-score-meta">
            <div class="match-tier-badge ${tierClass}">
              <span>${tierIcon}</span>
              <span>${tierText}</span>
            </div>
            <h3 style="margin: 0 0 6px; font-size: 1.2rem; color: var(--text-primary);">
              ATS Resume Match Analysis
            </h3>
            <p class="text-sm text-muted" style="margin: 0 0 16px; line-height: 1.5;">
              Evaluates keyword density, core competency coverage, and role seniority against the target specification.
              ${score >= benchmark
                ? `Exceeds the target <strong>${benchmark}% passing threshold</strong> for automated recruiter screening.`
                : `Currently below the <strong>${benchmark}% target benchmark</strong>. Review recommendations below to boost score.`}
            </p>

            <!-- Match Visualization Cards -->
            <div class="match-viz-grid">
              <!-- ATS Score Progress -->
              <div class="viz-card">
                <div class="viz-label">
                  <span>ATS Match Progress</span>
                  <strong style="color: ${strokeColor};">${score}%</strong>
                </div>
                <div class="viz-bar-bg">
                  <div class="viz-bar-fill" style="width: 0%; background: ${strokeColor};" id="viz-ats-bar"></div>
                </div>
                <span class="text-muted" style="font-size: 0.75rem; margin-top: 4px; display: block;">Benchmark: ${benchmark}%</span>
              </div>

              <!-- Keyword Match -->
              <div class="viz-card">
                <div class="viz-label">
                  <span>Keyword Overlap</span>
                  <strong style="color: #2563EB;">${kwPct}%</strong>
                </div>
                <div class="viz-bar-bg">
                  <div class="viz-bar-fill" style="width: 0%; background: #2563EB;" id="viz-kw-bar"></div>
                </div>
                <span class="text-muted" style="font-size: 0.75rem; margin-top: 4px; display: block;">JD Keywords Matched</span>
              </div>

              <!-- Skill Coverage -->
              <div class="viz-card">
                <div class="viz-label">
                  <span>Skill Coverage</span>
                  <strong style="color: var(--brand-purple);">${skillPct}%</strong>
                </div>
                <div class="viz-bar-bg">
                  <div class="viz-bar-fill" style="width: 0%; background: var(--brand-purple);" id="viz-skill-bar"></div>
                </div>
                <span class="text-muted" style="font-size: 0.75rem; margin-top: 4px; display: block;">Core Stack Verified</span>
              </div>
            </div>
          </div>
        </div>
      `;

      // Animate progress after mount
      setTimeout(() => {
        const ring = this.container.querySelector('#circ-fill-ring');
        if (ring) ring.style.strokeDashoffset = strokeDashoffset;
        const atsBar = this.container.querySelector('#viz-ats-bar');
        if (atsBar) atsBar.style.width = `${score}%`;
        const kwBar = this.container.querySelector('#viz-kw-bar');
        if (kwBar) kwBar.style.width = `${kwPct}%`;
        const skillBar = this.container.querySelector('#viz-skill-bar');
        if (skillBar) skillBar.style.width = `${skillPct}%`;
      }, 50);
    }
  }

  window.MatchScoreWidget = MatchScoreWidget;
})();

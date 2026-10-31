/* ==========================================================================
   JOBNEX - API client (frontend <-> FastAPI backend)

   * Every function here calls a REAL backend route (see backend/main.py, analyzer.py).
   * Backend JSON is translated ("adapted") into the shapes common.js already renders,
     so the page code did not need to change.
   * Auth is a signed session cookie (jobnex_session) set by the backend, so every request
     is sent with credentials. Best setup: let FastAPI serve this folder and open
     http://127.0.0.1:8000/  -> same origin, no CORS, cookie "just works".
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- 1. Where is the backend? ---------- */
  function resolveBase() {
    // Explicit override (set before api.js loads):  <script>window.JOBNEX_API_BASE='https://api.example.com'</script>
    if (typeof window.JOBNEX_API_BASE === 'string') return window.JOBNEX_API_BASE.replace(/\/$/, '');
    try {
      const saved = localStorage.getItem('jobnex.apiBase');           // dev override from the console
      if (saved) return saved.replace(/\/$/, '');
    } catch (e) { /* storage blocked */ }
    const { protocol, hostname, port } = location;
    if (protocol === 'file:') return 'http://127.0.0.1:8000';          // works only for public calls (CORS blocks cookies)
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    if (isLocal && port && port !== '8000') return `${protocol}//${hostname}:8000`; // Live Server / Vite -> API on :8000
    return '';                                                         // served by FastAPI itself: same origin
  }
  const BASE = resolveBase();

  const SESSION_KEY = 'jobnex.session';
  const AUTH_PATHS = ['/api/auth/login', '/api/auth/register', '/api/auth/me', '/api/auth/providers'];

  function clearLocalSession() {
    try { sessionStorage.removeItem(SESSION_KEY); localStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
  }

  /* ---------- 2. One fetch wrapper for everything ---------- */
  async function request(path, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeout || 15000);
    const { timeout, noAuthRedirect, ...fetchOptions } = options;
    let response;
    try {
      response = await fetch(BASE + path, {
        credentials: 'include',                       // send/receive the session cookie
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          ...(fetchOptions.body && !(fetchOptions.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
          ...(fetchOptions.headers || {})
        }
      });
    } catch (err) {
      clearTimeout(timer);
      const e = new Error(err.name === 'AbortError'
        ? 'The server took too long to respond. Please try again.'
        : 'Cannot reach the JOBNEX server. Start the backend (uvicorn main:app --reload in /backend) and open http://127.0.0.1:8000');
      e.status = err.name === 'AbortError' ? 408 : 0;
      throw e;
    }
    clearTimeout(timer);

    const isJson = (response.headers.get('content-type') || '').includes('application/json');
    const payload = isJson ? await response.json() : { error: await response.text() };

    if (!response.ok) {
      // Session expired / not signed in -> back to the login page (but not while logging in).
      if (response.status === 401 && !noAuthRedirect && !AUTH_PATHS.includes(path)) {
        clearLocalSession();
        if (!location.pathname.endsWith('login.html')) location.replace('login.html');
      }
      const err = new Error(errorMessage(payload, response.status));
      err.status = response.status;
      err.code = payload && payload.code;
      err.payload = payload;
      throw err;
    }
    return payload;
  }

  // Backend errors look like {"error": "...", "code": "..."} (+ "details" for validation errors).
  function errorMessage(payload, status) {
    if (payload && Array.isArray(payload.details) && payload.details.length) {
      return payload.details
        .map(d => `${d.field ? d.field + ': ' : ''}${String(d.message || '').replace(/^Value error, /, '')}`)
        .join('; ');
    }
    if (payload && typeof payload.error === 'string' && payload.error) return payload.error;
    if (payload && typeof payload.detail === 'string') return payload.detail;
    return `Request failed with status ${status}`;
  }

  /* ---------- 3. Adapters: backend JSON -> shapes common.js renders ---------- */
  const REGION_TO_UI = { BANGALORE: 'bengaluru', INDIA: 'india', US: 'usa', GLOBAL: 'global' };
  const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

  function adaptAnalysis(data) {
    return {
      ...data,
      matched_score: Number(data.match_score) || 0,                       // UI reads matched_score
      suggestions: (data.sugesstions || []).map(s => (typeof s === 'string' ? s : s.text)).filter(Boolean) // backend key keeps its spelling
    };
  }

  function adaptJob(job) {
    return {
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location || 'Remote',
      region: REGION_TO_UI[job.region] || 'global',
      exp: job.experience_level || '',
      certs: (job.certifications || '').split(',').map(c => c.trim()).filter(Boolean),
      job_type: job.job_type || 'Full-time',
      skills: job.skills || '',
      description: job.description,
      match: null,                                                         // unknown until a resume is matched; UI hides the pill
      url: null
    };
  }

  function adaptApplication(a) {
    return {
      application_id: a.id,
      job_id: a.job_id,
      company: a.company,
      job_title: a.job_title,
      created_at: a.created_at,
      status: cap(a.status)                                               // 'applied' -> 'Applied'
    };
  }

  /* ---------- 4. Public API ---------- */
  const api = window.JOBNEX_API || {};
  api.baseUrl = BASE;

  // --- health & auth ---
  api.checkHealth = async () => {
    try { return await request('/api/health', { timeout: 4000 }); }
    catch (e) { return { status: 'offline' }; }
  };
  api.getAuthProviders = async () => {
    try { return await request('/api/auth/providers', { timeout: 4000 }); }
    catch (e) { return { password: true, google: false }; }
  };
  api.register = ({ email, password, name }) =>
    request('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name: name || null }) });
  api.signInWithEmail = ({ email, password }) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  api.me = () => request('/api/auth/me', { noAuthRedirect: true });
  api.logout = async () => {
    try { await request('/api/auth/logout', { method: 'POST', noAuthRedirect: true }); } catch (e) { /* already signed out */ }
    sessionStorage.removeItem('jobnex.chatHistory');
  };
  api.googleLoginUrl = () => `${BASE}/api/auth/google/login`;

  // --- resume analyzer ---
  api.analyzeResume = async ({ resumeText, jdText, region }) => {
    const body = { resume_text: resumeText, jd_text: jdText };
    if (region) body.region_filter = region;
    return adaptAnalysis(await request('/api/analyzer/analyze', { method: 'POST', body: JSON.stringify(body), timeout: 30000 }));
  };
  api.getAnalyses = () => request('/api/applications');                  // saved analyses (summaries)

  // --- jobs ---
  api.searchJobs = async (keyword = '', limit = 20) => {
    const query = new URLSearchParams({ limit: String(limit) });
    if (keyword && keyword.trim()) query.set('q', keyword.trim());
    const res = await request(`/api/jobs?${query}`);
    return { jobs: (res.items || []).map(adaptJob), total: res.total };
  };

  // --- application tracker ---
  api.queueApplication = async (application) => {
    const created = await request('/api/job-applications', {
      method: 'POST',
      body: JSON.stringify({
        company: application.company,
        job_title: application.job_title || application.jobTitle,
        job_id: typeof application.job_id === 'number' ? application.job_id : null,
        job_url: application.job_url || application.jobUrl || null
      })
    });
    return adaptApplication(created);
  };
  api.getApplications = async () => {
    const res = await request('/api/job-applications');
    return { applications: (res.items || []).map(adaptApplication), total: res.total };
  };
  api.updateApplicationStatus = async (id, status) =>
    adaptApplication(await request(`/api/job-applications/${encodeURIComponent(id)}/status`, {
      method: 'PATCH', body: JSON.stringify({ status: String(status).toLowerCase() })
    }));
  api.deleteApplication = (id) =>
    request(`/api/job-applications/${encodeURIComponent(id)}`, { method: 'DELETE' });

  // --- interview + courses (AI/catalog helpers) ---
  api.generateInterviewQuestions = ({ matchedSkills = [], missingSkills = [], count = 10 }) =>
    request('/api/interview/questions', {
      method: 'POST', timeout: 30000,
      body: JSON.stringify({ matched_skills: matchedSkills, missing_skills: missingSkills, count })
    });
  api.suggestCourses = (missingSkills = []) =>
    request('/api/courses/suggest', { method: 'POST', body: JSON.stringify({ missing_skills: missingSkills }) });

  // --- privacy (per saved analysis) ---
  api.setPrivacy = (analysisId, privacySetting) =>
    request(`/api/privacy/${encodeURIComponent(analysisId)}`, { method: 'PUT', body: JSON.stringify({ privacy_setting: privacySetting }) });

  // --- AI chat copilot ---
  // The backend is stateless: we send the recent turns with every message and keep them
  // in sessionStorage so a page refresh keeps the conversation going.
  const HISTORY_KEY = 'jobnex.chatHistory';
  const loadHistory = () => { try { return JSON.parse(sessionStorage.getItem(HISTORY_KEY) || '[]'); } catch (e) { return []; } };
  const saveHistory = h => { try { sessionStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(-20))); } catch (e) { /* ignore */ } };

  api.chat = async ({ message }) => {
    const history = loadHistory().slice(-20).map(m => ({ role: m.role, content: String(m.content).slice(0, 4000) }));
    const payload = await request('/api/chat', {
      method: 'POST', timeout: 40000,
      body: JSON.stringify({ message: String(message).slice(0, 4000), history })
    });
    saveHistory([...history, { role: 'user', content: message }, { role: 'assistant', content: payload.reply }]);
    return { ...payload, text: payload.reply || '' };
  };
  api.clearChat = async () => { sessionStorage.removeItem(HISTORY_KEY); };

  /* ---------- 5. Feature 1: Job Description Parser & ATS Tailoring Analysis ---------- */

  const COMMON_TECH_SKILLS = [
    'Python', 'FastAPI', 'Django', 'Flask', 'React', 'TypeScript', 'JavaScript', 'Node.js',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure',
    'CI/CD', 'GraphQL', 'REST APIs', 'Kafka', 'Terraform', 'Linux', 'Java', 'Spring Boot',
    'Go', 'Next.js', 'Vue.js', 'Angular', 'Tailwind CSS', 'HTML5', 'CSS3', 'Git', 'Jest',
    'Cypress', 'Pandas', 'NumPy', 'SQL', 'Microservices', 'System Design', 'Agile', 'Scrum'
  ];

  api.parseJobDescription = async ({ text = '', fileName = '' }) => {
    // Try real backend endpoint if present
    try {
      if (BASE) {
        return await request('/api/job/parse', {
          method: 'POST',
          body: JSON.stringify({ text, file_name: fileName }),
          timeout: 10000
        });
      }
    } catch (e) { /* fall back to client semantic extraction */ }

    // Client NLP & heuristics extractor
    const cleanText = String(text || '').trim();
    const lines = cleanText.split('\n').map(l => l.trim()).filter(Boolean);

    // Heuristic Title Detection
    let title = 'Software Engineer';
    const titleMatch = cleanText.match(/(?:title|role|position|hiring for|job title)\s*[:\-]\s*([^\n\r,]+)/i) ||
      cleanText.match(/^([A-Z][A-Za-z0-9\s\/\-\(\)]+(?:Engineer|Developer|Architect|Lead|Manager|Specialist|Analyst|Designer))/m);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim().slice(0, 60);
    } else if (lines.length > 0 && lines[0].length < 60) {
      title = lines[0].replace(/^#+\s*/, '').trim();
    }

    // Heuristic Company Detection
    let company = 'Enterprise Tech';
    const compMatch = cleanText.match(/(?:company|at|organization|client)\s*[:\-]\s*([^\n\r,]+)/i) ||
      cleanText.match(/(?:welcome to|join)\s+([A-Z][A-Za-z0-9\s&]+?)(?:'s|\s+team|\s+as|\.|\n)/i);
    if (compMatch && compMatch[1]) {
      company = compMatch[1].trim().slice(0, 40);
    }

    // Heuristic Experience Detection
    let experience = '3+ years experience';
    const expMatch = cleanText.match(/(\d+\+?\s*(?:to\s*\d+\s*)?(?:years?|yrs?)(?:\s+of)?(?:\s+experience)?)/i);
    if (expMatch && expMatch[1]) {
      experience = expMatch[1].trim();
    }

    // Skill Extraction
    const lowerText = cleanText.toLowerCase();
    const detectedSkills = COMMON_TECH_SKILLS.filter(skill => {
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|[^a-zA-Z0-9+#.])${escaped}([^a-zA-Z0-9+#.]|$)`, 'i');
      return regex.test(lowerText);
    });

    // Partition into Required vs Preferred
    const reqIndex = lowerText.search(/required|requirements|must have|minimum qualifications/i);
    const prefIndex = lowerText.search(/preferred|nice to have|plus|bonus|desired qualifications/i);

    let requiredSkills = [];
    let preferredSkills = [];

    if (prefIndex > -1 && prefIndex > reqIndex) {
      const reqPart = lowerText.slice(reqIndex, prefIndex);
      const prefPart = lowerText.slice(prefIndex);
      requiredSkills = detectedSkills.filter(s => reqPart.includes(s.toLowerCase()));
      preferredSkills = detectedSkills.filter(s => prefPart.includes(s.toLowerCase()));
    }

    if (requiredSkills.length === 0) {
      requiredSkills = detectedSkills.slice(0, Math.ceil(detectedSkills.length * 0.7));
      preferredSkills = detectedSkills.slice(Math.ceil(detectedSkills.length * 0.7));
    }

    if (requiredSkills.length === 0) {
      requiredSkills = ['JavaScript', 'React', 'REST APIs', 'Git'];
      preferredSkills = ['TypeScript', 'Docker', 'AWS'];
    }

    // Responsibilities Extraction
    const respMatches = lines.filter(l => /^[•\-\*]\s+|^\d+\.\s+|(responsibilities|duties|what you will do|you will)/i.test(l))
      .map(l => l.replace(/^[•\-\*\d\.]+\s*/, '').trim())
      .filter(l => l.length > 25 && l.length < 240);

    const responsibilities = respMatches.length >= 3
      ? respMatches.slice(0, 6)
      : [
          'Design, develop, and maintain resilient, scalable microservices and user interfaces.',
          'Collaborate closely with cross-functional product, UX, and QA team members in agile sprint cycles.',
          'Optimize system performance, enforce rigorous unit and integration testing standards, and monitor production uptime.',
          'Participate in architectural reviews, mentoring junior engineers, and championing best engineering practices.'
        ];

    // Keywords Extraction
    const STOP = new Set('and the for with you our are will have has this that from your their they not but can all any who use using able also into more must such than then them these those its was were been being work team years experience candidate knowledge'.split(' '));
    const tokenWords = cleanText.toLowerCase().match(/[a-z][a-z0-9+#.]{2,}/g) || [];
    const keywordFreq = {};
    tokenWords.forEach(w => {
      const cleanW = w.replace(/\.$/, '');
      if (!STOP.has(cleanW) && cleanW.length > 2) {
        keywordFreq[cleanW] = (keywordFreq[cleanW] || 0) + 1;
      }
    });

    const topKeywords = Object.entries(keywordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 16)
      .map(entry => entry[0].charAt(0).toUpperCase() + entry[0].slice(1));

    return {
      title,
      company,
      location: 'Remote / Hybrid',
      jobType: 'Full-time',
      experience,
      requiredSkills,
      preferredSkills,
      keywords: topKeywords.length ? topKeywords : ['Architecture', 'Performance', 'CI/CD', 'Scalability', 'Microservices'],
      responsibilities,
      rawText: cleanText,
      sourceFile: fileName || null
    };
  };

  api.analyzeJobMatch = async ({ resumeText = '', jobDetails = {} }) => {
    try {
      if (BASE) {
        return await request('/api/analyzer/job-match', {
          method: 'POST',
          body: JSON.stringify({ resume_text: resumeText, job_details: jobDetails }),
          timeout: 20000
        });
      }
    } catch (e) { /* fall back to client scoring */ }

    const resumeLower = (resumeText || '').toLowerCase();
    const reqSkills = jobDetails.requiredSkills || ['React', 'Python', 'SQL', 'Docker', 'AWS'];
    const prefSkills = jobDetails.preferredSkills || ['FastAPI', 'TypeScript', 'Kubernetes'];
    const allJobSkills = [...new Set([...reqSkills, ...prefSkills])];
    const keywords = jobDetails.keywords || ['Microservices', 'REST APIs', 'Cloud', 'Architecture', 'Testing'];

    // 1. Skill evaluation
    const skillsFound = allJobSkills.filter(skill => {
      const esc = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`(^|[^a-zA-Z0-9+#.])${esc}([^a-zA-Z0-9+#.]|$)`, 'i').test(resumeLower);
    });
    const skillsMissing = allJobSkills.filter(skill => !skillsFound.includes(skill));

    // Critical missing skills: required skills that are absent
    const criticalMissingSkills = reqSkills.filter(skill => !skillsFound.includes(skill));

    // 2. Keyword evaluation
    const matchedKeywords = keywords.filter(kw => resumeLower.includes(kw.toLowerCase()));
    const missingKeywords = keywords.filter(kw => !matchedKeywords.includes(kw));

    // 3. Score calculation (0-100)
    const skillRatio = allJobSkills.length ? (skillsFound.length / allJobSkills.length) : 0.8;
    const kwRatio = keywords.length ? (matchedKeywords.length / keywords.length) : 0.8;
    const reqBonus = (reqSkills.length - criticalMissingSkills.length) / (reqSkills.length || 1);

    const rawScore = Math.round((skillRatio * 45) + (kwRatio * 35) + (reqBonus * 20));
    const matchScore = Math.min(98, Math.max(38, rawScore));

    let scoreLabel = 'Moderate Alignment';
    if (matchScore >= 80) scoreLabel = 'Strong Match';
    else if (matchScore < 60) scoreLabel = 'Critical Gaps Detected';

    // 4. Tailoring recommendations
    const tailoringSuggestions = [
      {
        id: 'ts-1',
        category: 'Content Improvements',
        title: 'Quantify Engineering Impact',
        description: `Highlight measurable business impact (e.g. latency reduced by 30%, $15k cloud savings) across your roles.`,
        actionableSnippet: `“Refactored high-traffic services, improving response times by 35% and supporting 10k+ concurrent requests.”`,
        priority: 'High',
        estimatedImpactPoints: 8
      },
      {
        id: 'ts-2',
        category: 'Skill Improvements',
        title: criticalMissingSkills.length
          ? `Integrate Critical Missing Skill: ${criticalMissingSkills[0]}`
          : 'Strengthen Cloud & Architecture Highlights',
        description: criticalMissingSkills.length
          ? `The role explicitly lists "${criticalMissingSkills[0]}" as essential. Mention your proficiency or related hands-on projects.`
          : 'Emphasize production cloud architectures and container orchestration.',
        actionableSnippet: criticalMissingSkills.length
          ? `“Leveraged ${criticalMissingSkills[0]} for robust service orchestration and automated testing pipelines.”`
          : `“Engineered microservices deployed across containerized clusters with 99.9% uptime SLA.”`,
        priority: 'High',
        estimatedImpactPoints: 12
      },
      {
        id: 'ts-3',
        category: 'Experience Improvements',
        title: 'Echo Target Role Responsibilities',
        description: `Tailor your current role summary to mirror the primary responsibility: "${(jobDetails.responsibilities && jobDetails.responsibilities[0]) || 'Design and deploy scalable APIs'}"`,
        actionableSnippet: `“Spearheaded end-to-end architecture and agile team delivery for mission-critical customer workflows.”`,
        priority: 'Medium',
        estimatedImpactPoints: 6
      },
      {
        id: 'ts-4',
        category: 'ATS Optimization Tips',
        title: 'Keyword Density & Header Formatting',
        description: 'Ensure standardized headings like "Work Experience", "Technical Skills", and "Education" without multi-column table nesting so ATS parsers parse 100% of keywords cleanly.',
        actionableSnippet: `Include missing keywords: ${missingKeywords.slice(0, 4).join(', ')} in your skills inventory.`,
        priority: 'Low',
        estimatedImpactPoints: 4
      }
    ];

    // 5. Improvement Priority Meter
    const high = [];
    const medium = [];
    const low = [];

    if (criticalMissingSkills.length) {
      high.push({
        id: 'p-1',
        level: 'High Priority',
        title: `Add ${criticalMissingSkills.join(', ')} to Skills Section`,
        detail: 'Direct parser filter: missing these core skills may cause automatic pre-screening filtering.',
        pointsBoost: 12
      });
    }
    if (missingKeywords.length >= 3) {
      high.push({
        id: 'p-2',
        level: 'High Priority',
        title: `Align Title with "${jobDetails.title || 'Target Role'}"`,
        detail: 'Ensure your resume headline matches the exact target job title.',
        pointsBoost: 8
      });
    }
    medium.push({
      id: 'p-3',
      level: 'Medium Priority',
      title: 'Incorporate Missing Target Keywords',
      detail: `Scatter ${missingKeywords.slice(0, 3).join(', ')} naturally within your bullet points.`,
      pointsBoost: 6
    });
    if (skillsMissing.length > criticalMissingSkills.length) {
      medium.push({
        id: 'p-4',
        level: 'Medium Priority',
        title: 'Address Preferred Skills Gap',
        detail: `Mention experience or courses related to: ${skillsMissing.filter(s => !criticalMissingSkills.includes(s)).slice(0, 3).join(', ')}.`,
        pointsBoost: 5
      });
    }
    low.push({
      id: 'p-5',
      level: 'Low Priority',
      title: 'ATS Parser Layout Optimization',
      detail: 'Avoid complex graphics, text boxes, and icons inside the document body.',
      pointsBoost: 3
    });

    const potentialScoreBoost = high.reduce((sum, i) => sum + i.pointsBoost, 0) +
      medium.reduce((sum, i) => sum + i.pointsBoost, 0);

    const keywordMatchPct = keywords.length ? Math.round((matchedKeywords.length / keywords.length) * 100) : 80;
    const skillCoveragePct = allJobSkills.length ? Math.round((skillsFound.length / allJobSkills.length) * 100) : 75;

    return {
      matchScore,
      scoreLabel,
      keywordMatch: {
        matched: matchedKeywords,
        missing: missingKeywords,
        matchPercentage: keywordMatchPct,
        totalKeywords: keywords.length
      },
      skillGap: {
        skillsFound,
        skillsMissing,
        criticalMissingSkills,
        coveragePercentage: skillCoveragePct
      },
      tailoringSuggestions,
      priorityMeter: {
        high,
        medium,
        low,
        potentialScoreBoost: Math.min(100 - matchScore, potentialScoreBoost)
      },
      visualizations: {
        atsScore: matchScore,
        keywordMatchPct,
        skillCoveragePct,
        passingScoreBenchmark: 75
      },
      analyzedAt: new Date().toISOString()
    };
  };

  /* ---------- 6. Feature 2: Recruiter Dashboard & Candidate Management API ---------- */

  const RECRUITER_JOBS_KEY = 'jobnex.recruiter_jobs';
  const RECRUITER_CANDIDATES_KEY = 'jobnex.recruiter_candidates';

  const SEED_RECRUITER_JOBS = [
    {
      id: 'rj-1',
      title: 'Senior Frontend Engineer',
      company: 'JOBNEX Core Platform',
      department: 'Engineering',
      location: 'Bengaluru, India (Hybrid)',
      status: 'Active',
      applicantsCount: 28,
      createdDate: '2026-10-12',
      experienceLevel: '4-7 Years',
      requiredSkills: ['React', 'TypeScript', 'CSS3', 'REST APIs', 'Jest'],
      description: 'Lead modern SaaS frontend architecture, performance tuning, and accessible component library.'
    },
    {
      id: 'rj-2',
      title: 'Full Stack Python Architect',
      company: 'CloudScale Labs',
      department: 'Platform Architecture',
      location: 'Remote (India/US)',
      status: 'Active',
      applicantsCount: 34,
      createdDate: '2026-10-15',
      experienceLevel: '5+ Years',
      requiredSkills: ['Python', 'FastAPI', 'Docker', 'PostgreSQL', 'AWS'],
      description: 'Design distributed backend microservices, async task workers, and real-time WebSocket pipelines.'
    },
    {
      id: 'rj-3',
      title: 'DevOps & Site Reliability Lead',
      company: 'Apex Infrastructure',
      department: 'Operations',
      location: 'Hyderabad, India',
      status: 'Active',
      applicantsCount: 19,
      createdDate: '2026-10-18',
      experienceLevel: '4+ Years',
      requiredSkills: ['Kubernetes', 'Terraform', 'CI/CD', 'AWS', 'Linux'],
      description: 'Own production deployment infrastructure, zero-downtime releases, and observability pipelines.'
    },
    {
      id: 'rj-4',
      title: 'AI/ML Data Platform Engineer',
      company: 'Orbit Analytics',
      department: 'Data Engineering',
      location: 'Bengaluru, India',
      status: 'Active',
      applicantsCount: 22,
      createdDate: '2026-10-22',
      experienceLevel: '3-6 Years',
      requiredSkills: ['Python', 'SQL', 'Kafka', 'Pandas', 'PostgreSQL'],
      description: 'Build robust real-time data ingestion pipelines, feature stores, and automated training data streams.'
    },
    {
      id: 'rj-5',
      title: 'Senior Product Designer (UI/UX)',
      company: 'JOBNEX Core Platform',
      department: 'Design',
      location: 'Remote',
      status: 'Paused',
      applicantsCount: 16,
      createdDate: '2026-10-05',
      experienceLevel: '4+ Years',
      requiredSkills: ['Figma', 'Design Systems', 'User Research', 'Prototyping'],
      description: 'Design high-converting SaaS workflows, micro-interactions, and accessible typography systems.'
    },
    {
      id: 'rj-6',
      title: 'Legacy API Integration Specialist',
      company: 'Harbor & Finch',
      department: 'Enterprise Integrations',
      location: 'Austin, TX (Remote)',
      status: 'Archived',
      applicantsCount: 23,
      createdDate: '2026-09-14',
      experienceLevel: '5+ Years',
      requiredSkills: ['Java', 'Spring Boot', 'REST APIs', 'SQL'],
      description: 'Integrated legacy enterprise ERP systems with modern cloud APIs.'
    }
  ];

  const SEED_CANDIDATES = [
    {
      id: 'c-101',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@example.com',
      phone: '+91 98765 43210',
      location: 'Bengaluru, India',
      targetJobId: 'rj-1',
      targetJobTitle: 'Senior Frontend Engineer',
      stage: 'Technical Round',
      atsScore: 94,
      experience: '5.2 Years',
      skills: ['React', 'TypeScript', 'CSS3', 'Next.js', 'Jest'],
      missingSkills: ['Tailwind CSS'],
      resumeSummary: 'Experienced frontend engineer specializing in design systems, Web Vitals performance, and modern React 18+ state architectures.',
      appliedDate: '2026-10-24',
      interviewNotes: [
        { id: 'n-1', author: 'Vikram Mehta', role: 'Staff Engineer', date: '2026-10-26', text: 'Strong grasp of DOM reconciliation and memory leak avoidance. Code challenge completed with clean modular structure.', rating: 5 },
        { id: 'n-2', author: 'Pooja Nair', role: 'Engineering Manager', date: '2026-10-28', text: 'Great communication and leadership potential. Walked through responsive design tradeoffs smoothly.', rating: 4.5 }
      ],
      linkedinUrl: 'https://linkedin.com/in/example',
      githubUrl: 'https://github.com/example'
    },
    {
      id: 'c-102',
      name: 'Priyanka Sen',
      email: 'priyanka.sen@example.com',
      phone: '+91 98451 23456',
      location: 'Hyderabad, India',
      targetJobId: 'rj-2',
      targetJobTitle: 'Full Stack Python Architect',
      stage: 'Offer',
      atsScore: 96,
      experience: '6.5 Years',
      skills: ['Python', 'FastAPI', 'Docker', 'PostgreSQL', 'AWS', 'Redis'],
      missingSkills: [],
      resumeSummary: 'Backend architect with demonstrated track record in high-concurrency async Python services, distributed transactions, and Dockerized microservices on AWS.',
      appliedDate: '2026-10-16',
      interviewNotes: [
        { id: 'n-3', author: 'Anand Roy', role: 'CTO', date: '2026-10-25', text: 'Outstanding system design round. Proposed idempotent webhook handler with graceful retry semantics.', rating: 5 }
      ]
    },
    {
      id: 'c-103',
      name: 'Rohan Deshmukh',
      email: 'rohan.d@example.com',
      phone: '+91 97654 32109',
      location: 'Pune, India',
      targetJobId: 'rj-3',
      targetJobTitle: 'DevOps & Site Reliability Lead',
      stage: 'Screening',
      atsScore: 88,
      experience: '4.0 Years',
      skills: ['Kubernetes', 'Terraform', 'CI/CD', 'AWS', 'Linux'],
      missingSkills: ['Prometheus'],
      resumeSummary: 'DevOps professional focusing on automated infrastructure-as-code, GitHub Actions, and container security scanners.',
      appliedDate: '2026-10-28',
      interviewNotes: [
        { id: 'n-4', author: 'Neha Kapoor', role: 'Recruiter', date: '2026-10-29', text: 'Screening call passed. Notice period 30 days. Compensation expectations aligned with budget.', rating: 4 }
      ]
    },
    {
      id: 'c-104',
      name: 'Sneha Kulkarni',
      email: 'sneha.k@example.com',
      phone: '+91 91234 56780',
      location: 'Bengaluru, India',
      targetJobId: 'rj-1',
      targetJobTitle: 'Senior Frontend Engineer',
      stage: 'HR Round',
      atsScore: 91,
      experience: '4.8 Years',
      skills: ['React', 'TypeScript', 'GraphQL', 'REST APIs', 'CSS3'],
      missingSkills: ['Cypress'],
      resumeSummary: 'Full-lifecycle frontend engineer with deep focus on accessibility, micro-frontends, and state management via Redux/Zustand.',
      appliedDate: '2026-10-18',
      interviewNotes: [
        { id: 'n-5', author: 'Pooja Nair', role: 'EM', date: '2026-10-27', text: 'Strong cultural fit and values alignment. Ready for final compensation review.', rating: 4.8 }
      ]
    },
    {
      id: 'c-105',
      name: 'Aditya Varma',
      email: 'aditya.v@example.com',
      phone: '+91 93456 78901',
      location: 'Remote, India',
      targetJobId: 'rj-4',
      targetJobTitle: 'AI/ML Data Platform Engineer',
      stage: 'Interview',
      atsScore: 85,
      experience: '3.5 Years',
      skills: ['Python', 'SQL', 'Pandas', 'PostgreSQL', 'Docker'],
      missingSkills: ['Kafka'],
      resumeSummary: 'Data engineer skilled in writing optimized analytical SQL, ETL pipelines, and deploying containerized machine learning inference servers.',
      appliedDate: '2026-10-27',
      interviewNotes: [
        { id: 'n-6', author: 'Devendra Patil', role: 'Lead Data Scientist', date: '2026-10-30', text: 'Solid understanding of indexing and query plans. Moving to coding assessment.', rating: 4 }
      ]
    },
    {
      id: 'c-106',
      name: 'Ananya Iyer',
      email: 'ananya.iyer@example.com',
      phone: '+91 98234 56789',
      location: 'Chennai, India',
      targetJobId: 'rj-2',
      targetJobTitle: 'Full Stack Python Architect',
      stage: 'Applied',
      atsScore: 78,
      experience: '3.0 Years',
      skills: ['Python', 'Django', 'PostgreSQL', 'REST APIs'],
      missingSkills: ['FastAPI', 'Docker', 'AWS'],
      resumeSummary: 'Django and PostgreSQL developer with experience building clean REST APIs and database migration pipelines.',
      appliedDate: '2026-10-30',
      interviewNotes: []
    },
    {
      id: 'c-107',
      name: 'Karthik Raman',
      email: 'karthik.r@example.com',
      phone: '+91 99887 76655',
      location: 'Bengaluru, India',
      targetJobId: 'rj-3',
      targetJobTitle: 'DevOps & Site Reliability Lead',
      stage: 'Hired',
      atsScore: 95,
      experience: '6.0 Years',
      skills: ['Kubernetes', 'Terraform', 'CI/CD', 'AWS', 'Linux', 'Docker'],
      missingSkills: [],
      resumeSummary: 'Senior infrastructure engineer who successfully migrated on-prem systems to EKS with multi-region failover.',
      appliedDate: '2026-10-02',
      interviewNotes: [
        { id: 'n-7', author: 'Anand Roy', role: 'CTO', date: '2026-10-18', text: 'Offer accepted! Start date scheduled for Nov 10, 2026.', rating: 5 }
      ]
    },
    {
      id: 'c-108',
      name: 'Tanvi Joshi',
      email: 'tanvi.joshi@example.com',
      phone: '+91 94567 12345',
      location: 'Mumbai, India',
      targetJobId: 'rj-1',
      targetJobTitle: 'Senior Frontend Engineer',
      stage: 'Applied',
      atsScore: 72,
      experience: '2.5 Years',
      skills: ['JavaScript', 'HTML5', 'CSS3', 'React'],
      missingSkills: ['TypeScript', 'Jest', 'REST APIs'],
      resumeSummary: 'Enthusiastic web developer with hands-on practice in interactive UI components and responsive styling.',
      appliedDate: '2026-10-31',
      interviewNotes: []
    },
    {
      id: 'c-109',
      name: 'Manish Pandey',
      email: 'manish.p@example.com',
      phone: '+91 98112 23344',
      location: 'Noida, India',
      targetJobId: 'rj-4',
      targetJobTitle: 'AI/ML Data Platform Engineer',
      stage: 'Screening',
      atsScore: 82,
      experience: '4.2 Years',
      skills: ['Python', 'SQL', 'PostgreSQL', 'Kafka'],
      missingSkills: ['Pandas'],
      resumeSummary: 'Backend and streaming engineer with Kafka pub/sub experience and relational database optimization.',
      appliedDate: '2026-10-26',
      interviewNotes: [
        { id: 'n-8', author: 'Neha Kapoor', role: 'Recruiter', date: '2026-10-28', text: 'Resume screened. Good background in streaming data.', rating: 3.8 }
      ]
    },
    {
      id: 'c-110',
      name: 'Divya Nambiar',
      email: 'divya.n@example.com',
      phone: '+91 97456 78912',
      location: 'Kochi, India',
      targetJobId: 'rj-2',
      targetJobTitle: 'Full Stack Python Architect',
      stage: 'Technical Round',
      atsScore: 89,
      experience: '5.0 Years',
      skills: ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'AWS'],
      missingSkills: ['Redis'],
      resumeSummary: 'Full stack engineer proficient in building FastAPI microservices and React dashboards with secure JWT auth.',
      appliedDate: '2026-10-20',
      interviewNotes: [
        { id: 'n-9', author: 'Vikram Mehta', role: 'Staff Engineer', date: '2026-10-27', text: 'Strong architectural answers on connection pooling and async loops.', rating: 4.4 }
      ]
    },
    {
      id: 'c-111',
      name: 'Siddharth Rao',
      email: 'siddharth.rao@example.com',
      phone: '+91 96123 45678',
      location: 'Hyderabad, India',
      targetJobId: 'rj-1',
      targetJobTitle: 'Senior Frontend Engineer',
      stage: 'Interview',
      atsScore: 87,
      experience: '4.0 Years',
      skills: ['React', 'TypeScript', 'CSS3', 'Jest'],
      missingSkills: ['REST APIs'],
      resumeSummary: 'UI engineer passionate about building accessible web components and pixel-perfect design systems.',
      appliedDate: '2026-10-23',
      interviewNotes: [
        { id: 'n-10', author: 'Pooja Nair', role: 'EM', date: '2026-10-29', text: 'Demonstrated deep CSS knowledge and component design.', rating: 4.2 }
      ]
    },
    {
      id: 'c-112',
      name: 'Meera Chawla',
      email: 'meera.c@example.com',
      phone: '+91 99123 98765',
      location: 'Delhi NCR, India',
      targetJobId: 'rj-3',
      targetJobTitle: 'DevOps & Site Reliability Lead',
      stage: 'Technical Round',
      atsScore: 92,
      experience: '5.5 Years',
      skills: ['Kubernetes', 'CI/CD', 'AWS', 'Linux', 'Docker'],
      missingSkills: ['Terraform'],
      resumeSummary: 'SRE with expertise in Helm charts, blue-green deployments, and Prometheus/Grafana monitoring alerts.',
      appliedDate: '2026-10-21',
      interviewNotes: [
        { id: 'n-11', author: 'Anand Roy', role: 'CTO', date: '2026-10-28', text: 'Impressive incident triage methodology.', rating: 4.6 }
      ]
    },
    {
      id: 'c-113',
      name: 'Gaurav Bhatt',
      email: 'gaurav.bhatt@example.com',
      phone: '+91 98888 11223',
      location: 'Ahmedabad, India',
      targetJobId: 'rj-1',
      targetJobTitle: 'Senior Frontend Engineer',
      stage: 'Applied',
      atsScore: 68,
      experience: '2.0 Years',
      skills: ['JavaScript', 'React', 'HTML5', 'CSS3'],
      missingSkills: ['TypeScript', 'Jest'],
      resumeSummary: 'Junior developer with experience converting Figma mocks to interactive React single page applications.',
      appliedDate: '2026-10-31',
      interviewNotes: []
    },
    {
      id: 'c-114',
      name: 'Nisha Verma',
      email: 'nisha.verma@example.com',
      phone: '+91 97777 44556',
      location: 'Bengaluru, India',
      targetJobId: 'rj-4',
      targetJobTitle: 'AI/ML Data Platform Engineer',
      stage: 'HR Round',
      atsScore: 93,
      experience: '5.0 Years',
      skills: ['Python', 'SQL', 'Kafka', 'Pandas', 'PostgreSQL', 'Docker'],
      missingSkills: [],
      resumeSummary: 'Senior data engineer with strong distributed pipeline engineering and cross-functional team coordination.',
      appliedDate: '2026-10-15',
      interviewNotes: [
        { id: 'n-12', author: 'Neha Kapoor', role: 'Recruiter', date: '2026-10-29', text: 'Passed HR evaluation with high marks. Compensation expectations confirmed.', rating: 4.7 }
      ]
    }
  ];

  function getStoredRecruiterJobs() {
    try {
      const data = localStorage.getItem(RECRUITER_JOBS_KEY);
      return data ? JSON.parse(data) : SEED_RECRUITER_JOBS;
    } catch (e) {
      return SEED_RECRUITER_JOBS;
    }
  }

  function saveStoredRecruiterJobs(jobs) {
    try {
      localStorage.setItem(RECRUITER_JOBS_KEY, JSON.stringify(jobs));
    } catch (e) {}
  }

  function getStoredCandidates() {
    try {
      const data = localStorage.getItem(RECRUITER_CANDIDATES_KEY);
      return data ? JSON.parse(data) : SEED_CANDIDATES;
    } catch (e) {
      return SEED_CANDIDATES;
    }
  }

  function saveStoredCandidates(candidates) {
    try {
      localStorage.setItem(RECRUITER_CANDIDATES_KEY, JSON.stringify(candidates));
    } catch (e) {}
  }

  api.getRecruiterMetrics = async () => {
    try {
      if (BASE) {
        return await request('/api/recruiter/metrics');
      }
    } catch (e) { /* use mock */ }

    const jobs = getStoredRecruiterJobs();
    const candidates = getStoredCandidates();
    const activeJobs = jobs.filter(j => j.status === 'Active').length;
    const interviews = candidates.filter(c => ['Interview', 'Technical Round', 'HR Round'].includes(c.stage)).length;
    const hires = candidates.filter(c => c.stage === 'Hired').length;

    return {
      totalJobs: jobs.length,
      activeJobs,
      candidatesApplied: candidates.length,
      interviewsScheduled: interviews,
      hiresCompleted: hires,
      trends: {
        jobsTrend: '+2 this month',
        activeTrend: `${activeJobs} active requisitions`,
        candidatesTrend: '+18% vs last month',
        interviewsTrend: '6 scheduled this week',
        hiresTrend: 'Quarterly target: 8'
      }
    };
  };

  api.getRecruiterJobs = async () => {
    try {
      if (BASE) {
        return await request('/api/recruiter/jobs');
      }
    } catch (e) { /* use mock */ }
    return { jobs: getStoredRecruiterJobs() };
  };

  api.createRecruiterJob = async (jobData) => {
    try {
      if (BASE) {
        return await request('/api/recruiter/jobs', {
          method: 'POST',
          body: JSON.stringify(jobData)
        });
      }
    } catch (e) { /* use mock */ }

    const jobs = getStoredRecruiterJobs();
    const newJob = {
      id: 'rj-' + Date.now(),
      title: jobData.title || 'New Position',
      company: jobData.company || 'JOBNEX Core Platform',
      department: jobData.department || 'Engineering',
      location: jobData.location || 'Remote',
      status: jobData.status || 'Active',
      applicantsCount: 0,
      createdDate: new Date().toISOString().slice(0, 10),
      experienceLevel: jobData.experienceLevel || '3-5 Years',
      requiredSkills: Array.isArray(jobData.requiredSkills) ? jobData.requiredSkills : (jobData.requiredSkills || '').split(',').map(s => s.trim()).filter(Boolean),
      description: jobData.description || ''
    };
    jobs.unshift(newJob);
    saveStoredRecruiterJobs(jobs);
    return newJob;
  };

  api.updateRecruiterJob = async (id, data) => {
    try {
      if (BASE) {
        return await request(`/api/recruiter/jobs/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          body: JSON.stringify(data)
        });
      }
    } catch (e) { /* use mock */ }

    const jobs = getStoredRecruiterJobs();
    const idx = jobs.findIndex(j => j.id === id);
    if (idx !== -1) {
      jobs[idx] = { ...jobs[idx], ...data };
      saveStoredRecruiterJobs(jobs);
      return jobs[idx];
    }
    throw new Error('Job not found');
  };

  api.archiveRecruiterJob = async (id) => {
    return api.updateRecruiterJob(id, { status: 'Archived' });
  };

  api.getCandidates = async (filters = {}) => {
    try {
      if (BASE) {
        const query = new URLSearchParams();
        if (filters.search) query.set('search', filters.search);
        if (filters.skill) query.set('skill', filters.skill);
        if (filters.stage) query.set('stage', filters.stage);
        return await request(`/api/recruiter/candidates?${query}`);
      }
    } catch (e) { /* use mock */ }

    let list = getStoredCandidates();

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.targetJobTitle.toLowerCase().includes(q) ||
        (c.skills && c.skills.some(s => s.toLowerCase().includes(q)))
      );
    }
    if (filters.skill && filters.skill !== 'all') {
      const s = filters.skill.toLowerCase();
      list = list.filter(c => c.skills && c.skills.some(sk => sk.toLowerCase() === s));
    }
    if (filters.experience && filters.experience !== 'all') {
      const exp = filters.experience;
      if (exp === 'junior') list = list.filter(c => parseFloat(c.experience) < 3);
      else if (exp === 'mid') list = list.filter(c => parseFloat(c.experience) >= 3 && parseFloat(c.experience) < 5);
      else if (exp === 'senior') list = list.filter(c => parseFloat(c.experience) >= 5);
    }
    if (filters.location && filters.location !== 'all') {
      const loc = filters.location.toLowerCase();
      list = list.filter(c => c.location && c.location.toLowerCase().includes(loc));
    }
    if (filters.minScore) {
      const min = parseInt(filters.minScore, 10);
      list = list.filter(c => c.atsScore >= min);
    }
    if (filters.jobId && filters.jobId !== 'all') {
      list = list.filter(c => c.targetJobId === filters.jobId);
    }

    return { candidates: list, total: list.length };
  };

  api.updateCandidateStage = async (candidateId, newStage) => {
    try {
      if (BASE) {
        return await request(`/api/recruiter/candidates/${encodeURIComponent(candidateId)}/stage`, {
          method: 'PATCH',
          body: JSON.stringify({ stage: newStage })
        });
      }
    } catch (e) { /* use mock */ }

    const candidates = getStoredCandidates();
    const candidate = candidates.find(c => c.id === candidateId);
    if (candidate) {
      candidate.stage = newStage;
      saveStoredCandidates(candidates);
      return candidate;
    }
    throw new Error('Candidate not found');
  };

  api.addCandidateNote = async (candidateId, noteText, author = 'Parameshachari G') => {
    try {
      if (BASE) {
        return await request(`/api/recruiter/candidates/${encodeURIComponent(candidateId)}/notes`, {
          method: 'POST',
          body: JSON.stringify({ text: noteText, author })
        });
      }
    } catch (e) { /* use mock */ }

    const candidates = getStoredCandidates();
    const candidate = candidates.find(c => c.id === candidateId);
    if (candidate) {
      if (!Array.isArray(candidate.interviewNotes)) candidate.interviewNotes = [];
      const newNote = {
        id: 'n-' + Date.now(),
        author,
        role: 'Recruitment Lead',
        date: new Date().toISOString().slice(0, 10),
        text: noteText,
        rating: 4.5
      };
      candidate.interviewNotes.unshift(newNote);
      saveStoredCandidates(candidates);
      return newNote;
    }
    throw new Error('Candidate not found');
  };

  api.getRecruitmentAnalytics = async () => {
    try {
      if (BASE) {
        return await request('/api/recruiter/analytics');
      }
    } catch (e) { /* use mock */ }

    return {
      funnel: [
        { stage: 'Applied', count: 186, conversionRate: 100, dropoutCount: 68 },
        { stage: 'Screening', count: 118, conversionRate: 63.4, dropoutCount: 56 },
        { stage: 'Interview', count: 62, conversionRate: 33.3, dropoutCount: 30 },
        { stage: 'Technical Round', count: 32, conversionRate: 17.2, dropoutCount: 16 },
        { stage: 'HR Round', count: 16, conversionRate: 8.6, dropoutCount: 6 },
        { stage: 'Offer', count: 10, conversionRate: 5.4, dropoutCount: 2 },
        { stage: 'Hired', count: 8, conversionRate: 4.3, dropoutCount: 0 }
      ],
      sources: [
        { source: 'LinkedIn Recruiter', candidatesCount: 78, hiresCount: 4, percentage: 42 },
        { source: 'Employee Referrals', candidatesCount: 46, hiresCount: 2, percentage: 25 },
        { source: 'JOBNEX Direct Portal', candidatesCount: 42, hiresCount: 2, percentage: 22 },
        { source: 'Campus & Job Boards', candidatesCount: 20, hiresCount: 0, percentage: 11 }
      ],
      timeToHireDays: {
        average: 18.2,
        industryBenchmark: 24.5,
        breakdown: {
          sourcingDays: 4.2,
          screeningDays: 3.1,
          techRoundDays: 6.5,
          offerDays: 4.4
        }
      },
      conversionRate: {
        overallConversionPct: 4.3,
        offerAcceptancePct: 80.0,
        totalOffers: 10,
        totalHires: 8
      }
    };
  };

  api.resetRecruiterDemoData = () => {
    saveStoredRecruiterJobs(SEED_RECRUITER_JOBS);
    saveStoredCandidates(SEED_CANDIDATES);
  };

  // These workflows are persisted by the backend; local mock data is not a fallback for
  // authenticated requests because it can hide API failures and split user state.
  api.parseJobDescription = ({ text = '', fileName = '' } = {}) =>
    request('/api/job/parse', {
      method: 'POST',
      body: JSON.stringify({ text, file_name: fileName || null }),
      timeout: 20000
    });

  api.uploadJobDescription = (file) => {
    const form = new FormData();
    form.append('file', file, file.name);
    return request('/api/job/upload', { method: 'POST', body: form, timeout: 60000 });
  };

  api.analyzeJobMatch = ({ resumeText = '', jobDetails = {} }) =>
    request('/api/analyzer/job-match', {
      method: 'POST',
      body: JSON.stringify({ resume_text: resumeText, job_details: jobDetails }),
      timeout: 30000
    });

  api.getRecruiterMetrics = () => request('/api/recruiter/metrics');
  api.getRecruiterJobs = () => request('/api/recruiter/jobs');
  api.createRecruiterJob = (jobData) =>
    request('/api/recruiter/jobs', { method: 'POST', body: JSON.stringify(jobData) });
  api.updateRecruiterJob = (id, data) =>
    request(`/api/recruiter/jobs/${encodeURIComponent(id)}`, {
      method: 'PATCH', body: JSON.stringify(data)
    });
  api.archiveRecruiterJob = (id) => api.updateRecruiterJob(id, { status: 'Archived' });
  api.deleteRecruiterJob = (id) =>
    request(`/api/recruiter/jobs/${encodeURIComponent(id)}`, { method: 'DELETE' });

  api.getCandidates = (filters = {}) => {
    const query = new URLSearchParams();
    const filterMap = {
      search: 'search',
      skill: 'skill',
      stage: 'stage',
      experience: 'experience',
      location: 'location',
      minScore: 'minScore',
      jobId: 'jobId'
    };
    Object.entries(filterMap).forEach(([key, parameter]) => {
      const value = filters[key];
      if (value !== undefined && value !== null && value !== '' && value !== 'all' && value !== 0) {
        query.set(parameter, String(value));
      }
    });
    const suffix = query.toString();
    return request(`/api/recruiter/candidates${suffix ? `?${suffix}` : ''}`);
  };
  api.createCandidate = (candidate) =>
    request('/api/recruiter/candidates', { method: 'POST', body: JSON.stringify(candidate) });
  api.getCandidate = (id) => request(`/api/recruiter/candidates/${encodeURIComponent(id)}`);
  api.updateCandidate = (id, candidate) =>
    request(`/api/recruiter/candidates/${encodeURIComponent(id)}`, {
      method: 'PATCH', body: JSON.stringify(candidate)
    });
  api.deleteCandidate = (id) =>
    request(`/api/recruiter/candidates/${encodeURIComponent(id)}`, { method: 'DELETE' });
  api.updateCandidateStage = (id, stage) =>
    request(`/api/recruiter/candidates/${encodeURIComponent(id)}/stage`, {
      method: 'PATCH', body: JSON.stringify({ stage })
    });
  api.addCandidateNote = (id, text, author) =>
    request(`/api/recruiter/candidates/${encodeURIComponent(id)}/notes`, {
      method: 'POST', body: JSON.stringify({ text, author })
    });
  api.getRecruitmentAnalytics = () => request('/api/recruiter/analytics');
  api.resetRecruiterDemoData = () =>
    request('/api/recruiter/demo/reset', {
      method: 'POST',
      body: JSON.stringify({ jobs: SEED_RECRUITER_JOBS, candidates: SEED_CANDIDATES }),
      timeout: 30000
    });

  window.JOBNEX_API = api;
})();

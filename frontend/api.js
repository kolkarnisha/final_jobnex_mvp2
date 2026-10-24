/* ==========================================================================
   JOBNEX — API Client & Backend Integration Adapter
   Preserves backend contracts while providing robust error handling,
   automatic fallback detection, and clean endpoint responses.
   ========================================================================== */
(function () {
  'use strict';

  // Determine base URL: If running from FastAPI or localhost, use relative or 127.0.0.1:8000
  const isLocalFile = location.protocol === 'file:';
  const defaultBase = isLocalFile ? 'http://127.0.0.1:8000' : '';

  async function request(path, options = {}) {
    const url = (options.baseUrl || defaultBase) + path;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeout || 12000);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(options.headers || {})
        }
      });
      clearTimeout(timeout);

      const contentType = response.headers.get('content-type') || '';
      const payload = contentType.includes('application/json')
        ? await response.json()
        : { detail: await response.text() };

      if (!response.ok) {
        const detail = payload && (payload.detail || payload.message || payload.error);
        const errMessage = typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? detail.map(d => d.msg || JSON.stringify(d)).join(', ')
            : `Request failed with status ${response.status}`;
        const error = new Error(errMessage);
        error.status = response.status;
        error.payload = payload;
        throw error;
      }
      return payload;
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        const timeoutErr = new Error('Network request timed out. Please check your backend connection.');
        timeoutErr.status = 408;
        throw timeoutErr;
      }
      throw err;
    }
  }

   const api = window.JOBNEX_API || {};
  
const API_BASE = window.JOBNEX_API_BASE || "http://localhost:8000";

const response = await fetch(url, {
  credentials: "include",
  ...options,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
    ...(options.headers || {})
  }
});



  // Health check
  api.checkHealth = async () => {
    try {
      return await request('/api/health');
    } catch (e) {
      return { status: 'offline', mode: 'demo' };
    }
  };

  // Resume Analyzer
  api.analyzeResume = async ({ resumeText, jdText }) => {
    return request('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ resume_text: resumeText, jd_text: jdText })
    });
  };

  // List past analyses
  api.getAnalyses = async () => {
    return request('/api/analyses');
  };

  // Job Search
  api.searchJobs = async (keyword = 'developer', limit = 12) => {
    const query = new URLSearchParams({ keyword, limit: String(limit) });
    return request(`/api/jobs/search?${query}`);
  };

  // Queue Application
  api.queueApplication = async (application) => {
    return request('/api/applications', {
      method: 'POST',
      body: JSON.stringify({
        resume_text: application.resume_text || application.resumeText,
        job_title: application.job_title || application.jobTitle,
        company: application.company,
        job_description: application.job_description || application.jobDescription,
        job_url: application.job_url || application.jobUrl || null
      })
    });
  };

  // List Applications
  api.getApplications = async () => {
    return request('/api/applications');
  };

  // Chat Session Management
  let chatSessionId = sessionStorage.getItem('jobnex.chatSessionId') || null;

  api.chat = async ({ message, analysis = null }) => {
    const payload = await request('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        session_id: chatSessionId,
        analysis: analysis || undefined
      })
    });
    if (payload.session_id) {
      chatSessionId = payload.session_id;
      sessionStorage.setItem('jobnex.chatSessionId', chatSessionId);
    }
    return {
      ...payload,
      text: payload.reply || payload.text || payload.message || ''
    };
  };

  api.clearChat = async () => {
    if (chatSessionId) {
      try {
        await request(`/api/chat/${encodeURIComponent(chatSessionId)}`, { method: 'DELETE' });
      } catch (error) {
        if (error.status !== 404 && error.status !== 405) {
          console.warn('Clear chat error:', error);
        }
      }
      sessionStorage.removeItem('jobnex.chatSessionId');
      chatSessionId = null;
    }
  };

  window.JOBNEX_API = api;
})();

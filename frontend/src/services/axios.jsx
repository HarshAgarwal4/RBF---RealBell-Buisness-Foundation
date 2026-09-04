import axios from 'axios';

const baseURL = import.meta.env.VITE_REACT_APP_BACKEND_URL || '';

const api = axios.create({
  baseURL,
  withCredentials: true,
});

let cachedCsrfToken = null;
let csrfFetchPromise = null;

/**
 * Helper to read cookie by name from document.cookie
 */
function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

/**
 * Obtain anti-CSRF token
 * Deduplicates in-flight requests and caches token in memory
 */
export async function getCsrfToken(forceRefresh = false) {
  if (!forceRefresh && cachedCsrfToken) {
    return cachedCsrfToken;
  }

  // Fallback to non-httpOnly XSRF-TOKEN cookie if already present
  if (!forceRefresh) {
    const xsrfCookie = getCookie('XSRF-TOKEN');
    if (xsrfCookie) {
      cachedCsrfToken = xsrfCookie;
      return cachedCsrfToken;
    }
  }

  if (csrfFetchPromise && !forceRefresh) {
    return csrfFetchPromise;
  }

  csrfFetchPromise = (async () => {
    try {
      // Use raw axios instance to prevent interceptor loop
      const res = await axios.get(`${baseURL}/csrf-token`, {
        withCredentials: true,
      });

      if (res.data && res.data.csrfToken) {
        cachedCsrfToken = res.data.csrfToken;
        return cachedCsrfToken;
      }
    } catch (err) {
      console.warn('[Security] Could not pre-fetch CSRF token:', err?.message || err);
    } finally {
      csrfFetchPromise = null;
    }
    return cachedCsrfToken;
  })();

  return csrfFetchPromise;
}

export function setCachedCsrfToken(token) {
  if (token && typeof token === 'string') {
    cachedCsrfToken = token;
  }
}

const MUTATING_METHODS = new Set(['post', 'put', 'delete', 'patch']);

// Request Interceptor: Attach X-CSRF-Token to mutating methods
api.interceptors.request.use(
  async (config) => {
    const method = (config.method || 'get').toLowerCase();

    if (MUTATING_METHODS.has(method)) {
      // If header not already set
      if (!config.headers['X-CSRF-Token'] && !config.headers['x-csrf-token']) {
        const token = await getCsrfToken();
        if (token) {
          config.headers['X-CSRF-Token'] = token;
        }
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Capture refreshed tokens and auto-retry on EBADCSRFTOKEN
api.interceptors.response.use(
  (response) => {
    // If backend returns a refreshed CSRF token, store it
    const refreshedToken =
      response.headers?.['x-csrf-token'] ||
      response.headers?.['X-CSRF-Token'] ||
      response.data?.csrfToken;

    if (refreshedToken && typeof refreshedToken === 'string') {
      cachedCsrfToken = refreshedToken;
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Auto-retry once on 403 EBADCSRFTOKEN
    if (
      error.response &&
      error.response.status === 403 &&
      error.response.data?.code === 'EBADCSRFTOKEN' &&
      originalRequest &&
      !originalRequest._retryCsrf
    ) {
      originalRequest._retryCsrf = true;

      try {
        const freshToken = await getCsrfToken(true);
        if (freshToken) {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers['X-CSRF-Token'] = freshToken;
          return api(originalRequest);
        }
      } catch (retryErr) {
        return Promise.reject(retryErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

import { safeLocalStorage } from '@/utils/storage';

export class ApiError extends Error {
  status: number;
  data?: any;
  response?: {
    status: number;
    data?: any;
  };

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    // Provide axios-compatible response structure for existing error checks
    this.response = {
      status,
      data,
    };
  }
}

export function isAbortError(error: any): boolean {
  return (
    error?.name === 'AbortError' ||
    error?.name === 'CanceledError' ||
    error?.message === 'Request aborted' ||
    error?.message === 'canceled'
  );
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

function buildUrl(url: string, params?: Record<string, any>): string {
  if (!params || Object.keys(params).length === 0) {
    return url;
  }

  const [base, existingSearch] = url.split('?');
  const searchParams = new URLSearchParams(existingSearch || '');

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null) {
          searchParams.append(key, String(item));
        }
      }
    } else {
      searchParams.set(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `${base}?${queryString}` : base;
}

function getAuthHeader(): Record<string, string> {
  const token = safeLocalStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T = any>(
  url: string,
  options: RequestOptions & { method: string; body?: any }
): Promise<T> {
  const { params, headers = {}, timeoutMs, body, ...fetchOptions } = options;

  const targetUrl = buildUrl(url, params);

  const mergedHeaders: Record<string, string> = {
    ...getAuthHeader(),
    ...headers,
  };

  let formattedBody: BodyInit | undefined = undefined;

  if (body !== undefined && body !== null) {
    if (body instanceof FormData || body instanceof Blob || body instanceof URLSearchParams) {
      formattedBody = body;
      // Let browser set the correct multipart boundary for FormData
      if (body instanceof FormData) {
        delete mergedHeaders['Content-Type'];
      }
    } else if (typeof body === 'string') {
      formattedBody = body;
      if (!mergedHeaders['Content-Type']) {
        mergedHeaders['Content-Type'] = 'text/plain';
      }
    } else {
      formattedBody = JSON.stringify(body);
      if (!mergedHeaders['Content-Type']) {
        mergedHeaders['Content-Type'] = 'application/json';
      }
    }
  }

  let timeoutId: NodeJS.Timeout | undefined;
  let signal = fetchOptions.signal;

  if (timeoutMs && timeoutMs > 0) {
    const controller = new AbortController();
    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }
    timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    signal = controller.signal;
  }

  try {
    const response = await fetch(targetUrl, {
      credentials: fetchOptions.credentials || 'same-origin',
      ...fetchOptions,
      headers: mergedHeaders,
      body: formattedBody,
      signal,
    });

    if (timeoutId) clearTimeout(timeoutId);

    // If HTTP status is 204 No Content, return null/undefined
    if (response.status === 204) {
      return undefined as unknown as T;
    }

    const contentType = response.headers.get('content-type') || '';
    let responseData: any = null;

    if (contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      try {
        responseData = JSON.parse(text);
      } catch {
        responseData = text;
      }
    }

    if (!response.ok) {
      const errorMessage =
        (responseData && (responseData.message || responseData.error)) ||
        response.statusText ||
        `Request failed with status ${response.status}`;

      throw new ApiError(response.status, errorMessage, responseData);
    }

    return responseData as T;
  } catch (err: any) {
    if (timeoutId) clearTimeout(timeoutId);
    throw err;
  }
}

export const apiClient = {
  get: <T = any>(url: string, options?: RequestOptions): Promise<T> =>
    request<T>(url, { ...options, method: 'GET' }),

  post: <T = any>(url: string, body?: any, options?: RequestOptions): Promise<T> =>
    request<T>(url, { ...options, method: 'POST', body }),

  put: <T = any>(url: string, body?: any, options?: RequestOptions): Promise<T> =>
    request<T>(url, { ...options, method: 'PUT', body }),

  patch: <T = any>(url: string, body?: any, options?: RequestOptions): Promise<T> =>
    request<T>(url, { ...options, method: 'PATCH', body }),

  delete: <T = any>(url: string, options?: RequestOptions & { body?: any }): Promise<T> =>
    request<T>(url, { ...options, method: 'DELETE', body: options?.body }),

  head: async (url: string, options?: RequestOptions): Promise<Response> => {
    const targetUrl = buildUrl(url, options?.params);
    const mergedHeaders: Record<string, string> = {
      ...getAuthHeader(),
      ...options?.headers,
    };
    const response = await fetch(targetUrl, {
      ...options,
      method: 'HEAD',
      headers: mergedHeaders,
    });
    if (!response.ok) {
      throw new ApiError(response.status, response.statusText);
    }
    return response;
  },
};

export default apiClient;

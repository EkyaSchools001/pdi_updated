/**
 * Shared API helpers for consistent backend-frontend sync:
 * - Loading states during requests
 * - Success/error toasts
 * - Optimistic updates
 * - Proper error handling
 */
import api from '@/lib/api';
import { toast } from 'sonner';

export interface ApiCallOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (err: unknown) => void;
  successMessage?: string;
  errorMessage?: string;
}

export async function apiCall<T>(
  fn: () => Promise<{ data?: { data?: T } }>,
  options?: ApiCallOptions<T>
): Promise<T | null> {
  try {
    const response = await fn();
    const data = response.data?.data as T | undefined;
    if (options?.successMessage) {
      toast.success(options.successMessage);
    }
    if (data !== undefined) options?.onSuccess?.(data);
    return data ?? null;
  } catch (err: any) {
    const msg = options?.errorMessage ?? err.response?.data?.message ?? 'Something went wrong';
    toast.error(typeof msg === 'string' ? msg : 'Something went wrong');
    options?.onError?.(err);
    return null;
  }
}

/** Wrapper for GET that returns data or null */
export async function apiGet<T>(url: string, params?: object): Promise<T | null> {
  try {
    const response = await api.get(url, { params });
    if (response.data?.status === 'success') {
      return (response.data.data ?? response.data) as T;
    }
    return null;
  } catch (err: any) {
    console.error(`apiGet ${url}:`, err.response?.data || err.message);
    return null;
  }
}

/** Wrapper for POST with toast feedback */
export async function apiPost<T>(
  url: string,
  body: unknown,
  options?: ApiCallOptions<T>
): Promise<T | null> {
  return apiCall(
    () => api.post(url, body).then(r => ({ data: { data: r.data?.data } })),
    options
  );
}

/** Wrapper for PATCH with toast feedback */
export async function apiPatch<T>(
  url: string,
  body: unknown,
  options?: ApiCallOptions<T>
): Promise<T | null> {
  return apiCall(
    () => api.patch(url, body).then(r => ({ data: { data: r.data?.data } })),
    options
  );
}

/** Wrapper for DELETE with toast feedback */
export async function apiDelete(
  url: string,
  options?: ApiCallOptions<unknown>
): Promise<boolean> {
  const result = await apiCall(
    () => api.delete(url).then(() => ({ data: { data: null } })),
    options
  );
  return result !== null;
}

import { toast } from '@/components/ui/use-toast';

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class APIClient {
  private baseURL: string;

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
  }

  async request<T = any>(
    url: string,
    options?: RequestInit
  ): Promise<T> {
    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      // Handle 501 Not Implemented
      if (response.status === 501) {
        const error = await response.json();
        console.warn('Legacy feature accessed:', error);
        
        // Show user-friendly notification
        toast({
          title: 'Feature Not Available',
          description: error.alternativeEndpoint
            ? `This feature is being redesigned. Try ${error.alternativeEndpoint} instead.`
            : 'This feature is not available in the current version.',
          variant: 'destructive',
        });
        
        throw new APIError(
          error.message || 'Feature not implemented',
          501,
          error
        );
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new APIError(
          error.message || `HTTP ${response.status}`,
          response.status,
          error
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Network error', 0);
    }
  }

  // Convenience methods
  get<T = any>(url: string) {
    return this.request<T>(url, { method: 'GET' });
  }

  post<T = any>(url: string, data?: any) {
    return this.request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T = any>(url: string, data?: any) {
    return this.request<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T = any>(url: string) {
    return this.request<T>(url, { method: 'DELETE' });
  }
}

export const apiClient = new APIClient('/api');

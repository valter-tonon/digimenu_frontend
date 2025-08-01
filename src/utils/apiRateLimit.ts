/**
 * API Rate Limiting Utility
 * 
 * Prevents excessive API calls from infinite loops or rapid user interactions
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
}

class APIRateLimit {
  private limits: Map<string, RateLimitEntry> = new Map();
  private readonly DEFAULT_LIMIT = 10; // requests per minute
  private readonly WINDOW_MS = 60 * 1000; // 1 minute
  private readonly BLOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if a request is allowed for a given endpoint
   */
  isAllowed(endpoint: string, limit?: number): boolean {
    const key = this.getKey(endpoint);
    const now = Date.now();
    const entry = this.limits.get(key);
    const requestLimit = limit || this.DEFAULT_LIMIT;

    // If no entry exists, create one
    if (!entry) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.WINDOW_MS,
        blocked: false
      });
      return true;
    }

    // If blocked, check if block period has expired
    if (entry.blocked) {
      if (now > entry.resetTime) {
        // Unblock and reset
        this.limits.set(key, {
          count: 1,
          resetTime: now + this.WINDOW_MS,
          blocked: false
        });
        return true;
      }
      return false;
    }

    // If window has expired, reset counter
    if (now > entry.resetTime) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.WINDOW_MS,
        blocked: false
      });
      return true;
    }

    // If within limit, increment counter
    if (entry.count < requestLimit) {
      entry.count++;
      return true;
    }

    // Limit exceeded, block the endpoint
    entry.blocked = true;
    entry.resetTime = now + this.BLOCK_DURATION_MS;
    
    console.warn(`Rate limit exceeded for ${endpoint}. Blocked for 5 minutes.`);
    return false;
  }

  /**
   * Get remaining requests for an endpoint
   */
  getRemaining(endpoint: string, limit?: number): number {
    const key = this.getKey(endpoint);
    const entry = this.limits.get(key);
    const requestLimit = limit || this.DEFAULT_LIMIT;

    if (!entry || entry.blocked) return 0;
    if (Date.now() > entry.resetTime) return requestLimit;
    
    return Math.max(0, requestLimit - entry.count);
  }

  /**
   * Check if an endpoint is currently blocked
   */
  isBlocked(endpoint: string): boolean {
    const key = this.getKey(endpoint);
    const entry = this.limits.get(key);
    
    if (!entry) return false;
    if (!entry.blocked) return false;
    
    // Check if block has expired
    if (Date.now() > entry.resetTime) {
      entry.blocked = false;
      return false;
    }
    
    return true;
  }

  /**
   * Get time until reset for an endpoint
   */
  getResetTime(endpoint: string): number {
    const key = this.getKey(endpoint);
    const entry = this.limits.get(key);
    
    if (!entry) return 0;
    return Math.max(0, entry.resetTime - Date.now());
  }

  /**
   * Manually reset rate limit for an endpoint
   */
  reset(endpoint: string): void {
    const key = this.getKey(endpoint);
    this.limits.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.limits.clear();
  }

  /**
   * Get stats for all endpoints
   */
  getStats(): Record<string, { count: number; remaining: number; blocked: boolean; resetIn: number }> {
    const stats: Record<string, any> = {};
    
    for (const [key, entry] of this.limits.entries()) {
      const endpoint = key.replace('rate_limit:', '');
      stats[endpoint] = {
        count: entry.count,
        remaining: this.getRemaining(endpoint),
        blocked: entry.blocked,
        resetIn: this.getResetTime(endpoint)
      };
    }
    
    return stats;
  }

  private getKey(endpoint: string): string {
    return `rate_limit:${endpoint}`;
  }
}

// Singleton instance
export const apiRateLimit = new APIRateLimit();

/**
 * Rate limit decorator for API functions
 */
export function withRateLimit<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  endpoint: string,
  limit?: number
): T {
  return (async (...args: any[]) => {
    if (!apiRateLimit.isAllowed(endpoint, limit)) {
      const resetTime = apiRateLimit.getResetTime(endpoint);
      const resetMinutes = Math.ceil(resetTime / (60 * 1000));
      
      throw new Error(
        `Rate limit exceeded for ${endpoint}. Try again in ${resetMinutes} minute(s).`
      );
    }
    
    return fn(...args);
  }) as T;
}

/**
 * Axios interceptor for automatic rate limiting
 */
export const createRateLimitedAxios = (baseURL?: string) => {
  const axios = require('axios').create({
    baseURL: baseURL || process.env.NEXT_PUBLIC_API_URL
  });

  // Request interceptor
  axios.interceptors.request.use(
    (config: any) => {
      const endpoint = `${config.method?.toUpperCase()} ${config.url}`;
      
      if (!apiRateLimit.isAllowed(endpoint)) {
        const resetTime = apiRateLimit.getResetTime(endpoint);
        const resetMinutes = Math.ceil(resetTime / (60 * 1000));
        
        return Promise.reject(new Error(
          `Rate limit exceeded for ${endpoint}. Try again in ${resetMinutes} minute(s).`
        ));
      }
      
      return config;
    },
    (error: any) => Promise.reject(error)
  );

  // Response interceptor to handle server-side rate limiting
  axios.interceptors.response.use(
    (response: any) => response,
    (error: any) => {
      if (error.response?.status === 429) {
        const endpoint = `${error.config?.method?.toUpperCase()} ${error.config?.url}`;
        console.warn(`Server rate limit hit for ${endpoint}`);
        
        // Block this endpoint locally for a while
        apiRateLimit.reset(endpoint);
        for (let i = 0; i < 20; i++) {
          apiRateLimit.isAllowed(endpoint); // Exhaust local limit
        }
      }
      
      return Promise.reject(error);
    }
  );

  return axios;
};

/**
 * Hook for monitoring rate limit status
 */
export const useRateLimitStatus = (endpoint: string) => {
  const [status, setStatus] = React.useState({
    remaining: apiRateLimit.getRemaining(endpoint),
    blocked: apiRateLimit.isBlocked(endpoint),
    resetIn: apiRateLimit.getResetTime(endpoint)
  });

  React.useEffect(() => {
    const interval = setInterval(() => {
      setStatus({
        remaining: apiRateLimit.getRemaining(endpoint),
        blocked: apiRateLimit.isBlocked(endpoint),
        resetIn: apiRateLimit.getResetTime(endpoint)
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [endpoint]);

  return status;
};
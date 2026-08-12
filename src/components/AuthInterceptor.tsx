"use client";

import { useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6560";

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const clearSchoolAuth = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("school_token");
  localStorage.removeItem("school_refresh_token");
  localStorage.removeItem("school_id");
  localStorage.removeItem("school_user");
};

export default function AuthInterceptor({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalFetch = window.fetch;

    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      let requestUrl = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      // Do not intercept refresh or auth requests to avoid infinite loops
      if (
        requestUrl.includes("/api/schools/refresh") ||
        requestUrl.includes("/api/schools/login") ||
        window.location.pathname.startsWith("/login")
      ) {
        return originalFetch.apply(this, [input, init]);
      }

      // Attach token automatically if present and not already attached
      const storedToken = localStorage.getItem("school_token");
      if (storedToken) {
        init = init || {};
        const headers = new Headers(init.headers || {});
        if (!headers.has("Authorization")) {
          headers.set("Authorization", `Bearer ${storedToken}`);
        }
        init.headers = headers;
      }

      const response = await originalFetch.apply(this, [input, init]);

      // Check if response is 401 Unauthorized or has token expiration error
      let isUnauthorized = response.status === 401;

      if (!isUnauthorized && !response.ok) {
        try {
          const clone = response.clone();
          const data = await clone.json();
          if (data && data.error && typeof data.error === "string") {
            const errText = data.error.toLowerCase();
            if (
              errText.includes("expired token") ||
              errText.includes("invalid or expired token") ||
              errText.includes("token required") ||
              errText.includes("unauthorized")
            ) {
              isUnauthorized = true;
            }
          }
        } catch (_) {
          // Non-JSON response, ignore
        }
      }

      if (isUnauthorized) {
        const refreshToken = localStorage.getItem("school_refresh_token");
        if (!refreshToken) {
          clearSchoolAuth();
          window.location.replace("/login");
          return response;
        }

        if (isRefreshing) {
          try {
            const newToken = await new Promise<string>((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            });

            // Retry request with new access token
            const retriedHeaders = new Headers(init?.headers || {});
            retriedHeaders.set("Authorization", `Bearer ${newToken}`);
            const retriedInit = { ...init, headers: retriedHeaders };
            return originalFetch.apply(this, [input, retriedInit]);
          } catch (err) {
            clearSchoolAuth();
            window.location.replace("/login");
            return response;
          }
        }

        isRefreshing = true;

        try {
          const schoolId = localStorage.getItem("school_id") || "";
          const refreshHeaders: Record<string, string> = {
            "Content-Type": "application/json",
          };
          if (schoolId) {
            refreshHeaders["X-School-ID"] = schoolId;
          }

          const refreshRes = await originalFetch(`${API_URL}/api/schools/refresh`, {
            method: "POST",
            headers: refreshHeaders,
            body: JSON.stringify({ refresh_token: refreshToken }),
          });

          if (!refreshRes.ok) {
            throw new Error("Token refresh failed");
          }

          const refreshData = await refreshRes.json();
          const newAccessToken = refreshData.token;
          const newRefreshToken = refreshData.refresh_token;

          if (!newAccessToken) {
            throw new Error("No token returned from refresh endpoint");
          }

          localStorage.setItem("school_token", newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem("school_refresh_token", newRefreshToken);
          }

          processQueue(null, newAccessToken);

          // Retry the original failed request
          const retriedHeaders = new Headers(init?.headers || {});
          retriedHeaders.set("Authorization", `Bearer ${newAccessToken}`);
          const retriedInit = { ...init, headers: retriedHeaders };
          return originalFetch.apply(this, [input, retriedInit]);
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          clearSchoolAuth();
          window.location.replace("/login");
          return response;
        } finally {
          isRefreshing = false;
        }
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return <>{children}</>;
}

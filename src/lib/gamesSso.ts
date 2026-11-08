export interface GamesSsoPayload {
  token: string;
  refresh_token?: string;
  school_id: string;
  user?: any;
  child_id?: number | string | null;
  origin_host?: string;
  ts: number;
}

export function getRootDomain(hostname: string): string {
  if (!hostname || hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("::1")) {
    return "";
  }
  if (hostname.endsWith("farzandim-edu.uz")) {
    return "farzandim-edu.uz";
  }
  if (hostname.endsWith("akademx.uz")) {
    return "akademx.uz";
  }
  const parts = hostname.split(".");
  if (parts.length >= 2) {
    return parts.slice(-2).join(".");
  }
  return "";
}

export function getGamesBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_GAMES_URL) {
    return process.env.NEXT_PUBLIC_GAMES_URL.replace(/\/+$/, "");
  }
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:6502";
    }
    const rootDomain = getRootDomain(hostname);
    if (rootDomain) {
      return `${window.location.protocol}//games.${rootDomain}`;
    }
  }
  return "https://games.akademx.uz";
}

function encodeBase64Json(obj: unknown): string {
  const jsonStr = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(jsonStr);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function syncGamesSsoCookie(selectedChildId?: number | string | null): string | null {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("school_token") || "";
  const refreshToken = localStorage.getItem("school_refresh_token") || "";
  const schoolId = localStorage.getItem("school_id") || "";
  const rawUser = localStorage.getItem("school_user");
  if (!token || !schoolId) return null;

  let user: any = null;
  if (rawUser) {
    try {
      user = JSON.parse(rawUser);
    } catch {
      user = null;
    }
  }

  const payload: GamesSsoPayload = {
    token,
    refresh_token: refreshToken,
    school_id: schoolId,
    user,
    child_id: selectedChildId ?? null,
    origin_host: window.location.host,
    ts: Date.now(),
  };

  const encoded = encodeBase64Json(payload);
  const rootDomain = getRootDomain(window.location.hostname);
  const domainAttr = rootDomain ? `; Domain=.${rootDomain}` : "";
  const secureAttr = window.location.protocol === "https:" ? "; Secure" : "";

  document.cookie = `farzandim_sso=${encodeURIComponent(encoded)}; Path=/; Max-Age=86400; SameSite=Lax${domainAttr}${secureAttr}`;
  return encoded;
}

export function clearGamesSsoCookie(): void {
  if (typeof window === "undefined") return;
  const rootDomain = getRootDomain(window.location.hostname);
  const domainAttr = rootDomain ? `; Domain=.${rootDomain}` : "";
  document.cookie = `farzandim_sso=; Path=/; Max-Age=0; SameSite=Lax${domainAttr}`;
  document.cookie = `farzandim_sso=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function buildGamesSsoUrl(selectedChildId?: number | string | null): string {
  const baseUrl = getGamesBaseUrl();
  const encoded = syncGamesSsoCookie(selectedChildId);
  if (!encoded) {
    return baseUrl;
  }
  return `${baseUrl}/#sso=${encodeURIComponent(encoded)}`;
}

export function launchGamesPortal(selectedChildId?: number | string | null): void {
  if (typeof window === "undefined") return;
  const url = buildGamesSsoUrl(selectedChildId);
  window.location.href = url;
}


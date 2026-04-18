"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

/**
 * OAuth callback page — handles PKCE code exchange CLIENT-SIDE.
 *
 * The browser client has direct access to the PKCE code verifier cookie
 * via document.cookie, avoiding the server-side cookie propagation issue
 * that caused intermittent "exchange_failed" errors.
 *
 * Flow:
 * 1. Google/LinkedIn redirects here with ?code=xxx
 * 2. createBrowserClient auto-detects the code (detectSessionInUrl: true)
 * 3. Client exchanges code for session using PKCE verifier from cookie
 * 4. On SIGNED_IN event, calls /api/auth/complete-login for member logic
 * 5. Server returns redirect path, client navigates there
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const supabase = createSupabaseBrowserClient();

    // Check for OAuth error in URL params
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    if (error) {
      console.error("[auth/callback] OAuth error:", error, params.get("error_description"));
      router.replace(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    // Listen for auth state changes — the browser client auto-exchanges
    // the code from the URL using the PKCE verifier from cookies
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        try {
          // Call server endpoint for member lookup/creation
          const res = await fetch("/api/auth/complete-login");
          const data = await res.json();

          if (data.redirect) {
            router.replace(data.redirect);
          } else {
            router.replace("/my-profile");
          }
        } catch (err) {
          console.error("[auth/callback] Complete login error:", err);
          router.replace("/login?error=complete_failed");
        }
      } else if (event === "SIGNED_OUT") {
        router.replace("/login?error=auth_failed");
      }
    });

    // Fallback: if no auth event fires within 10s, redirect to login
    const timeout = setTimeout(() => {
      router.replace("/login?error=timeout");
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#0A0A0A",
        color: "rgba(255,255,255,0.7)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 32,
            height: 32,
            border: "3px solid rgba(232,123,30,0.3)",
            borderTopColor: "#E87B1E",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 16px",
          }}
        />
        <p>Autenticando...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  );
}

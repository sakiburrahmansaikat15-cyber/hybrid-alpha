<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Prevent clickjacking attacks
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');

        // Prevent MIME type sniffing
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // Enable XSS protection
        $response->headers->set('X-XSS-Protection', '1; mode=block');

        // Strict Transport Security (HTTPS only)
        if ($request->secure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        // Content Security Policy - Only enabled in production
        // In development (local), CSP is disabled to allow Vite dev server
        if (config('app.env') !== 'local' && !config('app.debug')) {
            // Production: Strict CSP
            $response->headers->set(
                'Content-Security-Policy',
                "default-src 'self'; " .
                "script-src 'self' 'unsafe-inline'; " .
                "style-src 'self' 'unsafe-inline'; " .
                "img-src 'self' data: https:; " .
                "font-src 'self' data:; " .
                "connect-src 'self'; " .
                "worker-src 'self' blob:; " .
                "object-src 'none'; " .
                "base-uri 'self'; " .
                "form-action 'self';"
            );
        }
        // Note: No CSP header in development - allows Vite to work freely

        // Referrer Policy
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Permissions Policy
        $response->headers->set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

        return $response;
    }
}

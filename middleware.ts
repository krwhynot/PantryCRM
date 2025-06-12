import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { logSecurityEvent } from "@/lib/security-logger";
import { addSecurityHeadersToMiddleware } from "@/lib/security-headers";

export default withAuth(
  function middleware(req) {
    // Create response
    const response = NextResponse.next();
    
    // Add comprehensive security headers
    return addSecurityHeadersToMiddleware(response);
  },
  {
    pages: {
      signIn: "/sign-in",
    },
    callbacks: {
      authorized: ({ token, req }) => {
        // SECURITY: CVE-2025-29927 Protection - Block suspicious middleware headers
        const suspiciousHeader = req.headers.get('x-middleware-subrequest');
        if (suspiciousHeader) {
          // Check for patterns that indicate bypass attempts
          const suspiciousPatterns = [
            /middleware:middleware/,
            /src\/middleware:src\/middleware/,
            /middleware.*middleware.*middleware/
          ];
          
          if (suspiciousPatterns.some(pattern => pattern.test(suspiciousHeader))) {
            logSecurityEvent('suspicious_header_detected', {
              header: suspiciousHeader,
              url: req.url,
              userAgent: req.headers.get('user-agent') || 'unknown',
              ip: req.ip || req.headers.get('x-forwarded-for') || 'unknown'
            }, req);
            
            return false; // Block the request
          }
        }
        
        // Additional security checks
        const userAgent = req.headers.get('user-agent') || '';
        const suspiciousUserAgents = [
          /sqlmap/i,
          /nikto/i,
          /nessus/i,
          /burpsuite/i,
          /w3af/i
        ];
        
        if (suspiciousUserAgents.some(pattern => pattern.test(userAgent))) {
          logSecurityEvent('suspicious_user_agent', {
            userAgent,
            url: req.url,
            ip: req.ip || req.headers.get('x-forwarded-for') || 'unknown'
          }, req);
          
          return false; // Block automated scanning tools
        }
        
        // Continue with normal authentication check
        return !!token;
      }
    }
  }
);

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sign-in).*)"
  ],
};
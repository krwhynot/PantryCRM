import { withAuth } from "next-auth/middleware";
import { logSecurityEvent } from "@/lib/security-logger";

export default withAuth({
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
      
      // Continue with normal authentication check
      return !!token;
    }
  }
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sign-in).*)"
  ],
};
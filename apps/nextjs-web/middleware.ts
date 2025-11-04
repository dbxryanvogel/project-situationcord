import { authkitMiddleware } from '@workos-inc/authkit-nextjs';

// In middleware auth mode, each page is protected by default.
// Exceptions are configured via the `unauthenticatedPaths` option.
export default authkitMiddleware({
  middlewareAuth: {
    enabled: true,
    unauthenticatedPaths: ['/', '/signin', '/auth/callback', '/message/:path*'],
  },
});

// Match against pages that require authentication
// Leave this out if you want authentication on every page in your application
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - .well-known/workflow (Workflow DevKit internal routes)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.well-known/workflow).*)',
  ],
};


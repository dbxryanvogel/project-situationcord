import { neonAuthMiddleware } from "@neondatabase/auth/next/server";

export default neonAuthMiddleware({
  loginUrl: "/auth/sign-in",
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
     * - auth (auth pages should be publicly accessible)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.well-known/workflow|auth).*)",
  ],
};

import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Future module: Role-based guards for staff dashboard
    // if (path.startsWith('/staff') && token?.role !== 'STAFF') {
    //   return NextResponse.redirect(new URL('/unauthorized', req.url));
    // }

    if (path.startsWith('/patient') && token?.role !== 'PATIENT') {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: ["/patient/:path*", "/staff/:path*"]
}

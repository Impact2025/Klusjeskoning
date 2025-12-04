export async function register() {
  // Sentry initialization temporarily disabled to fix Vercel build
  // The error pages (/_error, /404) fail during static generation
  // when Sentry is loaded via instrumentation

  // TODO: Re-enable once Vercel build is stable
  // if (process.env.NEXT_RUNTIME === 'nodejs') {
  //   await import('./sentry.server.config');
  // }
  // if (process.env.NEXT_RUNTIME === 'edge') {
  //   await import('./sentry.edge.config');
  // }
}

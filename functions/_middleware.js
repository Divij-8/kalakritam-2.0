// Cloudflare Pages Functions Middleware
// Handles SPA routing and proper asset serving

export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Serve static assets directly (JS, CSS, images, fonts, etc.)
  if (
    pathname.startsWith('/assets/') ||
    pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|mp4|webm|ogg|mp3|wav)$/)
  ) {
    const response = await next();
    
    // Ensure correct Content-Type for JS files
    if (pathname.endsWith('.js')) {
      const newHeaders = new Headers(response.headers);
      newHeaders.set('Content-Type', 'application/javascript; charset=utf-8');
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      });
    }
    
    return response;
  }

  // API routes - forward to your API worker
  if (pathname.startsWith('/api/')) {
    return next();
  }

  // Special files (manifest, robots, sitemap, service worker)
  if (
    pathname === '/manifest.json' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/sw.js' ||
    pathname === '/performance-worker.js' ||
    pathname === '/offline.html'
  ) {
    return next();
  }

  // For all other routes, serve index.html (SPA fallback)
  // This allows React Router to handle client-side routing
  const response = await next();
  
  // If we get a 404, serve index.html instead
  if (response.status === 404) {
    const indexResponse = await env.ASSETS.fetch(new URL('/index.html', request.url));
    return new Response(indexResponse.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  }

  return response;
}

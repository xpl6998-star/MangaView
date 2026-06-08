/**
 * MangaDex Image Proxy - Cloudflare Worker
 */

const ORIGINAL_HOST = 'uploads.mangadex.org';

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        }
      });
    }

    // 只代理图片请求
    if (!url.pathname.startsWith('/covers/')) {
      return new Response('Not Found', { status: 404 });
    }

    // 构建原始图片 URL
    const originalUrl = `https://${ORIGINAL_HOST}${url.pathname}`;

    try {
      const response = await fetch(originalUrl);
      const imageBuffer = await response.arrayBuffer();
      const contentType = response.headers.get('Content-Type') || 'image/jpeg';

      return new Response(imageBuffer, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'public, max-age=86400',
        }
      });
    } catch (error) {
      return new Response('Proxy error', { status: 500 });
    }
  }
};
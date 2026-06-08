/**
 * MangaDex Image Proxy - Cloudflare Worker
 *
 * 这个 Worker代理 MangaDex 的图片请求，添加正确的 CORS 头
 *
 * 部署步骤：
 * 1. 登录 Cloudflare Dashboard: https://dash.cloudflare.com/
 * 2. 创建 Worker
 * 3. 粘贴此代码并部署
 * 4. 获取 Worker URL (如: https://mangadex-proxy.你的账号.workers.dev)
 * 5. 将 js/api/client.js 中的 IMAGE_PROXY_BASE替换为你的 Worker URL
 */

const ORIGINAL_HOST = 'uploads.mangadex.org';
const ALLOWED_HOSTS = ['uploads.mangadex.org', 'mangadex.org'];

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // 只代理图片请求
    if (!url.pathname.startsWith('/covers/')) {
      return new Response('Not Found', { status: 404 });
    }

    // 构建原始图片 URL
    const originalUrl = `https://${ORIGINAL_HOST}${url.pathname}`;

    try {
      // 获取原始图片
      const response = await fetch(originalUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'MangaView/1.0 (Image Proxy)',
          'Accept': 'image/*',
        }
      });

      if (!response.ok) {
        return new Response('Failed to fetch image', { status: response.status });
      }

      // 获取图片内容
      const imageBuffer = await response.arrayBuffer();
      const contentType = response.headers.get('Content-Type') || 'image/jpeg';

      // 创建新的响应，添加 CORS 头
      const newResponse = new Response(imageBuffer, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'public, max-age=86400', // 缓存 1 天
          'X-Proxy': 'MangaView-CF-Worker',
        }
      });

      return newResponse;
    } catch (error) {
      console.error('Proxy error:', error);
      return new Response('Proxy error', { status: 500 });
    }
  }
};
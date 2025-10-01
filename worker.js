export default {
  async fetch(request) {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get("url");

    const origin = request.headers.get("Origin");
    const allowedOrigin = "https://yourdomain.com";
    // Good enough to prevent casual hotlinking.
    
    // Build CORS headers only if Origin matches
    const corsHeaders = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      ...(origin === allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
    };

    // Handle preflight OPTIONS requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (!targetUrl) {
      return new Response(JSON.stringify({ error: "No URL provided" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Validate URL
    let url;
    try {
      url = new URL(targetUrl);
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid URL" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    let html;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const resp = await fetch(url.toString(), {
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept":
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Connection": "keep-alive",
        },
      });
      clearTimeout(timeout);
      html = await resp.text();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch the URL (timeout or blocked)" }),
        { status: 500, headers: corsHeaders }
      );
    }

    const getMeta = (pattern) => {
      const match = html.match(pattern);
      return match ? match[1] : null;
    };

    let title =
      getMeta(/<title>(.*?)<\/title>/i) ||
      getMeta(/<meta[^>]+property=["']og:title["'][^>]+content=["'](.*?)["']/i) ||
      getMeta(/<meta[^>]+name=["']twitter:title["'][^>]+content=["'](.*?)["']/i);

    let description =
      getMeta(/<meta[^>]+name=["']description["'][^>]+content=["'](.*?)["']/i) ||
      getMeta(/<meta[^>]+property=["']og:description["'][^>]+content=["'](.*?)["']/i) ||
      getMeta(/<meta[^>]+name=["']twitter:description["'][^>]+content=["'](.*?)["']/i);

    let ogImage =
      getMeta(/<meta[^>]+property=["']og:image["'][^>]+content=["'](.*?)["']/i) ||
      getMeta(/<meta[^>]+name=["']twitter:image["'][^>]+content=["'](.*?)["']/i) ||
      getMeta(/<meta[^>]+name=["']thumbnail["'][^>]+content=["'](.*?)["']/i);

    if (ogImage && !/^https?:\/\//i.test(ogImage)) {
      ogImage = `${url.protocol}//${url.host}${ogImage}`;
    }

    if (!title) {
      const h1 = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
      title = h1 ? h1[1].replace(/<[^>]+>/g, "") : null;
    }

    if (!description) {
      const p = html.match(/<p[^>]*>(.*?)<\/p>/i);
      description = p ? p[1].replace(/<[^>]+>/g, "") : null;
    }

    if (!title && !description && !ogImage) {
      return new Response(JSON.stringify({ error: "No previewable content found" }), {
        status: 204,
        headers: corsHeaders,
      });
    }

    return new Response(
      JSON.stringify({ url: targetUrl, title, description, ogImage }),
      { headers: corsHeaders }
    );
  },
};

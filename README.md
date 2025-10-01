# How to enable popover preview of links on hover

You might have seen this "link preview" thing on my website - I implemented it using PHP. 

But I thought I'd share another approach that's even easier to set up. 

The popover preview system has two parts:

1.  **A Cloudflare Worker** that fetches and parses web pages
2.  **A frontend script** that handles hover events and shows popover previews

## How To Set It Up

### Step 1: Create a Cloudflare Worker

1. Sign up for Cloudflare (if you don't have an account) at [cloudflare.com](https://cloudflare.com)
2. Go to **Workers & Pages** in your Cloudflare dashboard
3. Click **"Create a Worker"**
4. Delete the default code and paste the worker code from [`worker.js`](https://github.com/verfasor/popover-preview-with-cloudflare-workers/blob/main/worker.js)
   - Inside the code, you’ll see:
     ```javascript
     const allowedOrigin = "https://yourdomain.com"; 
     ```
   - Update `https://yourdomain.com` to your own domain.
5. Click **"Save and Deploy"**
6. Copy your worker URL (it will look like `https://your-worker.your-subdomain.workers.dev`)

### Step 2: Add the Frontend Script + HTML snippet

1. Open your website's header or footer template
2. Add the JavaScript code and HTML snippet from [`client.html`](https://github.com/verfasor/popover-preview-with-cloudflare-workers/blob/main/client.html) to your page
3. Update the worker URL in the JavaScript:
   ```javascript
   const res = await fetch(
     "https://your-worker.your-subdomain.workers.dev/?url=" + encodeURIComponent(url)
   );
   ```
4. Add the preview box HTML to your page:
   ```html
   <!-- customize this -->
   <div id="preview-box" style="
     position:absolute;
     display:none;
     padding:8px;
     background:#fff;
     border:1px solid #ccc;
     z-index:999;
     width:300px;        
     box-sizing:border-box;
     word-wrap:break-word;
     overflow-wrap:break-word;
   "></div>
   ```

### Step 3: Test It

1. Save your changes and refresh your page
2. Hover over any link - you should see a popover preview appear
3. The frontend script is designed to be easily customizable. So make it your own.

Have fun. 

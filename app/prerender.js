import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 5185;
const DIST_DIR = path.join(__dirname, 'dist');
const SHELL_PATH = path.join(DIST_DIR, 'index-shell.html');

// Initialize Supabase
const supabaseUrl = 'https://tsqwmzkwwshzyszuvvar.supabase.co';
const supabaseAnonKey = 'sb_publishable_TPKx7bgD1BXS15Bo8bd2Mw_LeYUBbVf';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define default routes to prerender
const baseRoutes = [
  '/',
  '/story',
  '/shop',
  '/shop/new',
  '/shop/shirts',
  '/shop/t-shirts',
  '/shop/polo',
  '/shop/jeans',
  '/shop/trousers',
  '/shop/linen',
  '/shop/cargo-pants',
  '/shop/joggers',
  '/shop/shorts',
  '/shop/overshirts',
  '/shop/footwear'
];

async function getDynamicRoutes() {
  const routes = [...baseRoutes];
  const dynamicPages = [];
  const dynamicProducts = [];

  try {
    console.log('Fetching dynamic routes from Supabase...');
    
    // 1. Fetch custom CMS pages
    const { data: pageData, error: pageErr } = await supabase
      .from('storefront_config')
      .select('config')
      .eq('id', 'custom_pages')
      .maybeSingle();

    if (pageErr) {
      console.error('Error fetching custom pages:', pageErr);
    } else if (pageData && pageData.config && Array.isArray(pageData.config)) {
      console.log(`Found ${pageData.config.length} custom pages in storefront_config.`);
      for (const p of pageData.config) {
        if (p && p.slug) {
          routes.push(`/page/${p.slug}`);
          dynamicPages.push(p.slug);
        }
      }
    }

    // 2. Fetch products
    const { data: productData, error: prodErr } = await supabase
      .from('products')
      .select('id');

    if (prodErr) {
      console.error('Error fetching products:', prodErr);
    } else if (productData && Array.isArray(productData)) {
      console.log(`Found ${productData.length} products in database.`);
      for (const p of productData) {
        if (p && p.id) {
          routes.push(`/product/${p.id}`);
          dynamicProducts.push(p.id);
        }
      }
    }
  } catch (err) {
    console.error('Fallback using static routes due to error:', err);
  }

  return { routes, dynamicPages, dynamicProducts };
}

// Generates XML sitemap
function generateSitemap(routes) {
  const today = new Date().toISOString().split('T')[0];
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const r of routes) {
    const loc = `https://aura-apparel-store.vercel.app${r === '/' ? '' : r}`;
    let priority = '0.7';
    let changefreq = 'weekly';

    if (r === '/') {
      priority = '1.0';
      changefreq = 'daily';
    } else if (r === '/shop') {
      priority = '0.9';
      changefreq = 'weekly';
    } else if (r === '/story') {
      priority = '0.8';
      changefreq = 'monthly';
    } else if (r.startsWith('/product/')) {
      priority = '0.8';
      changefreq = 'weekly';
    } else if (r.startsWith('/page/')) {
      priority = '0.8';
      changefreq = 'weekly';
    } else if (r === '/shop/new') {
      priority = '0.8';
      changefreq = 'daily';
    }

    xml += '  <url>\n';
    xml += `    <loc>${loc}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>${changefreq}</changefreq>\n`;
    xml += `    <priority>${priority}</priority>\n`;
    xml += '  </url>\n';
  }

  xml += '</urlset>\n';
  return xml;
}

async function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      // Get relative URL path without query params
      const cleanUrl = req.url.split('?')[0];
      let filePath = path.join(DIST_DIR, cleanUrl);

      // SPA routing fallback: serve the backup index-shell.html if file doesn't exist
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = SHELL_PATH;
      }

      const ext = path.extname(filePath);
      let contentType = 'text/html';
      if (ext === '.js') contentType = 'text/javascript';
      else if (ext === '.css') contentType = 'text/css';
      else if (ext === '.json') contentType = 'application/json';
      else if (ext === '.svg') contentType = 'image/svg+xml';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';

      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.writeHead(500);
          res.end('Error loading file');
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content);
        }
      });
    });

    server.listen(PORT, () => {
      console.log(`Prerender local server running on port ${PORT}`);
      resolve(server);
    });
  });
}

async function run() {
  console.log('Starting prerender script...');
  
  if (!fs.existsSync(DIST_DIR)) {
    console.error('dist directory does not exist. Please run npm run build first.');
    process.exit(1);
  }

  // Get all routes dynamically
  const { routes } = await getDynamicRoutes();

  // Generate sitemap
  const sitemapXml = generateSitemap(routes);
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemapXml);
  fs.writeFileSync(path.join(__dirname, 'public', 'sitemap.xml'), sitemapXml);
  console.log('Generated dynamic sitemap.xml in public/ and dist/');

  // Create temporary copy of clean index.html shell
  fs.copyFileSync(path.join(DIST_DIR, 'index.html'), SHELL_PATH);
  console.log('Created temporary index-shell.html');

  const server = await startServer();
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Attach console and error listeners for diagnosis
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));

  for (const route of routes) {
    console.log(`Prerendering route: ${route}`);
    const url = `http://localhost:${PORT}${route}`;
    
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      // Extra sleep to ensure Supabase rendering is finished and client-side router mounts
      await new Promise(r => setTimeout(r, 1200));
      
      const html = await page.content();
      
      // Determine file output path
      let outputDir = DIST_DIR;
      let outputFile = 'index.html';
      
      if (route !== '/') {
        outputDir = path.join(DIST_DIR, route);
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      fs.writeFileSync(path.join(outputDir, outputFile), html);
      console.log(`Saved static file: ${path.join(route, outputFile)}`);
    } catch (err) {
      console.error(`Error prerendering route ${route}:`, err.message);
    }
  }

  await browser.close();
  server.close();

  // Clean up temporary index-shell.html
  if (fs.existsSync(SHELL_PATH)) {
    fs.unlinkSync(SHELL_PATH);
    console.log('Cleaned up temporary index-shell.html');
  }
  
  console.log('Prerendering finished successfully.');
}

run().catch((err) => {
  console.error('Fatal error in prerender script:', err);
  // Clean up on fatal error
  if (fs.existsSync(SHELL_PATH)) {
    fs.unlinkSync(SHELL_PATH);
  }
  process.exit(1);
});

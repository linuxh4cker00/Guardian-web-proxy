import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

// Simple blocklist. A real app could use a much larger, updated list.
const trackerBlocklist = [
  'google-analytics.com',
  'googletagmanager.com',
  'doubleclick.net',
  'facebook.net',
  'fbcdn.net',
  'analytics.yahoo.com',
];

export default async function handler(req, res) {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: 'URL parameter is required.' });
  }

  try {
    const response = await fetch(targetUrl);
    const html = await response.text();
    const dom = new JSDOM(html, { url: targetUrl });
    const document = dom.window.document;

    // 1. Remove tracking scripts
    document.querySelectorAll('script').forEach(script => {
      if (trackerBlocklist.some(domain => script.src.includes(domain))) {
        script.remove();
      }
    });

    // 2. Remove tracking pixels/images
    document.querySelectorAll('img, iframe').forEach(el => {
      if (trackerBlocklist.some(domain => el.src.includes(domain))) {
        el.remove();
      }
    });

    // 3. Remove all third-party cookies (by blocking third-party iframes)
    document.querySelectorAll('iframe').forEach(iframe => {
        try {
            const iframeUrl = new URL(iframe.src, targetUrl).hostname;
            const mainUrl = new URL(targetUrl).hostname;
            if (iframeUrl !== mainUrl) {
                iframe.remove();
            }
        } catch (e) {
            // Invalid or relative URL, can decide to keep or remove
            iframe.remove();
        }
    });

    // 4. Make all links and asset paths absolute
    document.querySelectorAll('a, link, script, img').forEach(el => {
      const attr = el.hasAttribute('href') ? 'href' : 'src';
      if (el.hasAttribute(attr)) {
        const absoluteUrl = new URL(el.getAttribute(attr), targetUrl).href;
        el.setAttribute(attr, absoluteUrl);
      }
    });

    const cleanedHtml = dom.serialize();
    res.status(200).json({ html: cleanedHtml });

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch or process the page.' });
  }
}
// scripts/scrape-bank-rules.ts
import { chromium } from 'playwright';
import * as dotenv from 'dotenv';

// Ensure local environment variables are initialized for standalone execution safety
dotenv.config({ path: '.env.local' });

export async function captureBankData(url: string) {
  // 🛡️ Guard Statement: Ensure the passed URL argument is explicitly valid
  if (!url) {
    throw new Error("🚨 Scraper error: URL parameter must be a concrete string.");
  }

  console.log(`📡 Initializing background headless Chromium context...`);
  const browser = await chromium.launch({ headless: true });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 }
  });
  
  const page = await context.newPage();

  try {
    console.log(`🔗 Navigating to target financial portal: ${url}`);
    // Wait until network activity has entirely quieted down to catch deferred JS hydration
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });

    console.log(`📄 Capturing raw inner layout text structures...`);
    const pageTextContent = await page.evaluate(() => document.body.innerText);

    console.log(`🔗 Scanning DOM tree for underlying legal T&C/KFS document files...`);
    const documentLinks = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a'));
      return anchors
        .map(a => ({ text: a.innerText?.trim(), href: a.href }))
        .filter(link => link.href && /terms|condition|kfs|key facts|important/i.test(link.text || ''));
    });

    await browser.close();
    return { pageTextContent, documentLinks };

  } catch (error) {
    console.error(`❌ Playwright scraper tracking dropped context:`, error);
    await browser.close();
    throw error;
  }
}
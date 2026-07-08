const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  console.log('Logging in...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
  await page.type('input[name="identifier"]', 'admin@example.com');
  await page.type('input[name="password"]', 'Password123!');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0' });

  console.log('Navigating directly to community page...');
  await page.goto('http://localhost:5173/communities/6a4e130d9d270c8948966d82', { waitUntil: 'networkidle0' });

  // Wait a bit for initial render
  await new Promise(r => setTimeout(r, 2000));
  console.log("Taking screenshot...");
  await page.screenshot({ path: "screenshot.png", fullPage: true });

  console.log('Navigated. Waiting for errors...');
  await new Promise(r => setTimeout(r, 2000));

  await browser.close();
})();

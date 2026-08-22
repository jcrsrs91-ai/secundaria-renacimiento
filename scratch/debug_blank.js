import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });

  try {
    await page.goto('http://localhost:4173/panel/contraloria', { waitUntil: 'networkidle0' });
    console.log("Navigation complete.");
  } catch(e) {
    console.log("Nav error", e.message);
  }

  await browser.close();
})();

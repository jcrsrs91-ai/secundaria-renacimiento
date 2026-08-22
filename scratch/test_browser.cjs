const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.toString());
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
    }
  });

  console.log("Navigating...");
  await page.goto('http://localhost:4173/dashboard/contraloria', { waitUntil: 'networkidle2' });
  
  console.log("Done.");
  await browser.close();
})();

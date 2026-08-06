export default async function run(page) {
  await page.setViewportSize({ width: 1440, height: 900 });

  const measure = async () => {
    return await page.evaluate(() => {
      const footer = document.querySelector('footer, main > section:last-of-type') || document.querySelector('main > *:last-child');
      const main = document.querySelector('main');
      const r = footer ? footer.getBoundingClientRect() : null;
      return {
        docHeight: document.documentElement.scrollHeight,
        viewport: window.innerHeight,
        mainClass: main ? main.className : null,
        footerTag: footer ? footer.tagName : null,
        footerClass: footer ? footer.className : null,
        footerTop: r ? Math.round(r.top + window.scrollY) : null,
        footerHeight: r ? Math.round(r.height) : null,
        footerWidth: r ? Math.round(r.width) : null,
      };
    });
  };

  await page.goto('http://127.0.0.1:4599/dashboard/', { waitUntil: 'networkidle' });
  const dash = await measure();
  await page.screenshot({ path: 'C:/Users/itzme/OneDrive/Desktop/multiplepage-portfolio-1.0.0/.shot-dashboard.png', fullPage: true });

  await page.goto('http://127.0.0.1:4599/about/', { waitUntil: 'networkidle' });
  const about = await measure();
  await page.screenshot({ path: 'C:/Users/itzme/OneDrive/Desktop/multiplepage-portfolio-1.0.0/.shot-about.png', fullPage: true });

  return { dash, about };
}


import { fileURLToPath } from 'url';
import { dirname } from 'path';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function run() {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    page.on('requestfailed', request => console.log('REQUEST FAILED:', request.failure()?.errorText, request.url()));

    try {
        await page.goto('http://localhost:5174/leads', { waitUntil: 'networkidle0' });

        // Wait for Add Lead button and click it
        await page.waitForSelector('button', { timeout: 5000 });

        // Evaluate to find the Add Lead button by text and click it
        const clicked = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const addLeadBtn = buttons.find(b => b.textContent.includes('Add Lead'));
            if (addLeadBtn) {
                addLeadBtn.click();
                return true;
            }
            return false;
        });

        if (clicked) {
            console.log('Clicked Add Lead button');
            // Wait for modal to open and data fetch to happen
            await new Promise(resolve => setTimeout(resolve, 3000));
        } else {
            console.log('Add Lead button not found');
        }

    } catch (e) {
        console.log('Navigation failed:', e.message);
    }

    await browser.close();
}

run();

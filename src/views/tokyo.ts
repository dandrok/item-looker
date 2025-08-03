import ora from "ora";
import puppeteer from "puppeteer";
import { generateDateRanges } from "../utils/generateDateRanges";
import { addTokyoFlightToNotion } from "../db/tokyo";

const origin = process.env.ORIGIN || "WAW";
const passengers = process.env.PASSENGERS || "2 adults";
const destinations = ["HND", "NRT", "KIX"];
const tripLengths = [20, 21, 22, 23];
const { departureDates, returnDatesMap } = generateDateRanges(
  new Date("2026-05-05"),
  new Date("2026-05-27"),
  tripLengths
);

async function checkPrices() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const results: {
    depart: string;
    return: string;
    price: number | null;
    destination: string;
  }[] = [];

  for (const destination of destinations) {
    for (const depart of departureDates) {
      for (const ret of returnDatesMap[depart]) {
        const url = `https://www.google.com/travel/flights?hl=en&gl=pl&curr=PLN&f=0&q=from%20${origin}%20to%20${destination}%20on%20${depart}%20returning%20${ret}%20for%20${passengers}`;

        const page = await browser.newPage();
        const spinner = ora(
          `Checking ${origin} → ${destination} | ${depart} → ${ret}...`
        ).start();

        try {
          await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

          try {
            await page.waitForSelector("button", { timeout: 5000 });
            const clicked = await page.evaluate(() => {
              const buttons = Array.from(document.querySelectorAll("button"));
              const acceptButton = buttons.find(
                (btn) => btn.textContent?.trim().toLowerCase() === "accept all"
              );
              if (acceptButton) {
                (acceptButton as HTMLElement).click();
                return true;
              }
              return false;
            });
            if (clicked) console.log("✅ Clicked 'Accept all' button.");
          } catch (err) {
            console.warn("⚠️ Cookie consent skipped or failed.");
          }

          await page.waitForSelector(
            'div.YMlIz span[aria-label*="Polish zlotys"]',
            { timeout: 20000 }
          );
          const priceText = await page.$eval(
            'div.YMlIz span[aria-label*="Polish zlotys"]',
            (el) => el.textContent ?? ""
          );
          const price = parseInt(priceText.replace(/[^\d]/g, ""), 10) || null;

          spinner.succeed(
            `✓ ${origin} → ${destination} | ${depart} → ${ret}: ${
              price ? price + " PLN" : "Price not found"
            }`
          );

          results.push({ depart, return: ret, price, destination });
        } catch (err: any) {
          spinner.fail(
            `✗ ${origin} → ${destination} | ${depart} → ${ret} failed: ${err.message}`
          );
          results.push({ depart, return: ret, price: null, destination });
        }

        await page.close();
        await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1500));
      }
    }
  }

  await browser.close();

  const validResults = results.filter((r) => r.price !== null);

  const cheapestByDestination: {
    [key: string]: {
      depart: string;
      return: string;
      price: number;
      destination: string;
    };
  } = {};

  for (const dest of destinations) {
    const cheapest = validResults
      .filter((r) => r.destination === dest)
      .sort((a, b) => a.price! - b.price!)[0];

    if (cheapest && cheapest.price !== null) {
      cheapestByDestination[dest] = {
        ...cheapest,
        price: cheapest.price as number,
      };
    }
  }

  console.log("\n🔥 Cheapest options by destination:");
  for (const dest in cheapestByDestination) {
    const flight = cheapestByDestination[dest];
    console.log(
      `✈️ ${dest}: ${flight.depart} → ${flight.return} — ${flight.price} PLN`
    );
    await addTokyoFlightToNotion(flight);
  }
}

checkPrices();

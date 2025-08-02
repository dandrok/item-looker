import { Client } from "@notionhq/client";
import dotenv from "dotenv";
dotenv.config();

const auth = process.env.NOTION_TOKEN;
const database_id = process.env.FLIGHTS_DB_ID;

const notion = new Client({
  auth,
});

function formatNow(): string {
  const now = new Date();
  return new Intl.DateTimeFormat("pl-PL", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
    .format(now)
    .replace(",", " –")
    .replace(" o ", " –"); // adjust to your desired format
}

export async function addFlightToNotion(flight: {
  depart: string;
  return: string;
  price: number | null;
}) {
  try {
    await notion.pages.create({
      parent: { database_id },
      properties: {
        "Created At": {
          title: [
            {
              text: {
                content: formatNow(),
              },
            },
          ],
        },
        depart: {
          date: { start: new Date(flight.depart).toISOString() },
        },
        return: {
          date: { start: new Date(flight.return).toISOString() },
        },
        price: {
          number: flight.price,
        },
      },
    });
    console.log("✅ Flight added to Notion database.");
  } catch (error) {
    console.error("❌ Failed to add flight to Notion:", error);
  }
}

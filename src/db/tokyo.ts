import { Client } from "@notionhq/client";
import dotenv from "dotenv";
dotenv.config();

const auth = process.env.NOTION_TOKEN;
const database_id = process.env.TOKYO_DB_ID;

const notion = new Client({ auth });

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
    .replace(" o ", " –");
}

export async function addTokyoFlightToNotion(flight: {
  depart: string;
  return: string;
  price: number | null;
  destination?: string;
}) {
  const pageData: any = {
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
      Depart: {
        date: { start: new Date(flight.depart).toISOString() },
      },
      Return: {
        date: { start: new Date(flight.return).toISOString() },
      },
      Price: {
        number: flight.price,
      },
    },
  };

  if (flight.destination) {
    pageData.properties["Destination"] = {
      rich_text: [
        {
          type: "text",
          text: { content: flight.destination },
        },
      ],
    };
  }

  try {
    await notion.pages.create(pageData);
    console.log("✅ Flight added to Notion.");
  } catch (error: any) {
    console.error("❌ Failed to add flight to Notion:", error.message);
  }
}

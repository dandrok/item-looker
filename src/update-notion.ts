import { Client } from "@notionhq/client";
import fs from "fs/promises";
import path from "path";

const notionToken = "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";
const databaseId = "22f63fff-f2d6-80b4-93f8-ce1dc495aefa";

const notion = new Client({ auth: notionToken });

async function loadOlxData() {
  const filePath = path.resolve("olx-data.json");
  const data = await fs.readFile(filePath, "utf-8");
  return JSON.parse(data);
}

async function insertItems(items) {
  for (const item of items) {
    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Title: {
          title: [
            {
              text: { content: item.title },
            },
          ],
        },
        Link: {
          url: item.href,
        },
        Price: {
          rich_text: [
            {
              text: { content: item.price },
            },
          ],
        },
        Location: {
          rich_text: [
            {
              text: { content: item.location },
            },
          ],
        },
        Added: {
          rich_text: [
            {
              text: { content: item.addedDate },
            },
          ],
        },
      },
    });

    console.log(`✅ Inserted: ${item.title}`);
  }
}

export const syncToNotion = async () => {
  try {
    const olxItems = await loadOlxData();
    await insertItems(olxItems);
    console.log("🎉 All items inserted!");
  } catch (err) {
    console.error("❌ Error:", err);
  }
};

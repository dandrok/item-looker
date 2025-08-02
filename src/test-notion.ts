import { Client } from "@notionhq/client";
import dotenv from "dotenv";
dotenv.config();

const auth = process.env.NOTION_TOKEN;
const database_id = process.env.TEST_ID || "";

const notion = new Client({ auth });

async function addTestPage() {
  try {
    const response = await notion.pages.create({
      parent: { database_id },
      properties: {
        Name: {
          title: [
            {
              text: {
                content: "Test from GitHub Actions",
              },
            },
          ],
        },
      },
    });
    console.log("Page added:", response.id);
  } catch (error) {
    console.error("Error adding page:", error);
  }
}

addTestPage();

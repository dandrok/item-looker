import { Client } from "@notionhq/client";

const notionToken = "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";

const notion = new Client({ auth: notionToken });

async function addTestPage() {
  try {
    const response = await notion.pages.create({
      parent: { database_id: "22f63ffff2d680f8b73c000cda692c29" },
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

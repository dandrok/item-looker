# ✈️📦 Item & Flight Tracker to Notion

A Node.js + TypeScript project that automates the tracking of online listings (e.g. OLX) and flight prices (e.g. Google Flights), syncing only **new or cheapest** results to a Notion database.

## 🚀 Features

- Scrapes fresh listings from OLX
- Monitors flight prices for predefined routes and dates
- Prevents duplicates by checking against existing Notion data
- Uses Puppeteer for browser automation
- Scheduled runs via GitHub Actions (optional)

## 🧪 Getting Started

1.**Clone the repo**

```bash
git clone https://github.com/your-username/item-looker.git
cd item-looker
Install dependencies - npm i
```

2.**Create a .env file with**

```bash
NOTION_TOKEN=your_notion_token
OLX_DB_ID=your_notion_olx_database_id
FLIGHTS_DB_ID=your_notion_flights_database_id
```

3.**Run scripts**

- item scraper script

  ```bash
  npm run dev
  ```

- flight tracker script

  ```bash
  npm run flights
  ```

---

### ⚙️ Environment Variables

Variable Description
`NOTION_TOKEN` - Notion integration token
`OLX_DB_ID` - Database ID for storing item listings
`FLIGHTS_DB_ID` - Database ID for storing flight prices

---

### 🧠 Structure

src/
├── index.ts `# Entry point for item scraper`
├── views/
│ └── flights.ts `# Script for scraping flight prices`
├── views/
│ └── olx.ts `# OLX-specific scraping logic`
├── update-notion.ts `# Logic for syncing to Notion`

---

### 🔁 GitHub Actions (optional)

You can run your scrapers on a schedule using GitHub Actions:

**schedule: - cron: '- cron: "0 _/8 _ \* \*" # every 8 hours**

Remember to set secrets (NOTION_TOKEN, etc.) in your repo settings.

---

### 🧰 Tech Stack

- Node.js
- TypeScript
- Puppeteer
- dotenv
- Notion SDK
- GitHub Actions
- tsx (for dev watch)

---

### 🗃️ Notion Database Structure

This project uses two separate Notion databases: one for flight prices and one for item listings (e.g. from OLX).

#### ✈️ Flights Database

Each flight entry includes dates and price.

- `Created At` `Title` - Timestamp of entry creation
- `depart` `Date` - Outbound flight date
- `return` `Date` - Return flight date
- `price` `Number` - Flight price (e.g. in PLN or EUR)

Example structure in code:

```TypeScript
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
  }
```

#### 📦 OLX Items Database

Each OLX listing entry includes the item title, price, location, date added, and link.

- `Title` `Title` - Listing title
- `Price` `Rich Text` - Price string from the ad
- `Location` `Rich Text` - Location of the listing
- `Added` `Rich Text` - Date it was added (as text)
- `Link` `URL` - Direct link to the OLX listing

Example structure in code:

```TypeScript
  properties: {
    Title: { title: [{ text: { content: item.title } }] },
    Link: { url: item.href },
    Price: { rich_text: [{ text: { content: item.price } }] },
    Location: { rich_text: [{ text: { content: item.location } }] },
    Added: { rich_text: [{ text: { content: item.addedDate } }] },
  }
```

require("dotenv").config({
  path: require("path").join(__dirname, "../.env"),
});

const connectDB = require("../src/config/db");
const Car = require("../src/models/Car");

const API_URL =
  "https://commons.wikimedia.org/w/api.php";

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function cleanText(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getBaseModel(model = "") {
  const text = cleanText(model);

  const modelPatterns = [
    "range rover sport",
    "range rover",
    "grand cherokee",
    "scorpio n",
    "xuv 3xo",
    "xuv700",
    "innova hycross",
    "grand vitara",
    "zs ev",
    "nexon ev",
    "amg gt",
    "3 series",
    "5 series",
    "c class",
    "e class",
    "f pace",
    "f type",
    "xc90",
    "xc60",
    "xc40",
    "rs q8",
    "q8",
    "q7",
    "q5",
    "q3",
    "a6",
    "a4",
    "911",
    "cayenne",
    "macan",
    "panamera",
    "fortuner",
    "camry",
    "compass",
    "meridian",
    "wrangler",
    "taigun",
    "tiguan",
    "kodiaq",
    "slavia",
    "kushaq",
    "superb",
    "creta",
    "tucson",
    "verna",
    "alcazar",
    "i20",
    "seltos",
    "sonet",
    "carens",
    "ev6",
    "nexon",
    "harrier",
    "safari",
    "curvv",
    "thar",
    "xuv700",
    "city",
    "elevate",
    "amaze",
    "jimny",
    "baleno",
    "ciaz",
    "invicto",
    "hector",
    "gloster",
    "astor",
    "rx",
    "nx",
    "es",
    "lx",
    "defender",
    "discovery",
    "xf",
    "i pace",
    "m4",
    "x5",
    "x3",
    "x7",
    "glc",
    "gle",
  ];

  for (const pattern of modelPatterns) {
    if (text.includes(pattern)) {
      return pattern;
    }
  }

  return text;
}

function getSearchTerms(car) {
  const brand = cleanText(car.brand);
  const model = getBaseModel(car.model);

  const searches = [
    `${brand} ${model} car`,
    `${brand} ${model}`,
    `${brand} automobile ${model}`,
  ];

  return [...new Set(searches)];
}

async function searchCommons(searchTerm) {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: searchTerm,
    gsrnamespace: "6",
    gsrlimit: "10",
    prop: "imageinfo",
    iiprop:
      "url|extmetadata|mime|size",
    iiurlwidth: "1200",
    format: "json",
    origin: "*",
  });

  const response = await fetch(
    `${API_URL}?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(
      `Wikimedia request failed: ${response.status}`
    );
  }

  return response.json();
}

function extractMetadata(page) {
  const metadata = page.imageinfo?.[0];

  if (!metadata) {
    return null;
  }

  const ext = metadata.extmetadata || {};

  const getValue = (key) =>
    ext[key]?.value || "";

  const license =
    getValue("LicenseShortName") ||
    getValue("License") ||
    "";

  const author =
    getValue("Artist") ||
    getValue("Author") ||
    "";

  const title =
    getValue("ObjectName") ||
    page.title.replace("File:", "");

  return {
    title,
    imageUrl:
      metadata.thumburl ||
      metadata.url,
    originalUrl:
      metadata.url,
    pageUrl:
      `https://commons.wikimedia.org/wiki/${encodeURIComponent(
        page.title.replace(/ /g, "_")
      )}`,
    author,
    license,
    mime:
      metadata.mime || "",
  };
}

function scoreImage(page, car) {
  const title = cleanText(
    page.title.replace("File:", "")
  );

  const brand = cleanText(car.brand);
  const model = getBaseModel(car.model);

  let score = 0;

  if (title.includes(brand)) {
    score += 50;
  }

  if (title.includes(model)) {
    score += 80;
  }

  if (
    title.includes("car") ||
    title.includes("automobile") ||
    title.includes("vehicle")
  ) {
    score += 10;
  }

  if (
    title.includes("logo") ||
    title.includes("badge") ||
    title.includes("interior") ||
    title.includes("engine") ||
    title.includes("wheel")
  ) {
    score -= 100;
  }

  return score;
}

async function findRealImage(car) {
  const searches = getSearchTerms(car);

  let candidates = [];

  for (const searchTerm of searches) {
    console.log(
      `Searching Wikimedia: ${searchTerm}`
    );

    try {
      const data =
        await searchCommons(searchTerm);

      const pages =
        Object.values(data.query?.pages || {});

      candidates.push(...pages);

      if (pages.length > 0) {
        break;
      }
    } catch (error) {
      console.log(
        `Search failed: ${error.message}`
      );
    }

    await sleep(300);
  }

  if (!candidates.length) {
    return null;
  }

  candidates = candidates
    .filter(
      (page) =>
        page.imageinfo?.[0]?.mime?.startsWith(
          "image/"
        )
    )
    .map((page) => ({
      page,
      score: scoreImage(page, car),
    }))
    .sort((a, b) => b.score - a.score);

  if (!candidates.length) {
    return null;
  }

  const best = candidates[0];

  if (best.score < 30) {
    return null;
  }

  return extractMetadata(best.page);
}

async function updateCarImages() {
  try {
    await connectDB();

    console.log("MongoDB connected");

    const cars = await Car.find({});

    console.log(
      `Found ${cars.length} cars.`
    );

    let updated = 0;
    let skipped = 0;

    for (const car of cars) {
      console.log("");
      console.log(
        `Processing: ${car.brand} ${car.model}`
      );

      const image =
        await findRealImage(car);

      if (!image) {
        console.log(
          `No reliable image found: ${car.brand} ${car.model}`
        );

        skipped++;
        continue;
      }

      await Car.updateOne(
        { _id: car._id },
        {
          $set: {
            images: [image.imageUrl],

            imageSource: {
              provider:
                "Wikimedia Commons",

              title: image.title,

              pageUrl:
                image.pageUrl,

              originalUrl:
                image.originalUrl,

              author:
                image.author,

              license:
                image.license,
            },
          },
        }
      );

      updated++;

      console.log(
        `Updated: ${car.brand} ${car.model}`
      );

      console.log(
        `License: ${image.license || "Not available"}`
      );

      await sleep(500);
    }

    console.log("");
    console.log(
      "================================"
    );
    console.log(
      "Real image update completed"
    );
    console.log(
      "================================"
    );
    console.log(
      `Total cars: ${cars.length}`
    );
    console.log(
      `Updated: ${updated}`
    );
    console.log(
      `Skipped: ${skipped}`
    );
    console.log(
      "================================"
    );

    process.exit(0);
  } catch (error) {
    console.error(
      "Real image update failed:"
    );

    console.error(error);

    process.exit(1);
  }
}

updateCarImages();
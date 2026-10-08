require("dotenv").config({
  path: require("path").join(__dirname, "../.env"),
});

const axios = require("axios");
const connectDB = require("../src/config/db");
const Car = require("../src/models/Car");

const API_URL =
  "https://commons.wikimedia.org/w/api.php";

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function clean(value = "") {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/*
  Important model aliases.

  These help when the database name and
  Wikimedia name are slightly different.
*/

const modelAliases = {
  "Mercedes Benz|C Class": [
    "Mercedes Benz C Class",
    "Mercedes Benz C-Class",
    "Mercedes C Class",
    "Mercedes C-Class",
  ],

  "Mercedes Benz|E Class": [
    "Mercedes Benz E Class",
    "Mercedes Benz E-Class",
    "Mercedes E Class",
    "Mercedes E-Class",
  ],

  "Mercedes Benz|GLC": [
    "Mercedes Benz GLC",
    "Mercedes Benz GLC SUV",
    "Mercedes GLC",
  ],

  "Mercedes Benz|GLE": [
    "Mercedes Benz GLE",
    "Mercedes GLE",
  ],

  "Mercedes Benz|AMG GT": [
    "Mercedes AMG GT",
    "Mercedes Benz AMG GT",
    "Mercedes-AMG GT",
  ],

  "Land Rover|Range Rover": [
    "Range Rover",
    "Land Rover Range Rover",
  ],

  "Land Rover|Range Rover Sport": [
    "Range Rover Sport",
    "Land Rover Range Rover Sport",
  ],

  "Land Rover|Defender": [
    "Land Rover Defender",
    "Defender",
  ],

  "Land Rover|Discovery": [
    "Land Rover Discovery",
    "Discovery",
  ],

  "Maruti Suzuki|Grand Vitara": [
    "Maruti Suzuki Grand Vitara",
    "Suzuki Grand Vitara",
    "Grand Vitara",
  ],

  "Maruti Suzuki|Invicto": [
    "Maruti Suzuki Invicto",
    "Toyota Innova Hycross",
  ],

  "Maruti Suzuki|Jimny": [
    "Suzuki Jimny",
    "Maruti Suzuki Jimny",
    "Jimny",
  ],

  "Maruti Suzuki|Baleno": [
    "Maruti Suzuki Baleno",
    "Suzuki Baleno",
    "Baleno",
  ],

  "Mahindra|Thar": [
    "Mahindra Thar",
    "Mahindra Thar SUV",
  ],

  "Mahindra|Scorpio N": [
    "Mahindra Scorpio N",
    "Mahindra Scorpio",
  ],

  "Mahindra|XUV700": [
    "Mahindra XUV700",
    "Mahindra XUV 700",
  ],

  "Mahindra|XUV 3XO": [
    "Mahindra XUV 3XO",
    "Mahindra XUV300",
  ],

  "Tata|Nexon": [
    "Tata Nexon",
  ],

  "Tata|Nexon EV": [
    "Tata Nexon EV",
    "Tata Nexon Electric",
  ],

  "Tata|Harrier": [
    "Tata Harrier",
  ],

  "Tata|Safari": [
    "Tata Safari",
  ],

  "Hyundai|Creta": [
    "Hyundai Creta",
  ],

  "Hyundai|Tucson": [
    "Hyundai Tucson",
  ],

  "Hyundai|Verna": [
    "Hyundai Verna",
  ],

  "Hyundai|Alcazar": [
    "Hyundai Alcazar",
  ],

  "Kia|Seltos": [
    "Kia Seltos",
  ],

  "Kia|Sonet": [
    "Kia Sonet",
  ],

  "Kia|Carens": [
    "Kia Carens",
  ],

  "Kia|EV6": [
    "Kia EV6",
  ],

  "Honda|City": [
    "Honda City",
  ],

  "Honda|Elevate": [
    "Honda Elevate",
  ],

  "Honda|Amaze": [
    "Honda Amaze",
  ],

  "Toyota|Fortuner": [
    "Toyota Fortuner",
  ],

  "Toyota|Camry": [
    "Toyota Camry",
  ],

  "Toyota|Innova Hycross": [
    "Toyota Innova Hycross",
    "Toyota Innova HyCross",
  ],

  "Toyota|Land Cruiser": [
    "Toyota Land Cruiser",
    "Toyota Land Cruiser 300",
  ],
};

function getAliases(car) {
  const key = `${car.brand}|${car.model}`;

  if (modelAliases[key]) {
    return modelAliases[key];
  }

  return [
    `${car.brand} ${car.model}`,
    `${car.model} ${car.brand}`,
    `${car.brand} ${car.model} automobile`,
  ];
}

async function requestCommons(params, retry = 0) {
  try {
    const response = await axios.get(API_URL, {
      params: {
        ...params,
        format: "json",
        origin: "*",
      },

      timeout: 30000,

      headers: {
        "User-Agent":
          "MotoraCarCatalog/1.0 (demo vehicle catalog)",
        Accept: "application/json",
      },
    });

    return response.data;
  } catch (error) {
    const status =
      error.response?.status;

    if (
      (status === 429 ||
        status === 503 ||
        status === 502) &&
      retry < 4
    ) {
      const wait =
        2000 * (retry + 1);

      console.log(
        `Commons rate limit/server response ${status}. Retrying in ${wait}ms...`
      );

      await sleep(wait);

      return requestCommons(
        params,
        retry + 1
      );
    }

    throw error;
  }
}

async function searchCommons(query) {
  try {
    const data =
      await requestCommons({
        action: "query",
        generator: "search",
        gsrsearch: query,
        gsrnamespace: 6,
        gsrlimit: 20,
        prop: "imageinfo",
        iiprop: "url|mime|size",
        iiurlwidth: 1400,
      });

    const pages =
      data?.query?.pages || {};

    return Object.values(pages)
      .map((page) => {
        const info =
          page.imageinfo?.[0];

        if (!info) {
          return null;
        }

        if (
          info.mime &&
          !info.mime.startsWith("image/")
        ) {
          return null;
        }

        return {
          title: page.title || "",
          url:
            info.thumburl ||
            info.url ||
            null,
        };
      })
      .filter(Boolean);
  } catch (error) {
    console.log(
      `Search failed: ${query}`
    );

    return [];
  }
}

function scoreResult(car, result) {
  const title = clean(
    result.title
  );

  const brand = clean(
    car.brand
  );

  const model = clean(
    car.model
  );

  const aliases =
    getAliases(car);

  let score = 0;

  if (title.includes(brand)) {
    score += 20;
  }

  if (title.includes(model)) {
    score += 50;
  }

  for (const alias of aliases) {
    const aliasText =
      clean(alias);

    if (
      aliasText &&
      title.includes(aliasText)
    ) {
      score += 80;
    }
  }

  const badWords = [
    "accident",
    "crash",
    "wreck",
    "damaged",
    "toy",
    "scale model",
    "miniature",
    "logo",
    "badge",
    "engine",
    "wheel",
    "interior",
    "part",
  ];

  for (const word of badWords) {
    if (title.includes(word)) {
      score -= 100;
    }
  }

  return score;
}

async function getImagesForModel(car) {
  const aliases =
    getAliases(car);

  const allResults = [];

  for (
    const query of aliases
  ) {
    console.log(
      `Searching: ${query}`
    );

    const results =
      await searchCommons(
        query
      );

    allResults.push(
      ...results
    );

    await sleep(1500);

    if (
      allResults.length >= 40
    ) {
      break;
    }
  }

  const unique =
    new Map();

  for (
    const result of allResults
  ) {
    if (!result.url) {
      continue;
    }

    if (
      !unique.has(result.url)
    ) {
      unique.set(
        result.url,
        result
      );
    }
  }

  return [...unique.values()]
    .map((result) => ({
      ...result,
      score:
        scoreResult(
          car,
          result
        ),
    }))
    .filter(
      (result) =>
        result.score >= 50
    )
    .sort(
      (a, b) =>
        b.score - a.score
    )
    .slice(0, 8);
}

async function updateImages() {
  await connectDB();

  const cars =
    await Car.find({})
      .sort({ createdAt: 1 });

  console.log(
    `Found ${cars.length} cars.`
  );

  /*
    Cache by brand + model.

    This means BMW X5 is searched only once,
    even if there are many BMW X5 listings.
  */

  const modelCache =
    new Map();

  const modelUsage =
    new Map();

  let updated = 0;
  let skipped = 0;

  for (
    let i = 0;
    i < cars.length;
    i++
  ) {
    const car = cars[i];

    const modelKey =
      `${car.brand}|${car.model}`;

    console.log(
      `\n[${i + 1}/${cars.length}] ${car.brand} ${car.model} ${car.variant || ""}`
    );

    if (
      !modelCache.has(modelKey)
    ) {
      const images =
        await getImagesForModel(
          car
        );

      modelCache.set(
        modelKey,
        images
      );

      console.log(
        `Found ${images.length} suitable images for ${modelKey}`
      );

      await sleep(2000);
    }

    const images =
      modelCache.get(
        modelKey
      );

    if (
      !images ||
      images.length === 0
    ) {
      console.log(
        "No reliable model image found. Existing image preserved."
      );

      skipped++;
      continue;
    }

    const used =
      modelUsage.get(
        modelKey
      ) || 0;

    /*
      Rotate through different images.

      Example:
      BMW X5 listing 1 -> image 1
      BMW X5 listing 2 -> image 2
      BMW X5 listing 3 -> image 3
      BMW X5 listing 4 -> image 4
    */

    const selected = [];

    for (
      let j = 0;
      j < Math.min(3, images.length);
      j++
    ) {
      const index =
        (used + j) %
        images.length;

      selected.push(
        images[index].url
      );
    }

    modelUsage.set(
      modelKey,
      used + 1
    );

    await Car.updateOne(
      { _id: car._id },
      {
        $set: {
          images: selected,
        },
      }
    );

    updated++;

    console.log(
      `Updated with ${selected.length} model specific images.`
    );

    await sleep(1000);
  }

  console.log(
    "\n================================"
  );

  console.log(
    "MOTORA IMAGE UPDATE COMPLETE"
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
    `Unique models processed: ${modelCache.size}`
  );

  console.log(
    "Existing car records were not deleted."
  );

  console.log(
    "================================"
  );

  process.exit(0);
}

updateImages().catch(
  (error) => {
    console.error(
      "\nImage update failed:"
    );

    console.error(
      error
    );

    process.exit(1);
  }
);
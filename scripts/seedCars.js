require("dotenv").config({
  path: require("path").join(__dirname, "../.env"),
});

const connectDB = require("../src/config/db");
const Car = require("../src/models/Car");

const brands = {
  BMW: {
    models: [
      ["3 Series", "Sedan", ["330i M Sport", "320d M Sport", "330Li M Sport"]],
      ["5 Series", "Sedan", ["530i M Sport", "520d Luxury Line"]],
      ["X3", "SUV", ["xDrive20d", "xDrive30i M Sport"]],
      ["X5", "SUV", ["xDrive30d", "xDrive40i"]],
      ["M4", "Coupe", ["Competition", "M4 Coupe"]],
    ],
    basePrice: 6500000,
    fuels: ["Petrol", "Diesel"],
  },

  "Mercedes Benz": {
    models: [
      ["C Class", "Sedan", ["C200", "C220d", "C300"]],
      ["E Class", "Sedan", ["E200", "E220d", "E350d"]],
      ["GLC", "SUV", ["200", "220d", "300"]],
      ["GLE", "SUV", ["300d", "450", "450d"]],
      ["AMG GT", "Coupe", ["43", "55", "63 S"]],
    ],
    basePrice: 7000000,
    fuels: ["Petrol", "Diesel"],
  },

  Audi: {
    models: [
      ["A4", "Sedan", ["Premium", "Technology", "S Line"]],
      ["A6", "Sedan", ["Premium Plus", "Technology"]],
      ["Q3", "SUV", ["Premium", "Technology"]],
      ["Q5", "SUV", ["Premium Plus", "Technology"]],
      ["Q7", "SUV", ["Premium Plus", "Technology"]],
    ],
    basePrice: 5200000,
    fuels: ["Petrol"],
  },

  Porsche: {
    models: [
      ["911", "Sports", ["Carrera", "Carrera S", "Turbo"]],
      ["Cayenne", "SUV", ["Base", "S", "GTS"]],
      ["Macan", "SUV", ["Base", "S", "GTS"]],
      ["Panamera", "Sedan", ["4", "4S", "GTS"]],
    ],
    basePrice: 12000000,
    fuels: ["Petrol", "Hybrid"],
  },

  "Land Rover": {
    models: [
      ["Range Rover Sport", "SUV", ["Dynamic SE", "Autobiography"]],
      ["Range Rover", "SUV", ["HSE", "Autobiography"]],
      ["Defender", "SUV", ["110 HSE", "110 X", "130 HSE"]],
      ["Discovery", "SUV", ["Dynamic SE", "Metropolitan"]],
    ],
    basePrice: 9000000,
    fuels: ["Diesel", "Petrol"],
  },

  Volvo: {
    models: [
      ["XC40", "SUV", ["B4 Ultimate", "Recharge"]],
      ["XC60", "SUV", ["B5 Ultimate", "Recharge"]],
      ["XC90", "SUV", ["B6 Ultimate", "Recharge"]],
      ["S90", "Sedan", ["B5 Ultimate"]],
    ],
    basePrice: 4500000,
    fuels: ["Petrol", "Hybrid"],
  },

  Jaguar: {
    models: [
      ["F Pace", "SUV", ["R Dynamic S", "R Dynamic SE"]],
      ["F Type", "Sports", ["R Dynamic", "R"]],
      ["I Pace", "SUV", ["HSE", "Black"]],
      ["XF", "Sedan", ["R Dynamic", "Portfolio"]],
    ],
    basePrice: 5000000,
    fuels: ["Petrol", "Diesel", "Electric"],
  },

  Lexus: {
    models: [
      ["ES", "Sedan", ["300h Exquisite", "300h Luxury"]],
      ["NX", "SUV", ["350h Exquisite", "350h Luxury"]],
      ["RX", "SUV", ["350h Luxury", "500h F Sport"]],
      ["LX", "SUV", ["500d", "600"]],
    ],
    basePrice: 6000000,
    fuels: ["Petrol", "Hybrid", "Diesel"],
  },

  Toyota: {
    models: [
      ["Fortuner", "SUV", ["Legender", "4x4 AT", "4x2 AT"]],
      ["Camry", "Sedan", ["Hybrid"]],
      ["Innova Hycross", "MPV", ["ZX Hybrid", "VX Hybrid", "GX"]],
      ["Land Cruiser", "SUV", ["300", "GR Sport"]],
    ],
    basePrice: 2800000,
    fuels: ["Petrol", "Diesel", "Hybrid"],
  },

  Jeep: {
    models: [
      ["Compass", "SUV", ["Model S", "Black Shark", "Limited"]],
      ["Meridian", "SUV", ["Limited", "Overland"]],
      ["Wrangler", "SUV", ["Unlimited", "Rubicon"]],
      ["Grand Cherokee", "SUV", ["Limited", "Summit Reserve"]],
    ],
    basePrice: 2800000,
    fuels: ["Petrol", "Diesel"],
  },

  Volkswagen: {
    models: [
      ["Virtus", "Sedan", ["GT Plus", "Topline"]],
      ["Taigun", "SUV", ["GT Plus", "Topline"]],
      ["Tiguan", "SUV", ["Elegance", "R Line"]],
    ],
    basePrice: 1600000,
    fuels: ["Petrol"],
  },

  Skoda: {
    models: [
      ["Slavia", "Sedan", ["Style", "Monte Carlo", "Prestige"]],
      ["Kushaq", "SUV", ["Style", "Monte Carlo"]],
      ["Kodiaq", "SUV", ["Sportline", "L and K"]],
      ["Superb", "Sedan", ["L and K"]],
    ],
    basePrice: 1700000,
    fuels: ["Petrol"],
  },

  Hyundai: {
    models: [
      ["Creta", "SUV", ["SX Tech", "SX(O)", "N Line"]],
      ["Tucson", "SUV", ["Signature", "Platinum"]],
      ["Verna", "Sedan", ["SX", "SX(O)", "Turbo"]],
      ["Alcazar", "SUV", ["Signature", "Platinum"]],
      ["i20", "Hatchback", ["Asta", "N Line"]],
    ],
    basePrice: 900000,
    fuels: ["Petrol", "Diesel"],
  },

  Kia: {
    models: [
      ["Seltos", "SUV", ["GTX Plus", "X Line", "HTX"]],
      ["Sonet", "SUV", ["GTX Plus", "X Line"]],
      ["Carens", "MPV", ["Luxury Plus", "Prestige Plus"]],
      ["EV6", "SUV", ["GT Line", "GT"]],
    ],
    basePrice: 1000000,
    fuels: ["Petrol", "Diesel", "Electric"],
  },

  Tata: {
    models: [
      ["Nexon", "SUV", ["Fearless", "Creative Plus"]],
      ["Harrier", "SUV", ["Fearless", "Dark Edition"]],
      ["Safari", "SUV", ["Accomplished", "Dark Edition"]],
      ["Curvv", "SUV", ["Accomplished", "Empowered"]],
      ["Nexon EV", "SUV", ["Empowered Plus", "Fearless"]],
    ],
    basePrice: 800000,
    fuels: ["Petrol", "Diesel", "Electric"],
  },

  Mahindra: {
    models: [
      ["XUV700", "SUV", ["AX7", "AX7L", "AX5"]],
      ["Scorpio N", "SUV", ["Z8", "Z8L"]],
      ["Thar", "SUV", ["LX", "Earth Edition"]],
      ["XUV 3XO", "SUV", ["AX7", "AX5"]],
    ],
    basePrice: 900000,
    fuels: ["Petrol", "Diesel"],
  },

  Honda: {
    models: [
      ["City", "Sedan", ["ZX", "V"]],
      ["Elevate", "SUV", ["ZX", "VX"]],
      ["Amaze", "Sedan", ["VX", "ZX"]],
    ],
    basePrice: 800000,
    fuels: ["Petrol"],
  },

  "Maruti Suzuki": {
    models: [
      ["Grand Vitara", "SUV", ["Alpha", "Alpha Plus", "Zeta"]],
      ["Invicto", "MPV", ["Alpha Plus", "Zeta Plus"]],
      ["Jimny", "SUV", ["Alpha", "Thunder Edition"]],
      ["Ciaz", "Sedan", ["Alpha", "Delta"]],
      ["Baleno", "Hatchback", ["Alpha", "Zeta"]],
    ],
    basePrice: 700000,
    fuels: ["Petrol", "Hybrid"],
  },

  MG: {
    models: [
      ["Hector", "SUV", ["Sharp Pro", "Savvy Pro"]],
      ["Gloster", "SUV", ["Blackstorm", "Savvy"]],
      ["ZS EV", "SUV", ["Exclusive", "Essence"]],
      ["Astor", "SUV", ["Savvy Pro", "Sharp"]],
    ],
    basePrice: 1000000,
    fuels: ["Petrol", "Diesel", "Electric"],
  },
};

const locations = [
  "Delhi",
  "Mumbai",
  "Bangalore",
  "Pune",
  "Gurgaon",
  "Noida",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Ahmedabad",
  "Jaipur",
  "Chandigarh",
];

const colors = [
  "Black",
  "White",
  "Silver",
  "Grey",
  "Blue",
  "Red",
];

const features = [
  "360 Camera",
  "Panoramic Sunroof",
  "Wireless Apple CarPlay",
  "Android Auto",
  "Adaptive Cruise Control",
  "Ventilated Seats",
  "Premium Audio",
  "Digital Cockpit",
  "LED Headlamps",
  "Blind Spot Monitoring",
  "Parking Assist",
  "Connected Car Technology",
];

const engineOptions = {
  SUV: ["1497 cc", "1998 cc", "2198 cc", "2993 cc"],
  Sedan: ["1498 cc", "1998 cc", "2998 cc"],
  Coupe: ["1998 cc", "2998 cc", "3998 cc"],
  Sports: ["2998 cc", "3998 cc", "3982 cc"],
  Hatchback: ["1197 cc", "1497 cc"],
  MPV: ["1497 cc", "1987 cc", "2393 cc"],
};

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPrice(basePrice) {
  const multiplier = 0.85 + Math.random() * 0.8;
  return Math.round((basePrice * multiplier) / 50000) * 50000;
}

function randomFeatures() {
  const shuffled = [...features].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 4);
}

function createCar(brand, info, index) {
  const modelData = randomItem(info.models);

  const model = modelData[0];
  const type = modelData[1];
  const variant = randomItem(modelData[2]);

  const year = randomItem([
    2022,
    2023,
    2024,
    2025,
    2026,
  ]);

  const fuel = randomItem(info.fuels);

  const transmission =
    fuel === "Electric"
      ? "Automatic"
      : Math.random() > 0.15
        ? "Automatic"
        : "Manual";

  const km = randomNumber(2500, 48000);

  const location = locations[index % locations.length];

  const color = randomItem(colors);

  const price = randomPrice(info.basePrice);

  const engine = randomItem(
    engineOptions[type] || ["1998 cc"],
  );

  const power = randomNumber(110, 650);

  const mileage =
    fuel === "Electric"
      ? "Electric"
      : `${(8.5 + Math.random() * 14).toFixed(1)} km/l`;

  const status =
    Math.random() < 0.84
      ? "Available"
      : Math.random() < 0.65
        ? "Reserved"
        : "Sold";

  return {
    brand,
    model,
    variant,
    year,
    price,
    type,
    fuel,
    transmission,
    km,
    location,

    images: [
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=85",
    ],

    description: `${year} ${brand} ${model} ${variant} available in ${location} with premium specification and carefully presented condition.`,

    status,

    featured: index < 12 || Math.random() < 0.12,

    specs: {
      engine,
      power: `${power} bhp`,
      mileage,
      owners: Math.random() > 0.8 ? "2nd Owner" : "1st Owner",
      color,
      features: randomFeatures(),
    },
  };
}

async function seedCars() {
  try {
    await connectDB();

    const cars = [];

    const brandEntries = Object.entries(brands);

    for (let i = 0; i < 100; i++) {
      const [brand, info] =
        brandEntries[i % brandEntries.length];

      cars.push(createCar(brand, info, i));
    }

    const insertedCars = await Car.insertMany(cars);

    console.log(
      `Successfully added ${insertedCars.length} cars to Motora.`,
    );

    process.exit(0);
  } catch (error) {
    console.error("Car seeding failed:");
    console.error(error);

    process.exit(1);
  }
}

seedCars();
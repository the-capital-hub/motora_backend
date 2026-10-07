require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const Car = require('../src/models/Car');

const cars = [
  { brand:'BMW', model:'M4 Competition', year:2024, price:14800000, type:'Coupe', fuel:'Petrol', transmission:'Automatic', km:8200, location:'Delhi', featured:true, images:['https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=85'], description:'Demo listing data for the Motora Phase 1 interface.', specs:{ engine:'3.0L Twin-Turbo', power:'503 bhp', mileage:'10.4 km/l', owners:'1st Owner', color:'Black', features:['M Sport Package','Adaptive M Suspension','360° Camera','Wireless Apple CarPlay'] } },
  { brand:'Mercedes-Benz', model:'AMG GT 63 S', year:2024, price:28600000, type:'Coupe', fuel:'Petrol', transmission:'Automatic', km:5400, location:'Mumbai', featured:true, images:['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=85'], description:'Demo listing data for the Motora Phase 1 interface.', specs:{ engine:'4.0L V8 Biturbo', power:'831 bhp', mileage:'8.8 km/l', owners:'1st Owner', color:'Black', features:['AMG Performance Package','Burmester 3D Sound','360° Camera','Panoramic Sunroof'] } },
  { brand:'Porsche', model:'911 Carrera', year:2023, price:19500000, type:'Sports', fuel:'Petrol', transmission:'Automatic', km:11800, location:'Bangalore', featured:true, images:['https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=85'], description:'Demo listing data for the Motora Phase 1 interface.', specs:{ engine:'3.0L Twin-Turbo', power:'379 bhp', mileage:'9.6 km/l', owners:'1st Owner', color:'Red', features:['Sport Chrono Package','Porsche Active Suspension','Bose Surround Sound','Sport Exhaust'] } },
  { brand:'Land Rover', model:'Range Rover Sport', year:2024, price:21400000, type:'SUV', fuel:'Diesel', transmission:'Automatic', km:9600, location:'Delhi', featured:true, images:['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=85'], description:'Demo listing data for the Motora Phase 1 interface.', specs:{ engine:'3.0L Turbo Diesel', power:'346 bhp', mileage:'11.2 km/l', owners:'1st Owner', color:'Black', features:['Panoramic Sunroof','360° Camera','Meridian Audio','Adaptive Cruise Control'] } },
  { brand:'Audi', model:'RS Q8', year:2023, price:17800000, type:'SUV', fuel:'Petrol', transmission:'Automatic', km:14200, location:'Pune', images:['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=85'], description:'Demo listing data for the Motora Phase 1 interface.', specs:{ engine:'4.0L Twin-Turbo V8', power:'591 bhp', mileage:'8.5 km/l', owners:'1st Owner', color:'Grey', features:['RS Sport Package','Bang & Olufsen Audio','360° Camera','Panoramic Roof'] } },
  { brand:'BMW', model:'X5 xDrive40i', year:2024, price:12500000, type:'SUV', fuel:'Petrol', transmission:'Automatic', km:7100, location:'Gurgaon', featured:true, images:['https://images.unsplash.com/photo-1556189250-72ba954cfc2b?auto=format&fit=crop&w=1200&q=85'], description:'Demo listing data for the Motora Phase 1 interface.', specs:{ engine:'3.0L Turbo Petrol', power:'335 bhp', mileage:'11.0 km/l', owners:'1st Owner', color:'White', features:['Panoramic Sunroof','Harman Kardon Audio','360° Camera','Wireless CarPlay'] } },
  { brand:'Mercedes-Benz', model:'E-Class', year:2023, price:8200000, type:'Sedan', fuel:'Petrol', transmission:'Automatic', km:18400, location:'Mumbai', images:['https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=85'], description:'Demo listing data for the Motora Phase 1 interface.', specs:{ engine:'2.0L Turbo Petrol', power:'255 bhp', mileage:'14.2 km/l', owners:'1st Owner', color:'Silver', features:['Ambient Lighting','Burmester Audio','360° Camera','Panoramic Sunroof'] } },
  { brand:'Volvo', model:'XC90 Recharge', year:2024, price:10500000, type:'SUV', fuel:'Hybrid', transmission:'Automatic', km:6900, location:'Bangalore', featured:true, images:['https://images.unsplash.com/photo-1519245659620-e859806a8d3b?auto=format&fit=crop&w=1200&q=85'], description:'Demo listing data for the Motora Phase 1 interface.', specs:{ engine:'2.0L Turbo Hybrid', power:'455 bhp', mileage:'30.0 km/l equivalent', owners:'1st Owner', color:'Blue', features:['Pilot Assist','Bowers & Wilkins Audio','Panoramic Roof','360° Camera'] } }
];

(async () => {
  await connectDB();
  const email = process.env.ADMIN_EMAIL || 'admin@motora.com';
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  const hash = await bcrypt.hash(password, 12);
  await User.findOneAndUpdate({ email }, { name:'Motora Admin', email, password:hash, role:'admin' }, { upsert:true, new:true, setDefaultsOnInsert:true });
  await Car.deleteMany({});
  await Car.insertMany(cars);
  console.log(`Seeded admin ${email} and ${cars.length} cars`);
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });

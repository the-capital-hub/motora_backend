# Motora Backend — Final Admin API

Production-oriented REST API for the Motora car marketplace and admin panel.

## Modules
- JWT authentication with user/admin roles
- Car inventory CRUD, filters, pagination and metadata
- Admin dashboard statistics
- Customer management (list, view, update, delete)
- Test-drive booking management
- Sell-your-car request management
- Contact lead management
- Wishlist management
- Helmet, CORS, request logging and rate limiting
- Centralized 404/error handling

## Setup
```bash
npm install
copy .env.example .env
# edit .env and set MONGO_URI, JWT_SECRET and CLIENT_URL
npm run seed
npm run dev
```

API base URL: `http://localhost:5000/api`

Admin seed credentials are controlled by `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`. Change the default password before deployment.
"# motora_backend" 
"# motora_backend" 
"# motora_backend" 

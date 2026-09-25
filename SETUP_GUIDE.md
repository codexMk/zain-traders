# Setup Guide - Zain Traders ERP System

## Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose
- PostgreSQL Client (optional, for direct DB access)

## Initial Setup

### 1. Start PostgreSQL Database
```bash
# Start PostgreSQL with Docker Compose
docker-compose up -d

# Verify the database is running
docker ps
```

The database will be accessible at: `postgresql://postgres:postgres123@localhost:5432/zain_traders_erp`

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Prisma and Database Schema
```bash
# Generate Prisma client
npx prisma generate

# Push the schema to the database (this creates all tables)
npx prisma db push

# (Optional) Seed the database with sample data
npx prisma db seed
```

### 4. Generate NextAuth Secret
```bash
# Generate a secure secret for NextAuth
openssl rand -base64 32
```

Copy the output and update `.env.local`:
```env
NEXTAUTH_SECRET=<paste-your-generated-secret-here>
```

### 5. Start Development Server
```bash
npm run dev
```

The application will be available at: `http://localhost:3000`

## Initial Access

### Create Admin Account
1. Navigate to `http://localhost:3000/register`
2. Fill in your details (First user becomes OWNER)
3. Click "Create Account"
4. Login with your credentials at `http://localhost:3000/login`

### Database Access
If you want to view/manage the database directly:

**Using Prisma Studio:**
```bash
npx prisma studio
```

This opens a visual database manager at `http://localhost:5555`

**Using psql:**
```bash
psql postgresql://postgres:postgres123@localhost:5432/zain_traders_erp
```

## Project Structure

```
src/
├── app/
│   ├── api/                    # API Routes
│   │   ├── auth/              # Authentication endpoints
│   │   ├── products/          # Product management APIs
│   │   ├── suppliers/         # Supplier APIs
│   │   ├── customers/         # Customer APIs
│   │   └── invoices/          # Billing APIs
│   ├── dashboard/             # Dashboard layout and pages
│   │   ├── products/          # Product pages
│   │   ├── suppliers/         # Supplier pages
│   │   ├── customers/         # Customer pages
│   │   ├── billing/           # Billing pages
│   │   └── ...                # Other modules
│   ├── login/                 # Login page
│   ├── register/              # Registration page
│   └── layout.tsx             # Root layout
├── lib/
│   ├── auth.ts               # NextAuth configuration
│   ├── auth.config.ts        # Auth providers config
│   ├── auth-helpers.ts       # Auth utility functions
│   ├── prisma.ts             # Prisma client instance
│   └── utils.ts              # General utilities
├── components/
│   └── (UI components)
├── types/
│   ├── auth.ts               # Auth type definitions
│   └── site.ts               # Site types
└── styles/
    └── globals.css           # Global styles
```

## Database Schema Overview

### Core Tables
- **User**: System users (Owner, Staff, Accountant)
- **Product**: Spice products with pricing and stock
- **Supplier**: Supplier information and ratings
- **Customer**: Customer details and credit limits
- **Purchase**: Purchase orders from suppliers
- **Invoice**: Sales invoices with GST support
- **StockMovement**: Inventory tracking
- **Ledger**: Financial accounting records
- **RateHistory**: Market rate tracking
- **Expense**: Expense tracking

## Features Implemented

### Phase 1 - Foundation ✅
- [x] Database schema with all 10 modules
- [x] NextAuth authentication (Email/Password)
- [x] Role-based access control (Owner, Staff, Accountant)
- [x] Dashboard with stats and charts
- [x] Products listing page
- [x] Suppliers listing page
- [x] API routes for core operations

### Phase 2 - Core Modules (In Progress)
- [ ] Complete Product Management
- [ ] Complete Supplier Management
- [ ] Complete Customer Management
- [ ] Complete Purchase Management
- [ ] Complete Billing/Invoice System

### Phase 3 - Advanced Features (Coming)
- [ ] Inventory Management
- [ ] Accounting & Financial Reports
- [ ] Rate History Tracking
- [ ] Complete Reports Module
- [ ] PDF Invoice Generation
- [ ] WhatsApp Invoice Integration

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/[...nextauth]` - NextAuth handlers

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product
- `GET /api/products/[id]` - Get single product
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

### Suppliers
- `GET /api/suppliers` - Get all suppliers
- `POST /api/suppliers` - Create supplier
- `GET /api/suppliers/[id]` - Get single supplier
- `PUT /api/suppliers/[id]` - Update supplier
- `DELETE /api/suppliers/[id]` - Delete supplier

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create customer
- `GET /api/customers/[id]` - Get customer details
- `PUT /api/customers/[id]` - Update customer
- `DELETE /api/customers/[id]` - Delete customer

### Invoices
- `GET /api/invoices` - Get all invoices
- `POST /api/invoices` - Create invoice

## Troubleshooting

### Database Connection Error
```
Error: Can't reach database server at `localhost:5432`
```
**Solution**: Ensure Docker containers are running:
```bash
docker-compose ps
docker-compose up -d
```

### Prisma Migration Issues
```bash
# Resolve migration conflicts
npx prisma migrate resolve --rolled-back <migration_name>

# Or recreate the database
npx prisma db push --force-reset
```

### NextAuth Session Issues
- Ensure `NEXTAUTH_SECRET` is set in `.env.local`
- Verify `NEXTAUTH_URL` matches your domain
- Clear browser cookies and try again

## Development Tips

### Generate Sample Data
Create a `prisma/seed.ts` file to seed sample data:
```bash
npx prisma db seed
```

### API Testing
Use the API routes with tools like:
- Postman
- VS Code REST Client
- curl

### View Database
```bash
# Open Prisma Studio
npx prisma studio

# View logs
npx prisma db execute --stdin < query.sql
```

## Production Deployment

### Azure Deployment
For Vercel deployment, update your environment variables:
```env
DATABASE_URL=postgresql://user:password@prod-db-host:5432/db_name
NEXTAUTH_URL=https://yourdomain.com
```

### Build for Production
```bash
npm run build
npm start
```

## Support & Documentation

- **Next.js**: https://nextjs.org/docs
- **Prisma**: https://www.prisma.io/docs/
- **NextAuth**: https://next-auth.js.org/
- **Tailwind CSS**: https://tailwindcss.com/docs

---

**Zain Traders ERP - Built with ❤️**

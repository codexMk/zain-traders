# ज़ैन ट्रेडर्स - ERP Management System

## Overview

A comprehensive Enterprise Resource Planning (ERP) system designed for wholesale spice businesses. Built with modern web technologies, this system helps manage every aspect of your spice trading business from procurement to delivery and accounting.

**Location**: Kurduwadi Road, Paranda
**Contact**: 9307427731 | 8856915606

## Key Features

### 📊 Dashboard
- Real-time sales metrics and analytics
- Monthly revenue tracking
- Customer and supplier overview
- Low stock alerts
- Pending payments tracking
- Interactive charts and graphs

### 🛍️ Product Management
- Complete product catalog with Marathi names
- Stock level tracking and alerts
- 8 product categories (Whole Spices, Powder Spices, Dry Fruits, etc.)
- Purchase and selling rates
- GST management
- Stock history and movements

### 👥 Supplier Management
- Supplier database and ratings
- Contact management with WhatsApp integration
- Purchase history tracking
- City-based organization
- Multi-category supplier support

### 🚚 Purchase Management
- Purchase order creation
- Auto stock updates
- Transport and loading cost tracking
- GST calculation
- Invoice number management
- Purchase reports

### 👤 Customer Management
- Customer ledger system
- Credit limit tracking
- Outstanding amount monitoring
- Payment history
- Multiple contact support

### 💳 Billing System
- GST and Non-GST invoice support
- Multi-product invoice creation
- Dynamic discount management
- PDF invoice generation
- Print-ready invoices
- WhatsApp sharing capability

### 📦 Inventory Management
- Real-time stock tracking
- Stock In/Out operations
- Damaged stock recording
- Unit conversion (KG, Gram, Bag, Piece)
- Low stock alerts
- Stock movement history

### 💰 Accounting
- Cash and credit sales tracking
- Expense management
- Purchase cost analysis
- Profit tracking
- Daily, weekly, monthly, yearly reports

### 📈 Rate History
- Market rate tracking across 4 locations:
  - Mumbai
  - Pune
  - Solapur
  - Dharashiv
- Price trend analysis
- Rate comparison graphs
- Historical data tracking

### 📑 Reports
- Sales reports (daily, weekly, monthly, yearly)
- Purchase analysis
- Customer reports
- Supplier reports
- Inventory reports
- Profit & loss statements
- Export to PDF and Excel

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, ShadCN UI
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with role-based access
- **Charts**: Recharts
- **Documentation**: PDF generation with jsPDF
- **Deployment**: Vercel-ready with Docker support

## User Roles

1. **Owner** - Full system access, user management, settings
2. **Staff** - Operations and sales management
3. **Accountant** - Financial tracking and reports

## Getting Started

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- PostgreSQL 16+

### Quick Setup

1. **Clone and Install**
   ```bash
   npm install
   ```

2. **Start Database**
   ```bash
   docker-compose up -d
   ```

3. **Setup Database**
   ```bash
   npx prisma db push
   ```

4. **Generate Auth Secret**
   ```bash
   openssl rand -base64 32
   # Add to .env.local as NEXTAUTH_SECRET
   ```

5. **Run Development Server**
   ```bash
   npm run dev
   ```

6. **Access Application**
   - Navigate to `http://localhost:3000`
   - Register as Owner
   - Login and start using the system

📖 **[Complete Setup Guide](./SETUP_GUIDE.md)**

## Color Scheme

- **Primary**: Emerald Green (#059669)
- **Accent**: Gold (#F59E0B)
- **Background**: Cream (#FEF3C7)

The theme creates a premium, professional appearance suitable for a modern wholesale business.

## Project Phases

### Phase 1: Foundation ✅
- Database design and Prisma schema
- Authentication and authorization
- Dashboard with analytics
- Core API routes
- Basic UI structure

### Phase 2: Core Modules 🔄
- Product Management
- Supplier Management
- Customer Management
- Purchase Orders
- Billing System

### Phase 3: Advanced Features
- Inventory Management
- Accounting and Reports
- Rate History Tracking
- PDF Invoice Generation
- WhatsApp Integration

## Project Structure

```
src/
├── app/
│   ├── api/              # RESTful API routes
│   ├── dashboard/        # Main application layout
│   ├── login/            # Authentication pages
│   └── register/
├── lib/
│   ├── auth.ts          # Authentication logic
│   ├── prisma.ts        # Database client
│   └── utils.ts         # Helper functions
├── components/          # Reusable React components
├── types/              # TypeScript type definitions
└── styles/            # Global styles
```

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://postgres:postgres123@localhost:5434/zain_traders_erp"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# API
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
```

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## Database Schema

The system uses Prisma ORM with models for:
- Users (with roles)
- Products (with stock tracking)
- Suppliers and Customers
- Purchase Orders and Invoices
- Stock Movements and Ledger
- Rate History and Expenses

## API Documentation

API endpoints are organized by module:
- `/api/products` - Product management
- `/api/suppliers` - Supplier operations
- `/api/customers` - Customer management
- `/api/invoices` - Billing system
- `/api/auth` - Authentication

All endpoints require authentication and check role-based permissions.

## Security Features

- Password hashing with bcryptjs
- Session-based authentication
- Role-based access control (RBAC)
- Protected API routes
- CSRF protection via NextAuth
- SQL injection prevention with Prisma

## Performance

- Server-side rendering with Next.js
- Database query optimization
- Caching strategies
- Image optimization
- Code splitting

## Deployment

### Vercel (Recommended)
```bash
# Push to GitHub
git push origin main

# Deploy via Vercel dashboard
```

### Docker
```bash
docker build -t zain-traders-erp .
docker run -p 3000:3000 zain-traders-erp
```

## Support & Documentation

- 📖 [Setup Guide](./SETUP_GUIDE.md)
- 🔗 [API Documentation](./docs/API.md)
- 🎨 [Design System](./docs/DESIGN.md)
- 🐛 [Troubleshooting](./SETUP_GUIDE.md#troubleshooting)

## License

This project is proprietary software for Zain Traders.

---

**Built with ❤️ for Zain Traders Wholesale Spices**

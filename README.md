# IJAISM Academic Publishing Platform - MVP

A modern academic publishing platform built with Next.js, featuring journal management, article publishing, and peer review workflows.

## Features

✅ **Completed (MVP)**
- Homepage with announcements and journal carousel
- Journal listing and detail pages (12 journals)
- Article browsing with filters and search
- Article detail pages with metrics
- Responsive design with Tailwind CSS
- PostgreSQL database schema
- Prisma ORM integration

🚧 **In Progress**
- User authentication (register/login)
- Article submission form
- User dashboard

📋 **Planned**
- Peer review system
- Conference management
- Dissertation/thesis repository
- Payment integration (Stripe)
- Email notifications
- Admin panel

## Tech Stack

- **Frontend:** Next.js 16.1.3, React 19, TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js + JWT
- **PWA:** Service Worker, Manifest, Offline Support
- **Deployment:** Vercel-ready with production config

## Prerequisites

- Node.js 18+ (currently running on v20.10.0)
- PostgreSQL 14+
- npm or yarn

## Getting Started

### 1. Clone and Install

```bash
cd c5k-platform
npm install
```

### 2. Database Setup

Create a PostgreSQL database:

```bash
createdb ijaism_db
```

Or using psql:

```sql
CREATE DATABASE ijaism_db;
```

### 3. Environment Variables

Create a `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
```

Update the `.env` file with your configuration:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/ijaism_db"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="1h"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="IJAISM"
NODE_ENV="development"
```

**Important:** Update the `DATABASE_URL` with your actual PostgreSQL credentials.

### 4. Initialize Database

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view/edit data
npx prisma studio
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
c5k-platform/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   ├── articles/             # Article pages
│   ├── journals/             # Journal pages
│   ├── dashboard/            # User dashboard (planned)
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Homepage
│   └── globals.css           # Global styles
├── components/               # React components
│   ├── layout/               # Header, Footer
│   ├── ui/                   # UI components (Card, etc.)
│   └── ...                   # Feature components
├── lib/                      # Utilities
│   └── prisma.ts             # Prisma client
├── prisma/                   # Database
│   └── schema.prisma         # Database schema
├── public/                   # Static files
└── ...                       # Config files
```

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 🚀 Production Deployment

Ready to deploy to production? See the comprehensive deployment guide:

📖 **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete Vercel deployment guide

**Quick Deploy**:
1. Push code to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

For detailed instructions including database setup, environment configuration, and custom domain setup, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Database Commands

```bash
npx prisma studio              # Open database GUI
npx prisma generate            # Generate Prisma Client
npx prisma migrate dev         # Create and apply migration
npx prisma migrate reset       # Reset database (careful!)
npx prisma db push             # Push schema changes (dev only)
```

## Key Features Implemented

### Homepage
- Hero banner with CTAs
- Latest announcements carousel
- Academic journals showcase (12 journals)
- Latest articles grid
- Newsletter subscription
- Statistics section

### Journal Pages
- Journal listing with all 12 journals
- Individual journal detail pages
- Current issue display
- Journal information (ISSN, impact factor, etc.)
- Editor information

### Article Pages
- Article browsing with filters
- Detailed article view
- Author information with ORCID
- Abstract and full text
- Keywords and metadata
- Article metrics (views, downloads, citations)
- Citation export (planned)
- Download PDF (planned)
- Related articles

### Responsive Design
- Mobile-first approach
- Responsive navigation with hamburger menu
- Grid layouts that adapt to screen size
- Touch-friendly interfaces

## The 12 Journals

1. **JITMB** - Information Technology and Management in Business
2. **JSAE** - Social and Anthropological Explorations
3. **AMLID** - Accounting, Management, and Leadership in Development
4. **OJBEM** - Business Economics and Management
5. **PRAIHI** - Research and Innovation in Health Informatics
6. **JBVADA** - Business Valuation and Data Analytics
7. **JAMSAI** - Applied Mathematics, Statistics, and AI
8. **AESI** - Environmental Studies and Innovation
9. **ILPROM** - International Leadership and Professional Management
10. **TBFLI** - Business and Financial Leadership Insights
11. **PMSRI** - Public Management and Social Research Insights
12. **DRSDR** - Demographic Research and Social Development Reviews

## Next Steps

1. **Complete Authentication System**
   - Register/login API routes
   - JWT token management
   - Protected routes
   - User sessions

2. **Article Submission**
   - Multi-step form
   - File upload
   - Validation
   - Save drafts

3. **User Dashboard**
   - My submissions
   - Profile management
   - Notifications

4. **Database Seeding**
   - Sample journals
   - Sample articles
   - Test users

## Contributing

This is an MVP project. Feel free to extend it with additional features!

## License

MIT

## Related Documentation

### Configuration & Deployment
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Vercel deployment guide
- **[REBRANDING-COMPLETE.md](./REBRANDING-COMPLETE.md)** - Rebranding summary (C5K → IJAISM)
- **[.env.example](./.env.example)** - Environment variables template

### PWA Documentation
- **[PWA-GUIDE.md](./PWA-GUIDE.md)** - Progressive Web App setup
- **[RESPONSIVE-PWA-UPDATE.md](./RESPONSIVE-PWA-UPDATE.md)** - Responsive PWA updates

### Setup Guides
- **[SETUP-GUIDE.md](./SETUP-GUIDE.md)** - Initial setup instructions
- **[QUICK_START.md](./QUICK_START.md)** - Quick start guide

### Project Specifications
See the `c5k-clone-project` folder for complete specifications:
- Project overview
- Feature specifications
- Technical architecture
- UI/UX specifications
- Complete database schema
- API endpoints
- Implementation guide

## Support

For issues or questions, refer to the comprehensive documentation above or check the specifications folder.

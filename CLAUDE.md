# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a Next.js 15 business management system called KingaSystem that tracks sales, expenses, and business metrics for multiple business units. The application features role-based access control and unit-based permissions.

## Common Commands
- `npm run dev` - Run development server with Turbopack
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Database Management
- Uses Prisma ORM with MySQL database
- Run `npx prisma migrate dev` to apply database migrations
- Run `npx prisma generate` to regenerate Prisma client after schema changes
- Run `npx prisma studio` to open database browser

## Architecture

### Authentication & Authorization
- Cookie-based session management (not JWT)
- Middleware (`src/middleware.ts`) handles authentication and page-level permissions
- Session data includes user info and page access permissions
- Users have access to specific units and pages through the `UnitAccess` and `PageAccess` models

### Database Schema
The application uses a comprehensive database schema with these key entities:
- **User**: System users with authentication and permissions
- **Unit**: Business units/locations that users can access
- **Product**: Products sold by units
- **Sale**: Sales transactions with confirmation workflow
- **Expense**: Business expenses categorized as Direct (D), Indirect (I), Other (O), or Tax (T)
- **PaymentType**: Payment methods (cash, card, etc.)
- **BusinessPlan**: Monthly revenue targets and projections
- **UnitAccess**: Links users to units they can access
- **PageAccess**: Defines which pages/features each user can access

### Application Structure
- **Next.js App Router**: Uses the new app directory structure
- **Route Protection**: Middleware redirects unauthenticated users to `/login`
- **API Routes**: Located in `src/app/api/` for authentication and data operations
- **Database**: Prisma client configured in `src/lib/prisma.ts`
- **Root Page**: Automatically redirects to `/menu` (handled by middleware for auth)

### Page Access System
Pages are controlled through the `PageAccess` model with these permissions:
- `pgSales`: Sales entry page
- `pgSalesConfirm`: Sales confirmation page
- `pgSalesOverview`: Sales overview/reports
- `pgExpenses`: Expense entry page
- `pgExpensesView`: Expense viewing page
- `pgResult`: Financial results page
- `pgBusiness`: Business planning page
- `pgAccounts`: Account management page

### Security Notes
- Currently uses plain text password comparison (marked for production improvement)
- Session data stored in HTTP-only cookies
- All database operations use Prisma for SQL injection protection
- Middleware validates permissions before page access
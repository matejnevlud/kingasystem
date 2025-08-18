# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a Next.js 15 business management system called KingaSystem that tracks sales, expenses, and business metrics for multiple business units. The application features role-based access control and unit-based permissions.

## Common Commands
- `npm run dev` - Run development server with Turbopack
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run postinstall` - Apply Flowbite React patches (runs automatically after install)

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
- `pgAdmin`: System administration (user management)

### UI and Styling
- **Tailwind CSS 4**: Modern utility-first CSS framework for styling
- **Flowbite React**: Component library for UI elements (requires post-install patch)
- **TypeScript**: Full type safety across the application
- **Responsive Design**: Mobile-first approach with responsive layouts

### Key Development Patterns
- **Server Components**: Uses Next.js 15 server components by default
- **Client Components**: Marked with 'use client' directive when needed for interactivity
- **Session Management**: Cookie-based sessions accessed via `/api/auth/session`
- **File Uploads**: Custom ImageUpload component for expense receipt handling
- **Permission Checks**: Pages check user permissions on both client and server side

### Progressive Web App (PWA) Features
- **Web App Manifest**: `/public/manifest.json` defines app metadata, icons, and behavior
- **Service Worker**: `/public/sw.js` provides basic caching and offline functionality
- **App Icons**: Multiple sizes (72x72 to 512x512) in `/public/icons/` for different devices
- **Install Prompt**: Optional `PWAInstallPrompt` component can be added to pages
- **Mobile Installation**: App can be "Add to Home Screen" on mobile devices
- **Fullscreen Mode**: Runs in true fullscreen mode with hidden status bar when installed
- **Safe Area Support**: Handles device notches and safe areas automatically
- **iOS Status Bar**: Forced hidden status bar on iOS Safari with black-translucent style

### PWA Detection & Browser-Specific Features
- **usePWADetection Hook**: Detects if running as PWA vs browser, device type, and browser
- **PWAWrapper Component**: Applies browser-specific classes and behavior automatically
- **Safari Install Modal**: Large modal with step-by-step instructions for Safari users
- **Browser-Specific Styling**: Different CSS classes for Safari, Chrome, iOS, Android, etc.
- **Conditional Components**: Components adapt based on PWA/browser mode detection

### Security Notes
- Currently uses plain text password comparison (marked for production improvement)
- Session data stored in HTTP-only cookies
- All database operations use Prisma for SQL injection protection
- Middleware validates permissions before page access
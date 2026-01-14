# Gym Ease - Next.js with SQLite

A comprehensive gym management system built with Next.js and SQLite.

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Run development server
npm run dev
```

Visit `http://localhost:3000` to use the application.

## Features

- **User Authentication** - Email/password based auth with JWT tokens
- **Role-Based Access** - Owner and Trainer roles with different permissions
- **Member Management** - Add, manage, and track gym members
- **Fee Plans** - Create and manage membership plans
- **Dashboard** - Real-time analytics and insights for owners
- **Subscription Tracking** - Monitor active and expiring memberships
- **Payment Records** - Track member payments and history
- **Audit Logging** - Keep records of all system actions

## Database Schema

The application uses SQLite with the following tables:
- users - User accounts
- user_profiles - User role and profile information
- members - Gym member details
- fee_plans - Membership plan configurations
- subscriptions - Member subscriptions to plans
- payments - Payment records
- expenses - Gym expenses
- utilities - Utility bills tracking
- staff - Staff member information
- leads - Lead management
- audit_log - Activity audit trail

## API Routes

- `/api/auth/sign-in` - User authentication
- `/api/auth/sign-out` - Logout
- `/api/users/current-user` - Get current user profile
- `/api/members` - Manage members
- `/api/fee-plans` - Manage fee plans
- `/api/dashboard/owner` - Owner dashboard data

## Building

```bash
npm run build
npm start
```

## License

MIT

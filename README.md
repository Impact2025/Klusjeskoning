# 🚀 KlusjesKoning - Professional Family Chore Management

A production-ready SaaS application for gamified family chore management, built with modern web technologies and deployed on Vercel.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### Core Functionality
- 👨‍👩‍👧‍👦 **Family Management**: Create and manage family accounts with multiple children
- 📋 **Chore Management**: Create, assign, and track household chores
- 🎯 **Gamification**: Points, XP, badges, and rewards system
- 👶 **Child Dashboard**: Age-appropriate interface for children
- 👨‍👩‍👧 **Parent Dashboard**: Comprehensive family management tools

### Advanced Features
- 🔄 **Recurring Chores**: Automated chore scheduling and templates
- 👥 **Team Chores**: Collaborative tasks for multiple family members
- 🎨 **Avatar System**: Customizable child avatars with unlockable items
- 📊 **Analytics**: Family progress tracking and insights
- 🔔 **Notifications**: Email and in-app notifications
- 💳 **Premium Features**: Subscription management with Stripe

### Technical Features
- 🔒 **Security**: TypeScript, input validation, rate limiting
- 📱 **PWA**: Installable web app with offline capabilities
- 🎨 **Responsive**: Mobile-first design with Tailwind CSS
- 🚀 **Performance**: Optimized for Core Web Vitals
- 🧪 **Testing**: Comprehensive test suite with Jest
- 📊 **Monitoring**: Error tracking and analytics

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + Radix UI
- **State Management**: React Context + Zustand
- **Forms**: React Hook Form + Zod validation

### Backend
- **Runtime**: Node.js (Edge Runtime)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Custom JWT + session management
- **API**: RESTful with tRPC considerations
- **Email**: SendGrid
- **Payments**: Stripe

### Infrastructure
- **Hosting**: Vercel
- **Database**: Railway PostgreSQL
- **CDN**: Vercel Edge Network
- **Monitoring**: Sentry
- **Analytics**: PostHog

### Development Tools
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint + Prettier
- **CI/CD**: GitHub Actions
- **Code Quality**: Husky pre-commit hooks

## 📋 Prerequisites

- Node.js 20+
- PostgreSQL database
- Git
- Vercel account (for deployment)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/klusjeskoning.git
   cd klusjeskoning
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Set up the database**
   ```bash
   # Run database migrations
   npm run db:migrate
   # Seed with initial data (optional)
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to see the application.

## 💻 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server on port 3000
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run typecheck        # Run TypeScript type checking

# Testing
npm run test             # Run tests once
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
npm run test:ci          # Run tests for CI (no watch)

# Database
npm run db:generate      # Generate Drizzle types
npm run db:migrate       # Run database migrations
npm run db:push          # Push schema changes to database
npm run db:studio        # Open Drizzle Studio

# Code Quality
npm run prepare          # Set up Husky git hooks
```

### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow TypeScript strict mode
   - Write tests for new functionality
   - Ensure code passes linting

3. **Run quality checks**
   ```bash
   npm run typecheck
   npm run lint
   npm run test
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## 🧪 Testing

### Test Structure
```
src/
├── __tests__/           # Unit and integration tests
├── components/
│   └── __tests__/       # Component tests
└── lib/
    └── __tests__/       # Utility tests
```

### Running Tests
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- src/components/Button.test.tsx
```

### Writing Tests
```typescript
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Hello World</Button>);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
});
```

## 🚀 Deployment

### Vercel Deployment

1. **Connect your repository**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure build settings

2. **Environment Variables**
   Set the following environment variables in Vercel:
   ```
   DATABASE_URL=your_postgresql_connection_string
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=https://your-domain.vercel.app
   ADMIN_EMAIL=your_admin_email
   ADMIN_PASSWORD=your_secure_admin_password
   SENDGRID_API_KEY=your_sendgrid_api_key
   SENDGRID_FROM_EMAIL=your_verified_sender_email
   ```

3. **Database Setup**
   - Use Railway or another PostgreSQL provider
   - Run migrations: `npm run db:migrate`
   - Ensure connection string is correct

4. **Deploy**
   ```bash
   git push origin main
   ```
   Vercel will automatically build and deploy your application.

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificate active
- [ ] Domain configured
- [ ] Monitoring tools set up
- [ ] Backup strategy in place
- [ ] Security headers enabled

## 🔧 Environment Variables

### Required Variables
```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Authentication
NEXTAUTH_SECRET=your-32-character-secret-key
NEXTAUTH_URL=https://your-domain.com

# Admin Configuration
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=secure-admin-password

# Email Service
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

### Optional Variables
```env
# Monitoring
SENTRY_DSN=your-sentry-dsn

# Analytics
GOOGLE_ANALYTICS_ID=GA-XXXXXXXXXX

# Payments
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# File Storage
VERCEL_BLOB_READ_WRITE_TOKEN=vercel_blob_token
```

## 🗄️ Database

### Schema Overview
- **families**: Family accounts and subscription data
- **children**: Child profiles with points and XP
- **chores**: Household tasks with assignments
- **rewards**: Available rewards and redemptions
- **points_transactions**: Transaction history
- **sessions**: User authentication sessions

### Migrations
```bash
# Generate migration from schema changes
npm run db:generate

# Apply migrations to database
npm run db:migrate

# View database in browser
npm run db:studio
```

## 📚 API Documentation

### REST API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

#### Family Management
- `GET /api/app` - Get family data
- `POST /api/app` - Family actions (CRUD operations)

#### Admin Endpoints
- `GET /api/admin/families` - List all families
- `POST /api/admin/families` - Create family
- `PUT /api/admin/families/:id` - Update family
- `DELETE /api/admin/families/:id` - Delete family

### API Response Format
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

## 🤝 Contributing

### Code Standards
- **TypeScript**: Strict mode enabled
- **Linting**: ESLint with custom rules
- **Formatting**: Prettier with consistent config
- **Testing**: Minimum 80% code coverage
- **Commits**: Conventional commit format

### Pull Request Process
1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Ensure all checks pass
5. Submit a pull request
6. Wait for review and approval

### Commit Convention
```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Database ORM: [Drizzle](https://orm.drizzle.team/)
- Hosted on [Vercel](https://vercel.com/)

---

**KlusjesKoning** - Making family chores fun and rewarding! 🎉
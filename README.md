# DWG Capital Partners Investment Platform

A comprehensive equity investment platform built with React, TypeScript, and modern web technologies. This platform provides sophisticated investment management capabilities for capital partners and their investors.

## 🚀 Features

### Authentication & Security
- **Multi-step Authentication**: Login, registration, and password recovery flows
- **Role-based Access Control**: Investor and advisor permissions
- **2FA Support**: Two-factor authentication setup
- **Secure Session Management**: JWT-based authentication with refresh tokens

### Investment Management
- **Investment Opportunities**: Browse and filter active and past investment offerings
- **Portfolio Tracking**: Comprehensive view of active investments and returns
- **Multi-step Investment Process**: Diligence → Invest → eSign → Fund workflow
- **Real-time Updates**: Live investment metrics and portfolio performance

### Profile & Account Management
- **Multiple Investment Profiles**: Individual, Entity, Trust, IRA, Joint registrations
- **Accreditation Management**: Document upload and verification tracking
- **Bank Account Integration**: Secure ACH account linking and verification
- **Distribution Preferences**: Customizable payout settings per profile

### Platform Features
- **Interactive Onboarding Tour**: Guided platform introduction with configurable steps
- **Updates Feed**: Filterable news, reports, and announcements
- **Transaction History**: Detailed transaction tracking with export capabilities
- **Document Management**: Secure document storage and sharing
- **CMS Integration**: Headless content management for dynamic content

## 🛠 Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Shadcn/ui with custom financial components
- **Routing**: React Router v6
- **State Management**: React Context + React Query
- **Authentication**: JWT with refresh token rotation
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Build Tool**: Vite with Hot Module Replacement

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Modern web browser with ES2020+ support

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dwg-capital-partners
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env.local` file in the root directory:
   ```env
   # API Configuration
   VITE_API_BASE_URL=http://localhost:3001/api
   VITE_APP_ENV=development
   
   # Authentication
   VITE_JWT_SECRET=your-jwt-secret-key
   VITE_REFRESH_TOKEN_EXPIRY=7d
   
   # External Services
   VITE_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
   VITE_STRIPE_PUBLIC_KEY=your-stripe-public-key
   
   # eSign Integration
   VITE_DOCUSIGN_INTEGRATION_KEY=your-docusign-key
   VITE_DOCUSIGN_ACCOUNT_ID=your-docusign-account
   
   # File Storage
   VITE_AWS_S3_BUCKET=your-s3-bucket
   VITE_AWS_REGION=us-east-1
   
   # Analytics
   VITE_GOOGLE_ANALYTICS_ID=your-ga-id
   VITE_MIXPANEL_TOKEN=your-mixpanel-token
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   Open [http://localhost:8080](http://localhost:8080) in your browser

## 🏗 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── layout/         # Layout and navigation
│   ├── ui/             # Base UI components (shadcn/ui)
│   └── investment/     # Investment-specific components
├── contexts/           # React Context providers
├── hooks/              # Custom React hooks  
├── pages/              # Page components
├── services/           # API service modules
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── lib/                # Third-party library configurations
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically

### Code Style & Standards

- **TypeScript**: Strict mode enabled with comprehensive type definitions
- **ESLint**: Configured with React and TypeScript best practices
- **Prettier**: Code formatting with consistent style rules
- **Husky**: Pre-commit hooks for code quality
- **Conventional Commits**: Structured commit message format

## 📋 API Integration

### Backend Requirements

The platform expects a REST API with the following endpoints:

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration  
- `POST /api/auth/reset-password` - Password reset
- `GET /api/auth/validate` - Token validation
- `POST /api/auth/refresh` - Token refresh

#### Investment Management
- `GET /api/offerings` - List investment offerings
- `GET /api/offerings/:id` - Get offering details
- `POST /api/investments/:offeringId/reserve` - Create investment reservation
- `GET /api/investments` - List user investments
- `GET /api/investments/statement` - Download account statement

#### Profile Management
- `GET /api/profiles` - List user profiles
- `POST /api/profiles` - Create new profile
- `PUT /api/profiles/:id` - Update profile
- `POST /api/profiles/:id/accreditation` - Upload accreditation documents
- `POST /api/profiles/:id/bank-accounts` - Add bank account

#### Platform Features
- `GET /api/updates` - Get platform updates
- `GET /api/transactions` - Get transaction history
- `GET /api/cms/content` - Get CMS content
- `POST /api/support/tickets` - Create support ticket

### Mock API Development

For development without a backend, the platform includes mock API responses. Enable mock mode by setting `VITE_USE_MOCK_API=true` in your environment file.

## 🚀 Deployment

### Production Build

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy static files**
   Upload the `dist/` directory to your web server or CDN.

### Environment-Specific Configuration

Create environment-specific files:
- `.env.development` - Development settings
- `.env.staging` - Staging environment
- `.env.production` - Production configuration

### Recommended Hosting Platforms

- **Vercel**: Zero-config deployment with automatic HTTPS
- **Netlify**: JAMstack platform with form handling
- **AWS S3 + CloudFront**: Scalable static hosting
- **Docker**: Containerized deployment for any platform

## 🔒 Security Considerations

### Data Protection
- All sensitive data transmitted over HTTPS/TLS
- Client-side encryption for PII before transmission
- Secure token storage with httpOnly cookies option
- Input validation and sanitization on all forms

### Authentication Security
- Password strength requirements enforced
- Rate limiting on authentication endpoints
- JWT tokens with short expiration times
- Refresh token rotation for enhanced security

### File Upload Security
- File type validation and virus scanning
- Signed URLs for secure document access
- Access logging for audit trails

## 📊 Analytics & Monitoring

### Implemented Analytics Events
- User authentication (login, registration, logout)
- Investment actions (view, reserve, complete)
- Profile management activities
- Document downloads and views
- Error tracking and performance monitoring

### Integration Points
- Google Analytics 4 for user behavior
- Mixpanel for detailed event tracking
- Sentry for error monitoring and performance
- Custom dashboard for business metrics

## 🧪 Testing

### Test Coverage
- Unit tests for utility functions and hooks
- Component tests for UI components
- Integration tests for API interactions
- E2E tests for critical user flows

### Testing Commands
```bash
npm run test          # Run unit tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
npm run test:e2e      # Run end-to-end tests
```

## 📝 Contributing

### Development Workflow
1. Create feature branch from `main`
2. Implement changes with tests
3. Run linting and type checking
4. Submit pull request with detailed description
5. Code review and approval process
6. Automated deployment to staging
7. QA testing and production deployment

### Code Review Guidelines
- Ensure TypeScript strict mode compliance
- Verify accessibility standards (WCAG 2.1 AA)
- Test responsive design on multiple devices
- Validate form handling and error states
- Review security implications of changes

## 🆘 Support & Documentation

### Additional Resources
- [API Documentation](./docs/api.md) - Complete API reference
- [Component Library](./docs/components.md) - UI component documentation
- [Deployment Guide](./docs/deployment.md) - Detailed deployment instructions
- [Security Policies](./docs/security.md) - Security best practices

### Support Channels
- Technical Issues: Create GitHub issue with reproduction steps
- Feature Requests: Use GitHub discussions
- Security Concerns: Email security team directly

---

**Built with ❤️ by the DWG Capital Partners Engineering Team**
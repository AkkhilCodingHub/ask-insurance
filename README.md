# ASK Insurance Broker

A comprehensive insurance platform that simplifies buying and managing insurance policies in India. Compare 38+ IRDAI-regulated insurers, get instant quotes, and buy policies online.

## 🚀 Features

- **Multi-platform**: Web app (Next.js), Mobile app (React Native/Expo), and Admin dashboard
- **Insurance Comparison**: Compare plans across life, health, motor, travel, and business insurance
- **Instant Quotes**: Get personalized quotes in seconds
- **Secure Payments**: Integrated payment gateway for seamless transactions
- **Claims Management**: Easy claims filing and tracking
- **User Dashboard**: Manage policies, view claims, and track renewals
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Real-time Notifications**: SMS and email alerts for policy updates

## 🛠 Tech Stack

### Web Application
- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS with custom design tokens
- **Language**: TypeScript
- **Deployment**: Vercel

### Mobile Application
- **Framework**: React Native with Expo
- **Navigation**: Expo Router
- **Styling**: NativeWind (Tailwind for React Native)

### Shared Libraries
- **TypeScript**: Shared types and utilities
- **Authentication**: Custom auth context
- **API**: RESTful API integration

### Admin Dashboard
- **Framework**: Next.js
- **Database**: Prisma with PostgreSQL
- **Authentication**: Admin-specific auth

## 📁 Project Structure

```
insurance/
├── web/                    # Next.js web application
│   ├── app/               # App Router pages
│   ├── components/        # Reusable UI components
│   ├── context/           # React contexts (auth, etc.)
│   ├── lib/               # Utilities and helpers
│   └── public/            # Static assets
├── mobile/                # React Native mobile app
│   ├── src/
│   │   ├── app/          # Expo Router screens
│   │   ├── components/   # Mobile components
│   │   └── context/      # Mobile contexts
│   └── assets/           # Mobile assets
├── shared/                # Shared TypeScript libraries
│   └── src/
│       ├── constants/    # App constants
│       ├── tokens/       # Design tokens
│       └── types/        # TypeScript types
├── admin/                 # Admin dashboard (Next.js)
└── package.json          # Root package.json with workspaces
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- For mobile: Expo CLI (`npm install -g @expo/cli`)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd insurance
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env.local` in each workspace
   - Fill in required API keys and configuration

### Development

#### Web Application
```bash
npm run dev:web
```
Opens at `http://localhost:3000`

#### Mobile Application
```bash
npm run dev:mobile
```
Use Expo Go app to scan QR code

#### Admin Dashboard
```bash
npm run dev:admin
```
Opens at `http://localhost:3001`

#### All Applications
```bash
npm run dev:all
```

### Building for Production

#### Web
```bash
npm run build:web
```

#### Mobile
```bash
cd mobile
npx expo build:android  # or :ios
```

## 📱 Mobile App

The mobile app provides the same functionality as the web app with native performance:

- **Authentication**: Phone number OTP verification
- **Policy Management**: View and manage all policies
- **Claims**: File and track claims
- **Quotes**: Get instant quotes on mobile
- **Offline Support**: Basic functionality works offline

## 🔧 Configuration

### Environment Variables

Create `.env.local` files in each workspace:

#### Web (.env.local)
```env
NEXT_PUBLIC_API_URL=https://api.askinsurance.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
DATABASE_URL=postgresql://...
```

#### Mobile (.env)
```env
EXPO_PUBLIC_API_URL=https://api.askinsurance.com
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 🧪 Testing

```bash
# Run tests for all workspaces
npm run test

# Run linting
npm run lint

# Type checking
npm run type-check
```

## 🚀 Deployment

### Web Application
```bash
npx vercel --prod
```

### Mobile Application
```bash
cd mobile
npx expo build:android --type app-bundle
# Upload to Google Play Store
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow ESLint configuration
- Use conventional commits
- Test your changes thoroughly

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Email**: support@askinsurance.com
- **Phone**: +91-XXXX-XXXXXX
- **Website**: https://askinsurance.com

## 🙏 Acknowledgments

- IRDAI for regulatory compliance
- All partner insurers for their trust and collaboration
- Open source community for amazing tools and libraries

---

**ASK Insurance Broker** - Making insurance simple since 2023.
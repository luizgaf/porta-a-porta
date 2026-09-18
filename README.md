# Porta a Porta - Community Food Delivery App

A React Native Expo app for Android/iOS that works like iFood but for communities. Three user types: **Customers**, **Sellers**, and **Moderators**.

## Features

### 🎯 Core Features
- **Multi-role authentication** - Customer, Seller, Moderator
- **Community-based system** - Geofenced communities with local sellers
- **Real-time order tracking** - Status updates from preparation to delivery
- **Shopping cart** - Persistent cart with seller validation
- **Multiple payment methods** - PIX, Credit/Debit Card, Cash, Mercado Pago
- **Address management** - Saved addresses with CEP autocomplete

### 👥 User Roles

| Role | Capabilities |
|------|-------------|
| **Customer** | Browse all communities, search restaurants/products, place orders, track delivery, reviews |
| **Seller** | Manage products/menu, receive orders, update order status, analytics dashboard, payouts |
| **Moderator** | Approve/reject sellers, moderate content, resolve disputes, community settings, reports |

## Tech Stack

- **Framework**: React Native with Expo (SDK 51+)
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **State Management**: Zustand + React Context
- **Forms**: React Hook Form + Zod validation
- **UI Components**: Custom components with StyleSheet
- **Backend Ready**: Firebase (Auth, Firestore, Storage, Functions)
- **Maps**: React Native Maps + Google Maps API
- **Payments**: Stripe / Mercado Pago integration ready

## Project Structure

```
porta-a-porta/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Auth flow screens
│   ├── (tabs)/            # Main tab navigation
│   ├── community/         # Community-specific screens
│   ├── seller/            # Seller dashboard
│   ├── moderator/         # Moderator dashboard
│   ├── product/[id]       # Product detail
│   ├── order/[id]         # Order detail & tracking
│   ├── checkout           # Checkout flow
│   ├── cart               # Shopping cart
│   └── _layout.tsx        # Root layout
├── components/
│   └── ui/                # Reusable UI components
├── hooks/                 # Custom React hooks
├── store/                 # Zustand stores
├── services/              # API/Firebase services
├── types/                 # TypeScript types
├── utils/                 # Helper functions
├── constants/             # App constants
└── assets/                # Images, fonts, icons
```

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g @expo/cli`)
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

```bash
# Clone the repository
cd porta-a-porta

# Install dependencies (requires --legacy-peer-deps for Expo SDK 57)
npm install --legacy-peer-deps

# Start development server
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios

# Run on web
npm run web
```

### Test Login Credentials

The app uses mock authentication. Use any email/password (min 6 chars), role determined by email prefix:

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| **Customer** | `customer@test.com` | `123456` | Browse all communities |
| **Seller** | `seller@test.com` | `123456` | Manage products/orders |
| **Moderator** | `moderator@test.com` | `123456` | Community moderation |

## Troubleshooting

### Metro bundler issues
```bash
# Clear cache and restart
npx expo start -c
```

### Port conflicts
```bash
# Kill existing processes
pkill -f "expo"; pkill -f "metro"
# Then restart
npm start
```

### TypeScript errors
```bash
# Check for type errors
npx tsc --noEmit
```

### Dependency issues
```bash
# Reinstall with legacy peer deps
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Environment Variables

Create a `.env` file with:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=
EXPO_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=
```

## Key Screens

### Authentication Flow
- **Welcome** - Landing page with app introduction
- **Login** - Email/password with social login options
- **Register** - Account creation with validation
- **Role Selection** - Choose between Customer/Seller/Moderator
- **Community Selection** - Pick or create community

### Main Tabs (Customer)
- **Home** - Featured sellers, categories, popular products, nearby communities
- **Search** - Search restaurants/products with filters
- **Orders** - Active orders & history with tracking
- **Profile** - Account settings, addresses, payments, favorites

### Seller Dashboard
- **Overview** - Revenue, orders, rating stats
- **Products** - CRUD for menu items
- **Orders** - Real-time order management
- **Analytics** - Sales charts and insights
- **Payouts** - Earnings and withdrawal

### Moderator Dashboard
- **Sellers** - Approve/reject pending sellers
- **Disputes** - Mediate customer-seller issues
- **Settings** - Community configuration
- **Reports** - Analytics and audit logs

## Development

### Code Style
- TypeScript strict mode
- Functional components with hooks
- Custom UI components in `components/ui/`
- Zustand for global state
- Expo Router for navigation

### Testing
```bash
# Unit tests
npm test

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Building for Production

```bash
# Android (APK/AAB)
npm run build:android

# iOS (IPA)
npm run build:ios
```

## Brazil-Specific Features

- 🇧🇷 Portuguese (pt-BR) as primary language
- 💰 BRL currency formatting
- 📄 CPF/CNPJ validation for sellers
- 💳 PIX payment integration
- 🏦 Mercado Pago as primary gateway
- 🔒 LGPD compliance ready
- 📮 CEP autocomplete for addresses
- 📱 Brazilian phone number formatting

## License

MIT License - see LICENSE file for details.

---

**Porta a Porta** - Conectando comunidades através do sabor local 🍕🏪
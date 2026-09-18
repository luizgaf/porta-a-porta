# Porta a Porta - Build & Run Tutorial

This guide walks you through setting up, running, and building the **Porta a Porta** community food delivery app.

---

## Prerequisites

| Tool | Version | Install Command |
|------|---------|-----------------|
| Node.js | ≥ 18.x | `nvm install 18` or download from [nodejs.org](https://nodejs.org) |
| npm | ≥ 9.x | Included with Node.js |
| Expo CLI | Latest | `npm install -g expo-cli` |
| EAS CLI | Latest | `npm install -g eas-cli` |
| Git | Latest | `sudo apt install git` (Linux) / [git-scm.com](https://git-scm.com) |

**For Android development:**
- Android Studio (for emulator) or physical Android device with USB debugging
- JDK 17+

**For iOS development (macOS only):**
- Xcode 15+
- CocoaPods: `sudo gem install cocoapods`

---

## 1. Clone & Install

```bash
# Clone the repository
git clone <repository-url>
cd porta-a-porta

# Install dependencies (uses legacy peer deps for Expo 57 compatibility)
npm install --legacy-peer-deps
```

> **Note:** `--legacy-peer-deps` is required due to peer dependency conflicts between React Native packages and Expo SDK 57.

---

## 2. Environment Configuration

### Create `.env` file (optional)
```bash
cp .env.example .env 2>/dev/null || cat > .env <<'EOF'
# API Configuration
EXPO_PUBLIC_API_URL=https://api.portaaporta.com.br
EXPO_PUBLIC_WS_URL=wss://api.portaaporta.com.br

# Firebase (replace with your config)
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id

# Maps
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-maps-key

# Payments
EXPO_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=your-mp-key
EOF
```

---

## 3. Run Development Server

### Start Metro Bundler
```bash
# Basic start
npx expo start

# Clear cache (run if you see strange errors)
npx expo start -c

# Run on specific platform
npx expo start --android    # Opens Android emulator
npx expo start --ios        # Opens iOS simulator (macOS only)
npx expo start --web        # Opens in browser
```

### Run on Physical Device

1. Install **Expo Go** from Play Store / App Store
2. Ensure phone and computer are on **same Wi-Fi network**
3. Scan QR code from terminal with Expo Go app

### Run on Emulator/Simulator

**Android:**
```bash
# Start Android emulator first (via Android Studio)
npx expo start --android
```

**iOS (macOS only):**
```bash
# Start iOS simulator first (via Xcode)
npx expo start --ios
```

---

## 4. Project Structure

```
porta-a-porta/
├── app/                    # Expo Router file-based navigation
│   ├── (auth)/             # Auth screens (login, register, community-selection)
│   ├── (tabs)/             # Main tab navigation
│   │   ├── home.tsx        # Customer home (restaurants, categories)
│   │   ├── search.tsx      # Search restaurants/products
│   │   ├── orders.tsx      # Customer order history
│   │   ├── profile.tsx     # User profile & settings
│   │   ├── seller.tsx      # Seller dashboard
│   │   └── moderator.tsx   # Moderator dashboard
│   ├── _layout.tsx         # Root layout + providers
│   ├── checkout.tsx        # Checkout flow
│   ├── order/[id].tsx      # Order detail + tracking
│   ├── product/[id].tsx    # Product detail
│   └── seller/*            # Seller-specific routes
├── components/
│   ├── ui/                 # Reusable UI components (Button, Input, Card, etc.)
│   └── Providers.tsx       # Context providers (Auth, Cart, Community, Query)
├── hooks/                  # Custom React hooks
│   ├── useLocation.ts      # Location permissions & geolocation
│   └── useAuth.ts          # Auth utilities
├── store/                  # Zustand global state
│   ├── authStore.ts        # User auth state
│   ├── cartStore.ts        # Shopping cart
│   └── communityStore.ts   # Current community
├── types/                  # TypeScript interfaces
├── utils/                  # Helper functions (formatting, validation)
├── constants/              # App constants (colors, config)
├── assets/                 # Images, fonts, icons
└── app.json                # Expo configuration
```

---

## 5. Key Features Implementation

### User Roles (3 types)
| Role | Access | Key Screens |
|------|--------|-------------|
| **Customer** | Browse any community, place orders | Home, Search, Orders, Profile |
| **Seller** | Manage products/orders in their community | Seller Dashboard, Products, Orders, Analytics |
| **Moderator** | Approve sellers, resolve disputes, manage community | Moderator Dashboard, Sellers, Disputes, Reports |

### State Management
- **Zustand** for client state (auth, cart, community)
- **TanStack Query** for server state (API caching, mutations)

### Navigation
- **Expo Router** (file-based)
- Tabs: Home, Search, Orders, Profile
- Stack screens: Auth, Checkout, Order Detail, Product Detail

---

## 6. Building for Production

### EAS Build (Recommended)

```bash
# Login to Expo
eas login

# Configure project (first time)
eas build:configure

# Build for Android (APK)
eas build --platform android --profile preview

# Build for Android (AAB - Play Store)
eas build --platform android --profile production

# Build for iOS (macOS required)
eas build --platform ios --profile production

# Build both platforms
eas build --platform all --profile production
```

### Local Build (Advanced)

```bash
# Android APK
npx expo run:android --variant release

# iOS (macOS only)
npx expo run:ios --configuration Release
```

### Build Profiles (`eas.json`)
```json
{
  "build": {
    "preview": {
      "android": { "buildType": "apk" },
      "ios": { "simulator": true }
    },
    "production": {
      "android": { "buildType": "aab" },
      "ios": { "enterpriseProvisioning": "..." }
    }
  }
}
```

---

## 7. Running Tests

```bash
# TypeScript type checking
npx tsc --noEmit

# Linting
npm run lint

# Unit tests (when added)
npm test

# E2E tests (when added)
npm run test:e2e
```

---

## 8. Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| `Module not found: babel-preset-expo` | `npm install babel-preset-expo --legacy-peer-deps` |
| `PluginError: expo-build-properties` | `npm install expo-build-properties --legacy-peer-deps` |
| Metro cache issues | `npx expo start -c` |
| iOS pods fail | `cd ios && pod install && cd ..` |
| Android build fails | `cd android && ./gradlew clean && cd ..` |
| Location permission denied | Enable in device settings; check `app.json` permissions |
| TypeScript errors | Run `npx tsc --noEmit` to see all errors |

---

## 9. Useful Commands

```bash
# Check Expo doctor
npx expo-doctor

# View installed packages
npm list --depth=0

# Update Expo SDK
npx expo install --fix

# Generate native directories (if ejected)
npx expo prebuild

# View logs from device
npx expo logs --type device

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

---

## 10. Deployment Checklist

- [ ] All TypeScript errors resolved (`npx tsc --noEmit`)
- [ ] Linting passes (`npm run lint`)
- [ ] Environment variables set in EAS secrets
- [ ] App icons & splash screens configured (`assets/`)
- [ ] `app.json` has correct `bundleIdentifier` / `package`
- [ ] Privacy policy & terms URLs added
- [ ] Test on physical devices (Android + iOS)
- [ ] EAS build succeeds for both platforms
- [ ] Store listings prepared (screenshots, descriptions)

---

## 11. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Expo Router                          │
├─────────────────────────────────────────────────────────────┤
│  (auth) Stack          (tabs) Stack          Modal Stacks   │
│  ├─ login              ├─ home               ├─ checkout    │
│  ├─ register           ├─ search             ├─ order/[id]  │
│  └─ community-selection├─ orders             └─ product/[id]│
│                          ├─ profile                          │
│                          ├─ seller (role)                    │
│                          └─ moderator (role)                 │
├─────────────────────────────────────────────────────────────┤
│  Providers: AuthStore, CartStore, CommunityStore, Query    │
├─────────────────────────────────────────────────────────────┤
│  Services: API Client, Firebase Auth/Firestore, Push Notif │
└─────────────────────────────────────────────────────────────┘
```

---

## 12. Next Steps

1. **Backend Integration**: Connect to Firebase/Firestore or custom API
2. **Push Notifications**: Configure Expo Push + FCM/APNs
3. **Payments**: Integrate Mercado Pago / Stripe for PIX & cards
4. **Maps**: Add Google Maps / Mapbox for delivery tracking
5. **Analytics**: Add Expo Analytics / Firebase Analytics
6. **Testing**: Add Jest + React Native Testing Library + Detox
7. **CI/CD**: GitHub Actions + EAS Build automation

---

## Support

- **Expo Docs**: https://docs.expo.dev
- **Expo Router**: https://expo.github.io/router
- **Zustand**: https://github.com/pmndrs/zustand
- **TanStack Query**: https://tanstack.com/query
- **Issues**: Create GitHub issue in this repo
@AGENTS.md

## Test Login Credentials

For development/testing purposes, the following test credentials are available:

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| **Customer** | `customer@test.com` | `123456` | Default customer account |
| **Seller** | `seller@test.com` | `123456` | Seller with sample products |
| **Moderator** | `moderator@test.com` | `123456` | Moderator with community access |

The app uses mock authentication - any email/password with 6+ characters will work. The role is determined by the email prefix:
- `customer@` → Customer role
- `seller@` → Seller role  
- `moderator@` → Moderator role

## Development Notes

- All TypeScript errors resolved (`npx tsc --noEmit` passes)
- Expo SDK 57 with React Native 0.86.3
- Uses `--legacy-peer-deps` for dependency resolution
- Run `npm start` to start dev server, then scan QR with Expo Go
- Run `npm run android` / `npm run ios` for emulator/simulator
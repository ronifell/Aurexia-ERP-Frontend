# Aurexia ERP - Frontend

Next.js frontend application for Aurexia ERP system.

## Tech Stack

- **Framework**: Next.js 16 (React 19)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Charts**: Recharts
- **QR Codes**: qrcode.react
- **Notifications**: react-hot-toast

## Getting Started

### Install Dependencies

```bash
npm install
```

### Configure Environment

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
front-end/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page (redirects to dashboard or login)
│   ├── globals.css        # Global styles
│   ├── login/             # Login page
│   ├── dashboard/         # MOAB Dashboard
│   ├── sales-orders/      # Sales order management
│   ├── production/        # Production order management
│   ├── qr-scanner/        # QR code scanning interface
│   ├── part-numbers/      # Part number catalog
│   └── users/             # User management (admin only)
├── src/
│   ├── components/        # Reusable React components
│   │   └── Navbar.tsx    # Navigation bar
│   └── lib/              # Utility libraries
│       ├── api.ts        # API client functions
│       ├── store.ts      # Zustand global state
│       └── types.ts      # TypeScript type definitions
├── public/               # Static files
│   └── logo.PNG         # Aurexia logo
└── package.json
```

## Key Features

### Authentication
- JWT-based authentication
- Persistent login with localStorage
- Automatic token refresh
- Role-based access control

### Pages

#### Dashboard (MOAB)
- Real-time production statistics
- Risk-based filtering (Green/Yellow/Red)
- Daily production charts
- Work center load visualization
- Production order table with progress bars

#### Sales Orders
- Create and manage customer POs
- Line item management
- Status tracking (Open, Partial, Completed)
- Search and filter capabilities

#### Production
- Production order management
- Travel sheet generation
- Priority-based ordering
- Progress tracking

#### QR Scanner
- Two-step scanning process (badge + operation)
- Start/complete operations
- Quantity entry (good, scrap, pending)
- Operator notes and machine tracking

#### Part Numbers
- Product catalog
- Routing definitions
- Material type tracking
- Customer association

### Design System

#### Colors
- **Background**: Black (#000000)
- **Primary**: Gold gradient (#D4AF37 to #FFD700)
- **Text**: Light gray (#EDEDED)
- **Status Colors**:
  - Green: #22C55E (success/on-time)
  - Yellow: #FBBF24 (warning/at-risk)
  - Red: #EF4444 (error/delayed)

#### CSS Classes
- `.gold-text` - Gold gradient text
- `.gold-border` - Gold border
- `.card-aurexia` - Standard card with gold border
- `.btn-aurexia` - Primary button with gold gradient
- `.status-green/yellow/red` - Status badges

### State Management

Global state is managed with Zustand:

```typescript
import { useAuthStore } from '@/lib/store';

const { user, token, isAuthenticated, setAuth, logout } = useAuthStore();
```

### API Integration

All API calls are centralized in `src/lib/api.ts`:

```typescript
import { salesOrdersAPI } from '@/lib/api';

// Get all sales orders
const orders = await salesOrdersAPI.getAll();

// Create new order
const newOrder = await salesOrdersAPI.create(data);
```

### TypeScript Types

All data types are defined in `src/lib/types.ts` for type safety.

## Development Guidelines

### Code Style
- Use TypeScript for all new files
- Follow React functional component patterns
- Use async/await for API calls
- Handle errors with try/catch and toast notifications

### Component Structure
```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

const MyPage = () => {
  const router = useRouter();
  const [data, setData] = useState([]);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }
    // Load data
  }, [router]);

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      {/* Page content */}
    </div>
  );
};

export default MyPage;
```

### Styling Guidelines
- Use TailwindCSS utility classes
- Maintain consistent spacing (p-4, p-6, p-8)
- Use custom classes for repeated patterns
- Keep responsive design in mind (mobile-first)

## Deployment

### Build

```bash
npm run build
```

### Production Server

```bash
npm start
```

The production server will run on port 3000 by default.

### Environment Variables

For production, set:

```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
```

## Troubleshooting

### "Module not found" errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### Build errors
```bash
npm run lint
# Fix any linting errors
npm run build
```

### API connection issues
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Check backend is running on correct port
- Verify CORS settings in backend

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [React Hot Toast](https://react-hot-toast.com/)
- [Recharts](https://recharts.org/)

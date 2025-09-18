# Expense Tracker - Smart Bank Statement Processing

A Next.js application that transforms bank statements into organized expense reports using AI-powered categorization. Users can upload PDF statements or enter transaction text manually, and the system automatically extracts, categorizes, and tracks expenses.

## Features

### 🔐 User Authentication
- Secure login/register with NextAuth.js
- Password hashing with bcrypt
- JWT-based session management
- Protected routes and API endpoints

### 📄 Document Processing
- PDF bank statement upload and text extraction
- Manual text input for transaction data
- AI-powered transaction extraction using OpenAI GPT-4
- Automatic expense categorization

### 📊 Dashboard & Analytics
- Interactive dashboard with spending overview
- Monthly spending trends with charts
- Category breakdown with pie charts
- Transaction history and filtering
- Export capabilities (CSV format)

### 🏷️ Category Management
- Default expense categories (Living Expenses, Groceries, Restaurants, Car, Entertainment, Miscellaneous)
- Custom category creation with color coding
- Category editing and deletion
- Transaction reassignment when categories change

### 💾 Data Persistence
- SQLite database with Prisma ORM
- User-specific data isolation
- Transaction editing and deletion
- Session-based processing history
- Ability to reload and reprocess previous inputs

### 🎨 Modern UI/UX
- Responsive design with Tailwind CSS
- Dark/light theme support
- Toast notifications
- Loading states and error handling
- Mobile-friendly interface

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Authentication**: NextAuth.js v5
- **Database**: SQLite with Prisma ORM
- **AI Processing**: OpenAI GPT-4
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React & React Icons
- **Notifications**: React Hot Toast

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd expense-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-super-secret-key-here
   OPENAI_API_KEY=your-openai-api-key
   DATABASE_URL="file:./dev.db"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push database schema
   npm run db:push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Management

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes to database
npm run db:push

# Create and run migrations
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Auth pages (login, register)
│   ├── dashboard/           # Protected dashboard pages
│   ├── api/                 # API routes
│   │   ├── auth/           # Authentication endpoints
│   │   ├── categories/     # Category management
│   │   ├── transactions/   # Transaction management
│   │   └── process-pdf/    # Document processing
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing page
├── components/
│   ├── dashboard/          # Dashboard components
│   ├── providers/          # Context providers
│   └── ui/                 # Reusable UI components
├── lib/
│   ├── auth.ts            # NextAuth configuration
│   ├── database.ts        # Prisma client setup
│   └── validations.ts     # Zod schemas
├── prisma/
│   └── schema.prisma      # Database schema
└── middleware.ts          # Route protection
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `GET/POST /api/auth/[...nextauth]` - NextAuth endpoints

### Categories
- `GET /api/categories` - Get user categories
- `POST /api/categories` - Create category
- `PUT /api/categories/[id]` - Update category
- `DELETE /api/categories/[id]` - Delete category

### Transactions
- `GET /api/transactions` - Get transactions with filters
- `POST /api/transactions` - Save processed transactions
- `PUT /api/transactions/[id]` - Update transaction
- `DELETE /api/transactions/[id]` - Delete transaction

### Processing
- `POST /api/process-pdf` - Process PDF or text input

## Features in Detail

### AI-Powered Processing
The system uses OpenAI's GPT-4 to:
- Extract expense transactions from bank statements
- Ignore deposits and credits
- Categorize expenses automatically
- Clean and normalize transaction descriptions
- Assign confidence scores

### User Management
- Secure password hashing
- Session-based authentication
- User-specific data isolation
- Default categories created for new users

### Data Export
- CSV export of transactions
- Filtered export based on search criteria
- Include transaction details and categories

## Development

### Adding New Categories
Default categories are defined in `src/lib/database.ts`. To add new defaults:

```typescript
export const DEFAULT_CATEGORIES = [
  { name: 'Your New Category', color: '#FF0000', isDefault: true },
  // ... existing categories
]
```

### Customizing AI Processing
The AI prompt is in `src/app/api/process-pdf/route.ts`. Modify the system message to:
- Add new expense categories
- Change transaction extraction rules
- Adjust confidence scoring

### Database Schema Changes
1. Modify `prisma/schema.prisma`
2. Run `npm run db:push` for development
3. Run `npm run db:migrate` for production

## Deployment

### Environment Variables for Production
```env
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-production-secret
OPENAI_API_KEY=your-openai-key
DATABASE_URL="file:./prod.db"
```

### Build and Start
```bash
npm run build
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the existing issues on GitHub
2. Create a new issue with detailed information
3. Include error logs and reproduction steps

## Roadmap

- [ ] Advanced analytics and reporting
- [ ] Budget tracking and alerts
- [ ] Multiple bank account support
- [ ] Receipt image processing
- [ ] API integrations with banks
- [ ] Mobile app development
- [ ] Advanced categorization rules
- [ ] Spending goals and budgets
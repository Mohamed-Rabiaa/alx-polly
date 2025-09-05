# Pollly - Modern Polling Application

A modern, responsive polling application that allows users to create, share, and vote on polls with real-time results. Built with Next.js, TypeScript, and Supabase for a seamless user experience.

## 🚀 Features

- **User Authentication**: Secure registration and login with Supabase Auth
- **Poll Creation**: Create polls with multiple customizable options
- **Real-time Voting**: Vote on polls and see results update instantly
- **Poll Management**: Edit and delete your own polls with secure authorization
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Modern UI**: Clean, intuitive interface built with Tailwind CSS and Shadcn UI
- **Database Security**: Row Level Security (RLS) policies for data protection

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **Icons**: Lucide React
- **State Management**: React hooks + Server Components

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **API**: Next.js Server Actions
- **Security**: Row Level Security (RLS) policies

### Development
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint + TypeScript
- **Package Manager**: npm

## 📋 Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Supabase account (free tier available)

## ⚙️ Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd alx-polly
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Supabase Configuration

#### Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully initialized
3. Go to Settings > API to find your project credentials

#### Set Up Database Tables
Run the following SQL in your Supabase SQL Editor:

```sql
-- Create polls table
CREATE TABLE polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Create poll_options table
CREATE TABLE poll_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create votes table
CREATE TABLE votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for polls
CREATE POLICY "Users can view all polls" ON polls FOR SELECT USING (true);
CREATE POLICY "Users can create polls" ON polls FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own polls" ON polls FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own polls" ON polls FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for poll_options
CREATE POLICY "Users can view all poll options" ON poll_options FOR SELECT USING (true);
CREATE POLICY "Users can create options for own polls" ON poll_options FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM polls WHERE polls.id = poll_options.poll_id AND polls.user_id = auth.uid())
);
CREATE POLICY "Users can update options for own polls" ON poll_options FOR UPDATE USING (
  EXISTS (SELECT 1 FROM polls WHERE polls.id = poll_options.poll_id AND polls.user_id = auth.uid())
);
CREATE POLICY "Users can delete options for own polls" ON poll_options FOR DELETE USING (
  EXISTS (SELECT 1 FROM polls WHERE polls.id = poll_options.poll_id AND polls.user_id = auth.uid())
);

-- RLS Policies for votes
CREATE POLICY "Users can view all votes" ON votes FOR SELECT USING (true);
CREATE POLICY "Users can create own votes" ON votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own votes" ON votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own votes" ON votes FOR DELETE USING (auth.uid() = user_id);
```

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: For development
NODE_ENV=development
```

**Important**: Replace the placeholder values with your actual Supabase credentials:
- Find these in your Supabase project dashboard under Settings > API
- `NEXT_PUBLIC_SUPABASE_URL`: Your project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your project's anon/public key

### 5. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage Examples

### Creating a Poll
1. **Register/Login**: Create an account or sign in
2. **Navigate to Create Poll**: Click "Create New Poll" from the polls page
3. **Fill Poll Details**:
   ```
   Title: "What's your favorite programming language?"
   Description: "Help us understand developer preferences"
   Options: ["JavaScript", "Python", "TypeScript", "Go"]
   ```
4. **Submit**: Click "Create Poll" to publish

### Voting on Polls
1. **Browse Polls**: Visit `/polls` to see all available polls
2. **Select a Poll**: Click "Vote" on any poll card
3. **Cast Your Vote**: Select an option and click "Vote"
4. **View Results**: See real-time results after voting

### Managing Your Polls
1. **View Your Polls**: Your created polls show "Edit" and "Delete" buttons
2. **Edit Poll**: Modify title, description, and options
3. **Delete Poll**: Remove polls you no longer need

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
- Unit tests for components in `__tests__` directories
- Integration tests for user flows
- Database tests for Supabase operations

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push to main branch

### Environment Variables for Production
Ensure these are set in your deployment platform:
```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
```

## 📁 Project Structure

```
alx-polly/
├── app/                    # Next.js App Router
│   ├── auth/              # Authentication pages
│   ├── components/        # Reusable components
│   ├── create-poll/       # Poll creation page
│   ├── lib/               # Utilities and actions
│   ├── polls/             # Poll-related pages
│   └── types/             # TypeScript definitions
├── components/            # Shadcn UI components
├── public/                # Static assets
└── __tests__/             # Test files
```

## 🔧 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**: Follow the existing code style and patterns
4. **Add tests**: Ensure your changes are tested
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Development Guidelines
- Use TypeScript for all new code
- Follow the existing component patterns
- Add tests for new functionality
- Use Server Components when possible
- Implement proper error handling

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

**Supabase Connection Issues**
- Verify your environment variables are correct
- Check that your Supabase project is active
- Ensure RLS policies are properly configured

**Authentication Problems**
- Confirm Supabase Auth is enabled in your project
- Check that redirect URLs are configured correctly
- Verify user registration is allowed

**Database Errors**
- Run the SQL setup script in Supabase SQL Editor
- Check that all tables and policies exist
- Verify foreign key relationships

### Getting Help
- Check the [Issues](../../issues) page for known problems
- Review Supabase documentation for database setup
- Consult Next.js documentation for framework questions

---

**Built with ❤️ using Next.js and Supabase**

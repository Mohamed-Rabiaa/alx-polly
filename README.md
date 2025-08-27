# Pollly - Modern Polling Application

A modern polling platform built with Next.js, TypeScript, and Shadcn UI components.

## Features

- **User Authentication**: Secure login and registration system
- **Poll Creation**: Create custom polls with multiple options
- **Poll Voting**: Vote on polls and see real-time results
- **Modern UI**: Beautiful interface built with Shadcn components
- **Responsive Design**: Works seamlessly on desktop and mobile

## Project Structure

```
app/
├── auth/                    # Authentication pages
│   ├── login/
│   │   └── page.tsx        # Login page
│   └── register/
│       └── page.tsx        # Registration page
├── components/
│   ├── auth/               # Authentication components
│   │   ├── auth-layout.tsx # Layout wrapper for auth pages
│   │   ├── login-form.tsx  # Login form component
│   │   └── register-form.tsx # Registration form component
│   ├── layout/
│   │   └── navigation.tsx  # Main navigation component
│   └── ui/                 # Shadcn UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── label.tsx
├── create-poll/
│   └── page.tsx           # Poll creation page
├── lib/
│   └── utils.ts           # Utility functions
├── polls/
│   └── page.tsx           # Polls listing page
├── types/
│   ├── auth.ts            # Authentication types
│   └── poll.ts            # Poll-related types
├── globals.css            # Global styles
├── layout.tsx             # Root layout
└── page.tsx               # Home page
```

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser** and navigate to `http://localhost:3000`

## Available Routes

- `/` - Home page with app overview
- `/auth/login` - User login page
- `/auth/register` - User registration page
- `/polls` - Browse and vote on polls
- `/create-poll` - Create new polls

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **Icons**: Lucide React
- **State Management**: React hooks

## Development Status

This is a scaffolded application with placeholder functionality. The following features are ready for implementation:

- [ ] Backend API integration
- [ ] Database setup
- [ ] User authentication logic
- [ ] Poll creation and voting functionality
- [ ] Real-time updates
- [ ] User profile management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License

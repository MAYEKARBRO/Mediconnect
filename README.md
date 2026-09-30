# MediConnect - Healthcare Platform

A comprehensive healthcare platform that connects patients, doctors, and administrators in a unified digital ecosystem. MediConnect streamlines healthcare delivery through real-time messaging, AI-powered chatbots, appointment scheduling, and comprehensive patient management.

## 📋 Overview

MediConnect is a full-stack healthcare application designed to improve patient-doctor interactions and healthcare administration. The platform provides specialized portals for different user roles: patients, doctors, and administrators, each with tailored features and functionalities.

## ✨ Key Features

### Patient Features
- **Dashboard**: Overview of health status and upcoming appointments
- **Doctor Search**: Find and connect with healthcare professionals
- **Appointment Booking**: Schedule visits with doctors
- **Messages**: Direct communication with registered doctors
- **AI Chatbot**: Instant health guidance powered by Google Gemini
- **Medical History**: Track visits and medical records
- **Pharmacy Integration**: Access medication management
- **Events**: Participate in health awareness events
- **Profile Management**: Manage personal and medical information

### Doctor Features
- **Patient Management**: View and manage assigned patients
- **Appointment Schedule**: Manage and track patient appointments
- **Messaging System**: Direct communication with patients
- **Disease Trends**: Analytics on patient health trends
- **Profile**: Professional profile and credentials
- **Dashboard**: Practice overview and statistics

### Admin Features
- **Staff Management**: Manage doctors and healthcare staff
- **Inventory Management**: Track medical supplies and equipment
- **Event Management**: Create and manage health events
- **Admin Communications**: Chat with staff and patients
- **Rulebook Management**: Maintain platform guidelines and policies
- **Analytics Dashboard**: Monitor platform usage and statistics

### General Features
- **Multi-Language Support**: Support for multiple languages
- **Real-Time Messaging**: Instant message delivery
- **Authentication & Security**: Secure user authentication
- **Responsive Design**: Mobile-friendly interface

## 🛠 Tech Stack

### Frontend
- **React 18+**: Modern UI framework with hooks
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **PostCSS**: CSS transformations

### Backend & Database
- **Supabase**: Open-source Firebase alternative
  - PostgreSQL Database
  - Real-time subscriptions
  - Authentication (JWT)
  - Row-level security
- **SQL**: Database schema and migrations

### AI & APIs
- **Google Gemini API**: AI-powered chatbot and health guidance

### Development Tools
- **ESLint**: Code quality and linting
- **TypeScript Config**: Strict type checking

## 📁 Project Structure

```
mediconnect-app/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── layout/        # Layout components
│   │   └── ui/            # Basic UI elements
│   ├── pages/             # Page components
│   │   ├── admin/         # Admin panel pages
│   │   ├── auth/          # Authentication pages
│   │   ├── doctor/        # Doctor portal pages
│   │   └── patient/       # Patient portal pages
│   ├── context/           # React context (Auth, Language)
│   ├── lib/               # Utility libraries
│   │   ├── supabase.ts   # Supabase configuration
│   │   ├── gemini.ts     # Gemini API integration
│   │   └── utils.ts      # Helper functions
│   ├── types/             # TypeScript type definitions
│   ├── App.tsx            # Root component
│   └── main.tsx           # Application entry point
├── public/                # Static assets
├── supabase_*.sql         # Database schema files
└── vite.config.ts         # Vite configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm/yarn
- Supabase account
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/MAYEKARBRO/Mediconnect.git
cd Mediconnect
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Copy `.env.example` to `.env` and fill in your Supabase & Gemini credentials:
```bash
cp .env.example .env
```
Ensure your `.env` contains:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

4. Initialize Supabase:
- Run the SQL files in `supabase_*.sql` to set up the database schema and tables

### Running the Application

Development mode:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## 📦 Dependencies

Key packages used in the project:
- React & React Router for navigation
- Supabase client library for backend operations
- Axios or Fetch API for HTTP requests
- TailwindCSS for styling

## 🔐 Security

- JWT-based authentication via Supabase
- Row-level security (RLS) on database tables
- Secure API key management through environment variables
- Protected routes based on user roles

## 💾 Database

The application uses PostgreSQL (via Supabase) with the following main entities:
- Users (patients, doctors, admins)
- Appointments
- Messages
- Medical Records
- Events
- Inventory
- Staff Management

See `SUPABASE_SETUP.md` for detailed database setup instructions.

## 📱 Responsive Design

- Mobile-first approach
- Responsive components using Tailwind CSS
- Optimized for devices ranging from 320px to 4K displays

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and enhancement requests.

## 📄 License

This project is developed as part of the Lenovo AI Hackathon.

## 📞 Support

For issues and questions, please reach out to the development team or open an issue in the [GitHub repository](https://github.com/MAYEKARBRO/Mediconnect).

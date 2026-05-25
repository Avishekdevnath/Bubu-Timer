# 📚 Study Timer - React Edition

![React](https://img.shields.io/badge/React-19.2.6-61DAFB?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.3-38B2AC?style=flat-square&logo=tailwindcss)
![Firebase](https://img.shields.io/badge/Firebase-12.13-FFCA28?style=flat-square&logo=firebase)
![Node](https://img.shields.io/badge/Node-18+-339933?style=flat-square&logo=node.js)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

A powerful, modern study timer application built with React, Firebase, and Tailwind CSS. Track study sessions, collaborate with partners, set goals, and analyze your productivity.

## 🌟 Features

- ⏱️ **Pomodoro Timer** - Customizable study/break intervals with notifications
- 👥 **Partner Mode** - Real-time collaboration with real-time messaging via Firebase
- 📊 **Analytics & Reports** - Track study sessions and visualize productivity trends
- 🎯 **Goal Setting** - Create and manage study goals with progress tracking
- 📚 **Subject Management** - Organize study sessions by subject
- 🔐 **Authentication** - Secure login with Firebase Auth
- 💾 **Cloud Sync** - Automatic data synchronization with Firebase Firestore
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- 🌙 **Dark Mode** - Easy on the eyes for extended study sessions
- 📴 **Offline Support** - Service worker for offline functionality

## 🛠️ Tech Stack

- **Frontend:** React 19, React Router, Tailwind CSS
- **State Management:** React Context API
- **Backend:** Firebase (Auth, Firestore, Realtime Database, Storage)
- **Build Tool:** Vite
- **Testing:** Vitest, React Testing Library
- **Code Quality:** ESLint
- **Deployment:** Firebase Hosting with GitHub Actions CI/CD

## 📋 Prerequisites

- Node.js 18+ and npm
- Firebase project account
- Git

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/YOUR-USERNAME/study-timer-react.git
cd study-timer-react
npm install
```

### 2. Environment Setup

Create `.env.local` with your Firebase config:

```env
VITE_FIREBASE_API_KEY=your_public_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_DATABASE_URL=https://your-project.firebasedatabase.app
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

See `.env.example` for all required variables.

### 3. Development

```bash
npm run dev
```

Visit `http://localhost:5173`

### 4. Build

```bash
npm run build
```

Generates optimized production build in `dist/`

## 📖 Usage

### Start a Study Session
1. Navigate to Timer page
2. Select subject and duration
3. Click "Start" to begin
4. Take breaks between sessions

### Collaborate with Partners
1. Go to Partner page
2. Create or join a study room
3. Chat and share study goals in real-time

### Track Progress
1. View Reports page for session analytics
2. Check Goals page for progress tracking
3. Analyze study patterns by subject

## 🧪 Testing

```bash
npm run test          # Run tests once
npm run test:watch    # Watch mode
```

## 📦 Project Structure

```
src/
├── components/       # Reusable UI components
├── features/        # Feature modules (timer, partner, goals, etc)
├── pages/          # Page components
├── lib/            # Utilities (Firebase, formatting, etc)
├── state/          # Global state
├── hooks/          # Custom React hooks
├── styles/         # Global CSS
└── test/           # Test setup
```

## 🚢 Deployment

### Firebase Hosting (Automatic)

Push to `main` branch - GitHub Actions automatically:
1. Installs dependencies
2. Builds the React app
3. Deploys to Firebase Hosting

**Requirements:**
- Firebase service account key stored as `FIREBASE_SERVICE_ACCOUNT` GitHub secret
- Update workflow file with your Firebase project ID

### Manual Deployment

```bash
npm run build
firebase deploy --only hosting
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see LICENSE file for details.

## 👤 Author

Created for demonstrating modern React development practices with Firebase backend integration.

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**⭐ If you find this project useful, please consider giving it a star!**

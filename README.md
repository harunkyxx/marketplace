# 🏪 AussieMarket - React Native Marketplace App

A modern, full-featured marketplace application built with React Native and Expo, designed for buying and selling items in Australia. This app provides a complete e-commerce experience with user authentication, listings management, search functionality, chat system, and more.

## 🌟 Features

### 🔐 Authentication & User Management
- User registration and login with email/password
- Secure user profiles and account management
- Password reset functionality
- User verification system

### 📱 Core Marketplace Features
- **Home Screen**: Featured listings, categories, and trending items
- **Search & Filter**: Advanced search with category, location, and price filters
- **Create Listings**: Easy listing creation with image uploads and rich descriptions
- **User Profiles**: Manage personal information, listings, and preferences
- **Favorites System**: Save and manage favorite items
- **Real-time Chat**: In-app messaging between buyers and sellers
- **Push Notifications**: Instant notifications for messages, offers, and updates
- **My Listings**: Manage your own listings with edit/delete functionality

### 🎨 User Experience
- Modern, intuitive design with smooth animations
- Responsive layout for all screen sizes
- Dark/light theme support
- Offline capability for basic functions

## 🛠️ Tech Stack

- **Frontend**: React Native with Expo SDK
- **Backend**: Firebase (Firestore, Authentication, Storage, Cloud Functions)
- **State Management**: React Context API with hooks
- **Navigation**: React Navigation v6
- **Icons**: Expo Vector Icons (Ionicons)
- **Language**: TypeScript
- **Database**: Cloud Firestore
- **File Storage**: Firebase Storage
- **Push Notifications**: Expo Notifications + Firebase Cloud Messaging

## 📱 Screenshots

*Screenshots will be added here to showcase the app's interface*

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16.0.0 or higher)
- **npm** (v8.0.0 or higher) or **yarn** (v1.22.0 or higher)
- **Expo CLI** (latest version)
- **Git** (for cloning the repository)
- **iOS Simulator** (for iOS development) or **Android Emulator** (for Android development)

### Installation Steps

#### 1. Clone the Repository
```bash
git clone https://github.com/harunkyxx/marketplace.git
cd marketplace
```

#### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

#### 3. Install Required Global Packages
```bash
npm install -g @expo/cli
npm install -g expo-cli
```

#### 4. Firebase Setup
You need to set up Firebase for the backend services:

1. **Create a Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project" and follow the setup wizard
   - Note down your project ID

2. **Enable Firebase Services**:
   - **Authentication**: Enable Email/Password sign-in method
   - **Firestore Database**: Create a database in test mode
   - **Storage**: Enable Firebase Storage
   - **Cloud Functions**: Enable Cloud Functions (optional)

3. **Get Firebase Configuration**:
   - Go to Project Settings > General
   - Scroll down to "Your apps" section
   - Click the web app icon (</>) to add a web app
   - Copy the firebaseConfig object

4. **Update Firebase Config**:
   - Open `src/config/firebase.ts`
   - Replace the existing config with your Firebase project details:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

#### 5. Environment Variables (Optional)
Create a `.env` file in the root directory for sensitive information:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

#### 6. Run the Application

**Start the Expo development server**:
```bash
npm start
# or
expo start
```

**Run on iOS Simulator**:
```bash
npm run ios
# or
expo run:ios
```

**Run on Android Emulator**:
```bash
npm run android
# or
expo run:android
```

**Run on Web** (for testing):
```bash
npm run web
# or
expo start --web
```

## 📱 Running on Physical Devices

### iOS Device
1. Install the **Expo Go** app from the App Store
2. Scan the QR code displayed in your terminal
3. The app will load on your device

### Android Device
1. Install the **Expo Go** app from Google Play Store
2. Scan the QR code displayed in your terminal
3. The app will load on your device

## 🔧 Configuration

### Firebase Security Rules
Update your Firestore security rules in the Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Listings can be read by anyone, written by authenticated users
    match /listings/{listingId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Messages can only be read/written by participants
    match /conversations/{conversationId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.participants;
    }
  }
}
```

### Storage Rules
Update Firebase Storage rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   └── ...
├── config/             # App configuration
│   └── firebase.ts     # Firebase configuration
├── context/            # React Context providers
│   └── UserContext.tsx # User authentication context
├── screens/            # App screens
│   ├── HomeScreen.tsx
│   ├── LoginScreen.tsx
│   ├── SignUpScreen.tsx
│   ├── SearchScreen.tsx
│   ├── CreateListingScreen.tsx
│   ├── ProfileScreen.tsx
│   ├── ChatScreen.tsx
│   └── ...
├── services/           # External services and APIs
│   ├── authService.ts
│   ├── messagingService.ts
│   └── notificationService.ts
├── types/              # TypeScript type definitions
│   └── index.ts
└── utils/              # Utility functions
    ├── mockData.ts
    └── notificationActionHandler.ts
```

## 📦 Key Dependencies

### Core Dependencies
```json
{
  "expo": "^49.0.0",
  "react": "18.2.0",
  "react-native": "0.72.6",
  "react-navigation": "^6.0.0",
  "@react-navigation/native": "^6.1.9",
  "@react-navigation/stack": "^6.3.20",
  "@react-navigation/bottom-tabs": "^6.5.11"
}
```

### Firebase Dependencies
```json
{
  "firebase": "^10.7.1",
  "@react-native-firebase/app": "^18.7.3",
  "@react-native-firebase/auth": "^18.7.3",
  "@react-native-firebase/firestore": "^18.7.3",
  "@react-native-firebase/storage": "^18.7.3"
}
```

### UI & Icons
```json
{
  "@expo/vector-icons": "^13.0.0",
  "react-native-vector-icons": "^10.0.2"
}
```

## 🚨 Troubleshooting

### Common Issues

**1. Metro bundler issues**:
```bash
npx expo start --clear
```

**2. Firebase connection errors**:
- Verify your Firebase config in `src/config/firebase.ts`
- Check if your Firebase project is active
- Ensure all required services are enabled

**3. Build errors**:
```bash
npm run clean
rm -rf node_modules
npm install
```

**4. iOS Simulator issues**:
```bash
npx expo run:ios --clear
```

**5. Android Emulator issues**:
```bash
npx expo run:android --clear
```

### Performance Optimization
- Use React DevTools for performance monitoring
- Implement lazy loading for images
- Use React.memo for expensive components
- Optimize Firebase queries with proper indexing

## 🔒 Security Features

- Firebase Authentication with email/password
- Secure Firestore rules
- Input validation and sanitization
- Secure file uploads
- User permission management

## 📱 Platform Support

- **iOS**: iOS 13.0 and later
- **Android**: Android 6.0 (API level 23) and later
- **Web**: Modern browsers (Chrome, Firefox, Safari, Edge)

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support & Community

- **GitHub Issues**: Report bugs and request features
- **Discussions**: Ask questions and share ideas
- **Documentation**: Check our wiki for detailed guides

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev/)
- Powered by [Firebase](https://firebase.google.com/)
- Icons from [Ionicons](https://ionic.io/ionicons)
- Community contributors and testers

---

**Made with ❤️ for the Australian marketplace community**

*For more information, visit our [GitHub repository](https://github.com/harunkyxx/marketplace) or contact us through GitHub Issues.*

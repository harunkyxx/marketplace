# 🏪 AussieMarket - React Native Marketplace App

A modern, full-featured marketplace application built with React Native and Firebase, designed for buying and selling items in Australia.

## 🌟 Features

### 🔐 Authentication
- User registration and login
- Email/password authentication
- Secure user profiles

### 📱 Core Functionality
- **Home Screen**: Featured listings and categories
- **Search & Filter**: Advanced search with category, location, and price filters
- **Create Listings**: Easy listing creation with image uploads
- **User Profiles**: Manage personal information and listings
- **Favorites**: Save and manage favorite items
- **Chat System**: In-app messaging between buyers and sellers
- **Notifications**: Push notifications for important updates

### 🎨 UI/UX
- Modern, intuitive design
- Responsive layout for all screen sizes
- Smooth animations and transitions
- Dark/light theme support

## 🛠️ Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **State Management**: React Context API
- **Navigation**: React Navigation
- **Icons**: Expo Vector Icons (Ionicons)
- **Language**: TypeScript

## 📱 Screenshots

*Screenshots will be added here*

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/marketplace.git
   cd marketplace
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Setup**
   - Create a Firebase project
   - Enable Authentication, Firestore, and Storage
   - Update `src/config/firebase.ts` with your Firebase config

4. **Run the app**
   ```bash
   npm start
   ```

## 🔧 Configuration

### Firebase Configuration
Update `src/config/firebase.ts` with your Firebase project details:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
├── config/             # Firebase and app configuration
├── context/            # React Context providers
├── screens/            # App screens
├── services/           # API and external services
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## 🔒 Security

- Firebase Security Rules implemented
- User authentication required for sensitive operations
- Data validation on client and server side

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

If you have any questions or need help, please open an issue on GitHub.

---

## 🇹🇷 Türkçe Açıklama

AussieMarket, Avustralya'da alım satım yapmak için tasarlanmış, React Native ve Firebase ile geliştirilmiş modern bir pazar yeri uygulamasıdır.

### ✨ Özellikler
- Kullanıcı kaydı ve girişi
- İlan oluşturma ve yönetimi
- Gelişmiş arama ve filtreleme
- Kullanıcı profilleri
- Favori sistemi
- Mesajlaşma sistemi
- Bildirimler

### 🛠️ Teknolojiler
- React Native + Expo
- Firebase (Firestore, Auth, Storage)
- TypeScript
- React Navigation

---

**Made with ❤️ for the Australian marketplace community**
# marketplace

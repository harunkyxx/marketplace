# Firebase Kurulum Talimatları

## 🔥 Firebase Projesi Oluşturma

### 1. Firebase Console'a Gidin
- [Firebase Console](https://console.firebase.google.com/) adresine gidin
- Google hesabınızla giriş yapın

### 2. Yeni Proje Oluşturun
- "Create a project" butonuna tıklayın
- Proje adı: `aussie-marketplace`
- Google Analytics'i etkinleştirin (isteğe bağlı)
- "Create project" butonuna tıklayın

### 3. Web Uygulaması Ekleyin
- Proje ana sayfasında "Web" simgesine tıklayın
- Uygulama takma adı: `aussie-marketplace-web`
- "Register app" butonuna tıklayın
- Firebase SDK yapılandırmasını kopyalayın

### 4. Firebase Yapılandırmasını Güncelleyin
`src/config/firebase.ts` dosyasındaki placeholder değerleri gerçek değerlerle değiştirin:

```typescript
const firebaseConfig = {
  apiKey: "BURAYA_GERCEK_API_KEY",
  authDomain: "BURAYA_GERCEK_AUTH_DOMAIN",
  projectId: "BURAYA_GERCEK_PROJECT_ID",
  storageBucket: "BURAYA_GERCEK_STORAGE_BUCKET",
  messagingSenderId: "BURAYA_GERCEK_SENDER_ID",
  appId: "BURAYA_GERCEK_APP_ID"
};
```

### 5. Firestore Veritabanını Etkinleştirin
- Sol menüde "Firestore Database" seçin
- "Create database" butonuna tıklayın
- Test modunda başlatın (Production rules later)
- Bölge olarak `asia-southeast1` (Sydney) seçin

### 6. Authentication'ı Etkinleştirin
- Sol menüde "Authentication" seçin
- "Get started" butonuna tıklayın
- "Sign-in method" sekmesinde "Email/Password" etkinleştirin
- "Enable" butonuna tıklayın

### 7. Firestore Güvenlik Kurallarını Güncelleyin
Firestore Database > Rules sekmesinde:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Anyone can read listings
    match /listings/{listingId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Users can manage their own conversations
    match /conversations/{conversationId} {
      allow read, write: if request.auth != null && 
        (resource.data.participants[request.auth.uid] != null);
    }
    
    // Users can manage their own messages
    match /messages/{messageId} {
      allow read, write: if request.auth != null && 
        (resource.data.senderId == request.auth.uid || 
         resource.data.conversationId in get(/databases/$(database)/documents/conversations/$(resource.data.conversationId)).data.participants);
    }
  }
}
```

### 8. Firebase Storage Kurallarını Güncelleyin
Storage > Rules sekmesinde:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can upload images to their own listings folder
    match /listings/{userId}/{allPaths=**} {
      allow read: if true; // Anyone can view listing images
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can upload profile images
    match /users/{userId}/{allPaths=**} {
      allow read: if true; // Anyone can view profile images
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Default rule - deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### 9. Firestore Index'lerini Oluşturun
Firestore Database > Indexes sekmesinde:

**Composite Index:**
- Collection ID: `conversations`
- Fields: 
  - `participants` (Array contains)
  - `updatedAt` (Descending)
- Query scope: Collection

## 🧪 Test Etme

### 1. Uygulamayı Başlatın
```bash
npx expo start
```

### 2. Yeni Kullanıcı Kaydı
- "Sign Up" sayfasına gidin
- Gerçek bilgilerle kayıt olun
- Firebase Console > Authentication > Users'da kullanıcıyı görebilirsiniz

### 3. Giriş Yapma
- "Login" sayfasına gidin
- Kayıt olduğunuz bilgilerle giriş yapıny
- Ana sayfaya yönlendirileceksiniz

### 4. Veritabanı Kontrolü
- Firebase Console > Firestore Database > Data
- `users` koleksiyonunda kullanıcı profilinizi görebilirsiniz

## 📱 Tamamlanan Özellikler

✅ **Kullanıcı Kaydı**: Email/şifre ile Firebase Authentication
✅ **Kullanıcı Girişi**: Firebase Authentication ile doğrulama
✅ **Profil Yönetimi**: Firestore'da kullanıcı bilgileri
✅ **Hata Yönetimi**: Detaylı hata mesajları
✅ **Form Validasyonu**: Tüm alanlar için doğrulama

## 🚀 Sonraki Adımlar

1. **İlan Oluşturma**: Kullanıcıların ürün satabilmesi
2. **Arama ve Filtreleme**: Ürün bulma özellikleri
3. **Mesajlaşma**: Alıcı-satıcı iletişimi
4. **Profil Güncelleme**: Kullanıcı bilgilerini düzenleme

## ⚠️ Önemli Notlar

- Firebase config bilgilerini asla public repository'de paylaşmayın
- Production'da güvenlik kurallarını sıkılaştırın
- API anahtarlarını environment variables olarak saklayın

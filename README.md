
# Eventflow - Plateforme d'Invitations Numériques Premium

Eventflow est une plateforme full-stack moderne permettant de créer, gérer et partager des invitations numériques personnalisées (spécialement pour les mariages et autres événements majeurs). L'application offre un tableau de bord complet, la gestion des invités, un gestionnaire de plan de table, la personnalisation des thèmes d'invitation et le partage direct via WhatsApp.

## 🚀 Fonctionnalités Principales

- **Tableau de Bord Interactif** : Vue d'ensemble des statistiques de l'événement.
- **Gestion des Invités** : Suivi des présences, groupes/familles, et décompte des invités.
- **Seating Manager (Plan de Table)** : Interface intuitive de glisser-déposer pour organiser les tables.
- **Personnalisation d'Invitations** : Thèmes premium avec animations dynamiques (Framer Motion).
- **Partage WhatsApp Intégré** : Envoi de messages personnalisés avec prévisualisation (Open Graph/Twitter Cards).
- **Responsive Design** : Interface entièrement optimisée pour mobile et desktop.

## 🛠️ Stack Technique

### Backend (API REST)
- **Framework** : Laravel 12.0
- **Langage** : PHP 8.2+
- **Authentification** : Laravel Sanctum
- **Base de données** : SQLite / MySQL / PostgreSQL (configurable)

### Frontend (SPA)
- **Framework** : React 19
- **Build Tool** : Vite 7
- **Styling** : Tailwind CSS 4, Shadcn UI, Radix UI
- **Animations** : Framer Motion, Lottie, Canvas Confetti
- **Requêtes HTTP** : Axios, Tanstack React Query
- **Utilitaires** : jsPDF (exports PDF), Swiper, Konva

---

## 💻 Installation en Développement Local

### Prérequis
- PHP 8.2+
- Composer
- Node.js (v18+) & npm/yarn
- Un serveur de base de données (si non utilisation de SQLite)

### 1. Configuration du Backend
```bash
# Se rendre dans le dossier backend
cd backend

# Installer les dépendances PHP
composer install

# Copier le fichier d'environnement
cp .env.example .env

# Générer la clé de l'application
php artisan key:generate

# Configurer la base de données dans le .env
# DB_CONNECTION=sqlite (par défaut) ou configurer MySQL/PostgreSQL

# Lancer les migrations
php artisan migrate

# Démarrer le serveur local de Laravel
php artisan serve
```

### 2. Configuration du Frontend
```bash
# Se rendre dans le dossier frontend (depuis la racine du projet)
cd frontend

# Installer les dépendances JavaScript
npm install

# Copier le fichier d'environnement
cp .env.example .env  # ou créez manuellement un fichier .env

# Configurer l'URL de l'API dans frontend/.env
# VITE_API_URL=http://localhost:8000/api/

# Démarrer le serveur de développement Vite
npm run dev
```

---

## 🚀 Déploiement en Production

### 1. Préparation du Frontend
Avant de déployer, vous devez compiler les assets frontend.

```bash
cd frontend

# Assurez-vous que le fichier .env pointe vers votre API de production
# VITE_API_URL=https://votre-domaine.com/api/
# VITE_APP_URL=https://votre-domaine.com

# Compiler le projet
npm run build
```
Le dossier `frontend/dist` contiendra les fichiers statiques prêts à être déployés sur un serveur web (Nginx, Apache, Vercel, Netlify, etc.).

### 2. Déploiement du Backend (Serveur VPS / Mutualisé)
1. Téléversez les fichiers du dossier `backend` sur votre serveur web.
2. Assurez-vous que le répertoire racine de votre serveur web (ex: `public_html` ou `www`) pointe vers le dossier `backend/public`.
3. Configurez votre fichier `backend/.env` avec vos informations de production :
   ```env
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://api.votre-domaine.com
   FRONTEND_URL=https://votre-domaine.com
   SANCTUM_STATEFUL_DOMAINS=votre-domaine.com
   ```
4. Installez les dépendances sans les paquets de dev :
   ```bash
   composer install --optimize-autoloader --no-dev
   ```
5. Mettez en cache les configurations pour de meilleures performances :
   ```bash
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```

### 3. Gestion du Partage Social (Open Graph)
Pour que les miniatures de partage WhatsApp/Facebook s'affichent correctement :
- Vérifiez que la route Laravel renvoyant la vue de partage (ex: `share.blade.php`) contient les balises `<meta property="og:image" ...>` avec des **chemins absolus**.
- Assurez-vous que les images soient au format standard (ex: JPG) avec un poids optimisé pour les robots d'exploration.

---

## 🔒 Sécurité & Bonnes Pratiques
- **CORS & Sanctum** : Vérifiez que `SANCTUM_STATEFUL_DOMAINS` et `SESSION_DOMAIN` sont correctement configurés dans l'environnement de production pour éviter les erreurs `401 Unauthorized`.
- **Dossiers Publics** : Ne rendez public que le dossier `backend/public`. Le reste du code source backend ne doit pas être accessible directement via le web.

# KLA Ishikawa Fishbone Diagram Application

A full-stack application for creating and managing Ishikawa (Fishbone) diagrams, built with React, TypeScript, NestJS, and Tailwind CSS.

## 🎬 Demo Video

[Watch the demo here](https://screenrec.com/share/nZltMHXrsG)

##  Features

- **Interactive Fishbone Diagrams**: Create and edit professional Ishikawa diagrams
- **User Authentication**: Secure JWT-based authentication system
- **Responsive Design**: Modern, light-themed UI with glassmorphic elements
- **Real-time Editing**: Interactive SVG-based diagram editor
- **Diagram Management**: Save, load, and manage multiple diagrams
- **Styling**: Tailwind CSS with custom effects

## 🛠️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Router** for navigation
- **Axios** for API communication

### Backend
- **NestJS** with TypeScript
- **JWT Authentication** with Passport
- **Class Validator** for request validation
- **bcryptjs** for password hashing

### Development Tools
- **Nx Workspace** for monorepo management
- **ESLint** for code linting
- **Jest** for testing
- **Prettier** for code formatting

##  Installation

### Prerequisites
- **Node.js** (version 18.x or higher)
- **npm** (comes with Node.js)

### Clone the Repository
```bash
git clone <repository-url>
cd ishikawa-app
```

### Install Dependencies
```bash
npm install
```

## 🚀 Running the Application

### Development Mode

#### Option 1: Run Both Frontend and Backend Simultaneously
```bash
npm run dev
```
This command starts both the backend and frontend servers concurrently.

#### Option 2: Run Frontend and Backend Separately

**Terminal 1 / Git bash - Backend Server:**
```bash
npm run backend
```
The backend server will start at `http://localhost:3000`

**Terminal 2 - Frontend Development Server:**
```bash
npm run frontend
```
The frontend development server will start at `http://localhost:4200`

### Individual Services

**Backend Only:**
```bash
npm run dev:backend
```

**Frontend Only:**
```bash
npm run dev:frontend
```

##  Access the Application

Once both servers are running, open your browser and navigate to:
- **Frontend Application**: http://localhost:4200
- **Backend API**: http://localhost:3000



## 🔑 Authentication

The application includes a complete authentication system:

1. **Register**: Create a new account at `/register`
2. **Login**: Sign in to your account at `/login`
3. **Protected Routes**: Access to diagrams requires authentication

### Default Development User
The application starts with a clean state. Create your first user account through the registration page.

##  Using the Fishbone Diagram Editor

1. **Login** to your account
2. **Create a New Diagram**: Click "Create New Diagram" on the dashboard
3. **Edit Your Diagram**: Use the interactive editor to:
   - Add main problem/effect in the center
   - Add categories (major causes)
   - Add sub-causes to each category
   - Customize colors and styling
4. **Save Your Work**: Changes are automatically saved
5. **Export**: Option to Export


### Build Individual Applications
```bash
# Build frontend
nx build frontend

# Build backend
nx build backend
```


## 🔧 Development Tips

1. **Hot Reload**: Both frontend and backend support hot reload during development
2. **Database**: Uses a JSON file (`db.json`) for development storage
3. **CORS**: Configured to allow frontend-backend communication
4. **TypeScript**: Full TypeScript support with strict type checking

## 📝 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login

### Diagrams
- `GET /diagrams` - Get user's diagrams (paginated)
- `POST /diagrams` - Create new diagram
- `GET /diagrams/:id` - Get specific diagram
- `PUT /diagrams/:id` - Update diagram
- `DELETE /diagrams/:id` - Delete diagram



**Module Not Found:**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Build Errors:**
```bash
# Clear Nx cache
npx nx reset
npm run build
```





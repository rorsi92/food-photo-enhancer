# Food Photo Enhancer

AI-powered food photo enhancement tool using OpenAI's GPT-4 Vision API.

## Features

- ✨ Single and batch photo processing (up to 50 photos)
- 🤖 AI-powered enhancement using OpenAI GPT-4 Vision
- 🍔 Automatic food type detection
- 📸 Professional-grade enhancements optimized for food photography
- 👤 User authentication and subscription management
- 💾 Photo history and management
- 🎨 Beautiful, responsive UI

## Tech Stack

### Frontend
- React with TypeScript
- Vite for fast development
- Tailwind CSS for styling
- Axios for API calls

### Backend
- Node.js with Express
- TypeScript
- Prisma ORM with PostgreSQL
- JWT authentication
- OpenAI API integration
- Sharp for image processing
- Multer for file uploads

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database
- OpenAI API key (already configured)

### 1. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ..
npm install
```

### 2. Configure Environment Variables

#### Backend (.env in /backend)
```env
# Already configured with your OpenAI key
DATABASE_URL="postgresql://user:password@localhost:5432/food_photo_enhancer"
JWT_SECRET=generate_a_secure_random_string_here
```

#### Frontend (.env in root)
```env
VITE_API_URL=http://localhost:5000
```

### 3. Setup Database

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Run the Application

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd ..
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Usage

1. Open the application in your browser
2. Register or login (for demo, registration is simplified)
3. Upload single or multiple food photos
4. Photos are automatically sent to OpenAI for analysis
5. Enhanced photos are processed and displayed
6. Download individual or all enhanced photos

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh tokens
- `GET /api/auth/profile` - Get user profile

### Photo Enhancement
- `POST /api/enhance/single` - Enhance single photo
- `POST /api/enhance/batch` - Enhance multiple photos
- `GET /api/enhance/photos` - Get user's photos
- `DELETE /api/enhance/photos/:id` - Delete photo

## Subscription Plans

- **Free**: 10 photos/month, single upload
- **Basic**: 100 photos/month, batch up to 10
- **Pro**: 1000 photos/month, batch up to 50
- **Enterprise**: Unlimited, batch up to 100

## License

MIT
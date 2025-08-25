# 🍔 Food Photo Enhancer

**AI-powered food photo enhancement using DALL-E 3 and GPT-4o Vision**

Transform your food photos into professional, mouth-watering images that drive sales and engagement!

---

## 🚀 **RAILWAY DEPLOYMENT - QUICK START**

### **1. Environment Variables (SET THESE IN RAILWAY!)**
```env
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=production
PORT=5000
OPENAI_MODEL=gpt-4o
```

### **2. Deploy Commands**
- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Health Check:** `/health`

### **3. Railway Configuration**
The project includes:
- ✅ `railway.json` configured
- ✅ `start.js` script for proper backend startup
- ✅ Health check endpoint at `/health`
- ✅ All dependencies managed

---

## 🎯 **FEATURES**

### **🤖 AI-Powered Enhancement**
- **GPT-4o Vision** analyzes your food photos
- **DALL-E 3** generates professionally enhanced versions
- **Smart recognition** of different food types
- **Professional photography** style enhancement

### **⚡ Processing Methods**
1. **DALL-E 3 Generation** (Primary) - Creates new enhanced images
2. **Sharp Processing** (Fallback) - Traditional image enhancement
3. **Automatic fallback** if AI fails

### **📸 Photo Enhancement**
- **Professional lighting** and composition
- **Vibrant colors** that make food irresistible
- **Enhanced textures** and freshness
- **Optimized for delivery apps** (iFood, Uber Eats, etc.)

---

## 🛠 **TECH STACK**

### **Backend** (What gets deployed)
- **Node.js + Express** - RESTful API
- **OpenAI API** - GPT-4o Vision + DALL-E 3
- **Sharp** - Image processing fallback
- **Multer** - File upload handling
- **SQLite + Prisma** - Database and ORM

### **Frontend** (Development only)
- **React + TypeScript** - Modern UI
- **Vite** - Fast development
- **Tailwind CSS** - Beautiful styling
- **Axios** - API communication

---

## 🏗 **LOCAL DEVELOPMENT**

### **Prerequisites**
- Node.js 18+
- OpenAI API key

### **Setup**
```bash
# Clone and install
git clone https://github.com/rorsi92/food-photo-enhancer.git
cd food-photo-enhancer

# Backend setup
cd backend
npm install
npm start

# Frontend setup (new terminal)
cd ..
npm install
npm run dev
```

### **URLs**
- **Backend API:** http://localhost:5000
- **Frontend:** http://localhost:5177
- **Health Check:** http://localhost:5000/health

---

## 📡 **API ENDPOINTS**

### **Core Endpoints**
- `GET /` - API info and status
- `GET /health` - Health check (for Railway)
- `POST /api/enhance/single` - Enhance single photo
- `POST /api/enhance/batch` - Enhance multiple photos

### **File Serving**
- `GET /uploads/:filename` - Original photos
- `GET /processed/:filename` - Enhanced photos

---

## 🔧 **HOW IT WORKS**

### **Enhancement Process**
1. **📤 Upload** - User uploads food photo
2. **🤖 Analysis** - GPT-4o describes the food in detail
3. **🎨 Generation** - DALL-E 3 creates enhanced version
4. **💾 Download** - Enhanced image saved and served
5. **🔄 Fallback** - If AI fails, Sharp processing as backup

### **Example Flow**
```
Original Photo → GPT-4o Analysis → DALL-E 3 Generation → Enhanced Photo
     113KB    →    "Hambúrguer..."    →    AI Generation    →    1.3MB
```

---

## 💡 **DEPLOYMENT TROUBLESHOOTING**

### **Common Issues & Solutions**

#### **Health Check Fails**
- ✅ Health endpoint is `/health`
- ✅ Returns `200 OK` with server stats
- ✅ Timeout set to 300s in railway.json

#### **Build Fails**
- ✅ `start.js` handles backend startup
- ✅ Dependencies auto-install on deploy
- ✅ Node.js 18+ specified in engines

#### **API Errors**
- ✅ OpenAI key must be set in Railway env vars
- ✅ DALL-E 3 requires valid OpenAI account
- ✅ Fallback to Sharp if OpenAI fails

---

## 📊 **PRICING ESTIMATES**

### **OpenAI API Costs**
- **GPT-4o Vision:** ~$0.01 per image analysis
- **DALL-E 3:** ~$0.04 per image generation
- **Total:** ~$0.05 per enhanced photo

### **Railway Hosting**
- **Starter Plan:** $5/month
- **Pro Plan:** $20/month (recommended)

---

## 🎨 **SAMPLE ENHANCEMENT**

**Before:** Basic food photo
**After:** Professional, vibrant, appetizing image optimized for delivery apps

The AI understands food presentation and applies:
- ✨ Professional lighting
- 🌈 Enhanced colors
- 🥗 Fresh textures
- 📐 Better composition
- 🎯 Delivery-optimized appeal

---

## 🤝 **SUPPORT**

- **GitHub:** [food-photo-enhancer](https://github.com/rorsi92/food-photo-enhancer)
- **Issues:** Report bugs via GitHub Issues
- **Deployment:** Check Railway logs for errors

---

## 📄 **LICENSE**

MIT License - Feel free to use and modify!
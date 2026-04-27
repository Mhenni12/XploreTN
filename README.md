# XploreTN — AI-Driven Tourism Platform

[![Node.js](https://img.shields.io/badge/Node.js-22-brightgreen)](https://nodejs.org)
[![Python](https://img.shields.io/badge/Python-3.11-blue)](https://python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://www.postgresql.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-Framework-009688)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-Vite-61DAFB)](https://reactjs.org)

XploreTN is an AI-driven tourism platform that connects tourists with local hosts in Tunisia, enabling personalized activity recommendations and real-time interaction. The system leverages **embeddings** and **vector search** to match users with relevant activities and housing based on preferences and behavior.

---

## 🚀 Features

- **🧠 AI Recommendations**: Smart matching for activities and housing using semantic vector search.
- **🗺️ Explore & Discover**: Interactive maps with Google Maps integration and Mapillary support.
- **📅 Booking System**: Seamless reservation flow for tourist experiences and accommodations.
- **💬 Real-time Messaging**: Instant communication platform for users and hosts.
- **🏠 Host & Curator Dashboards**: Specialized tools for managing listings, experiences, and platform content.
- **🔔 Notification Center**: Real-time updates on bookings, messages, and system alerts.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React.js with Vite
- **Styling**: Tailwind CSS 
- **APIs**: Google Maps API, Mapillary

### Backend (Core)
- **Runtime**: Node.js
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: PostgreSQL with `pgvector`

### AI Service
- **Framework**: FastAPI (Python)
- **NLP**: Sentence-Transformers (`intfloat/e5-base-v2`)
- **Search**: Vector Similarity Search (Cosine)

---

## 📂 Project Structure

```text
XploreTN/
├── ai-service/        # FastAPI service for text embeddings & vector search
├── backend/           # Node.js API server for business logic & data
├── frontend/          # React application (Vite-based)
├── docker-compose.yml # Container orchestration
└── README.md          # Project documentation
```

---

## 🏁 Getting Started

### 1. Prerequisites

| Tool | Min Version | Essential for |
|---|---|---|
| **Node.js** | 22+ | Backend & Frontend development |
| **Python** | 3.11+ | AI service & Model processing |
| **PostgreSQL** | 16 | Data storage (requires `pgvector`) |
| **Docker** | 24+ | Containerized deployment |

### 2. Environment Configuration

You must create `.env` files in each service directory.

#### `ai-service/.env`
```env
DATABASE_URL=

EMBEDDING_MODEL=intfloat/e5-base-v2
EMBEDDING_DIM=768

HOST=0.0.0.0
PORT=8000
LOG_LEVEL=info

# Must match AI_SERVICE_API_KEY in the Node.js backend .env
API_KEY=
```

#### `backend/.env`
```env
DATABASE_URL=
JWT_SECRET=

MAPILLARY_CLIENT_TOKEN=
VITE_GOOGLE_MAPS_API_KEY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

AI_SERVICE_URL=
AI_SERVICE_API_KEY=

PORT=5000
```

### `frontend/.env`

```env
VITE_GOOGLE_MAPS_API_KEY=
VITE_API_URL=
```

> **Note:** `API_KEY` in `ai-service/.env` and `AI_SERVICE_API_KEY` in `backend/.env` must be identical. Generate one with:
> ```powershell
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

## 📦 Setup & Installation

### Option A: Setup with Docker (Recommended)

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd XploreTN
   ```

2. **Run all services**:
   ```bash
   docker compose up --build
   ```

3. **Initialize Database**:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

### Option B: Manual Setup

#### AI Service
```bash
cd ai-service
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\Activate.ps1 for Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 📊 Backfilling Data

If you have existing data without embeddings, you can trigger a backfill via the AI service endpoints. This will process and store embeddings in your vector-enabled database.

```bash
# Activities backfill
curl -X POST http://localhost:8000/embed/backfill/activities -H "X-API-Key: your-secret"

# Places backfill
curl -X POST http://localhost:8000/embed/backfill/places -H "X-API-Key: your-secret"

# Users backfill
curl -X POST http://localhost:8000/embed/backfill/users -H "X-API-Key: your-secret"
```

---

## ⚡ Quick Start (Windows/PowerShell)

If you are on Windows, you can use the provided setup script to automate the installation of all dependencies and start all services in separate windows:

```powershell
./script.sh
```
*(Note: Ensure you have Node.js, Python, and PostgreSQL already installed before running.)*

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.


# FindMe AI 🔍
### AI-Powered Missing Persons Search Platform

> Upload a photo. Our AI compares it against every active case in seconds.  
> Built for hackathons, startups, and humanitarian organizations.

---

## 📁 Folder Structure

```
findme-ai/
├── backend/
│   ├── app.py              ← Flask entry point
│   ├── database.py         ← SQLAlchemy models (MissingCase, Sighting, Match)
│   ├── face_engine.py      ← AI face comparison (DeepFace / OpenCV fallback)
│   ├── requirements.txt    ← Python dependencies
│   ├── routes/
│   │   ├── cases.py        ← POST/GET /api/cases
│   │   ├── sightings.py    ← POST/GET /api/sightings (triggers AI matching)
│   │   └── matches.py      ← GET/PATCH /api/matches
│   └── uploads/            ← Uploaded images stored here (auto-created)
│
└── frontend/
    ├── public/index.html
    ├── package.json
    └── src/
        ├── App.jsx         ← Router + navbar
        ├── index.js        ← React entry point
        ├── index.css       ← Global design system
        ├── utils/api.js    ← All API calls to Flask
        └── pages/
            ├── HomePage.jsx        ← Dashboard with stats
            ├── ReportPage.jsx      ← Report a missing person
            ├── SightingPage.jsx    ← Submit a sighting (triggers AI)
            ├── CasesPage.jsx       ← Browse all cases
            ├── CaseDetailPage.jsx  ← Single case + map + matches
            └── MatchesPage.jsx     ← All AI matches + map
```

---

## ⚙️ Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- pip

---

### 1️⃣ Backend Setup

```bash
cd findme-ai/backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate         # Windows

# Install Python dependencies
pip install -r requirements.txt
```

> **Note on DeepFace:** Installing TensorFlow can take a few minutes.  
> If you just want a quick demo without GPU, skip deepface and tensorflow  
> in requirements.txt — the app will fall back to an OpenCV histogram  
> comparison automatically.

**Quick install (demo mode, no TensorFlow):**
```bash
pip install flask flask-cors flask-sqlalchemy werkzeug numpy opencv-python-headless
```

---

### 2️⃣ Frontend Setup

```bash
cd findme-ai/frontend
npm install
```

---

## 🚀 Running the App

### Start the backend (terminal 1)

```bash
cd findme-ai/backend
source venv/bin/activate
python app.py
```

Backend runs at → **http://localhost:5000**

### Start the frontend (terminal 2)

```bash
cd findme-ai/frontend
npm start
```

Frontend runs at → **http://localhost:3000**

The React app proxies all `/api` requests to Flask automatically.

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | /api/health | Health check |
| POST   | /api/cases | Create missing person case |
| GET    | /api/cases | List all cases |
| GET    | /api/cases/:id | Get case + its matches |
| PATCH  | /api/cases/:id | Update status (found/active) |
| POST   | /api/sightings | Upload sighting → auto AI compare |
| GET    | /api/sightings | List all sightings |
| GET    | /api/matches | List all matches (filterable) |
| PATCH  | /api/matches/:id | Confirm / dismiss a match |
| POST   | /api/matches/compare | Manual compare (case_id + sighting_id) |

---

## 🤖 AI Face Comparison

The core AI logic lives in `backend/face_engine.py`:

```python
from face_engine import compare_faces

result = compare_faces('path/to/missing.jpg', 'path/to/sighting.jpg')
# {
#   'similarity': 91.4,    # 0–100%
#   'is_match': True,      # similarity >= 85%
#   'model': 'DeepFace/ArcFace',
#   'error': None
# }
```

**Model hierarchy:**
1. **DeepFace + ArcFace** (primary) — state-of-the-art face recognition
2. **OpenCV Histogram** (fallback) — lightweight, works without GPU

**Match threshold:** 85% similarity (configurable in `sightings.py`)

---

## 🔧 Configuration

| Setting | Location | Default |
|---------|----------|---------|
| Match threshold | `routes/sightings.py` | 85% |
| Max upload size | `app.py` | 16 MB |
| AI model | `face_engine.py` | ArcFace |
| Face detector | `face_engine.py` | RetinaFace |
| Database path | `app.py` | `instance/findme.db` |

---

## 🗺️ Features

- ✅ Report missing persons with photo + map coordinates
- ✅ Public sighting submission
- ✅ Real-time AI face comparison on every upload
- ✅ Similarity score with visual progress bar
- ✅ Interactive Leaflet map (last known location + sighting pins)
- ✅ Match review workflow (pending → confirmed / dismissed)
- ✅ Case status tracking (active → found)
- ✅ REST API with SQLite persistence
- ✅ Graceful fallback if DeepFace not installed

---

## 🚀 Hackathon Demo Tips

1. Pre-load a few cases with celebrity or stock photos
2. Submit a sighting with the same (or similar) photo to demo a match
3. Show the similarity bar going green at 90%+
4. Click "Confirm Match" to simulate a real response

---

## 📜 License

MIT — build something that matters.

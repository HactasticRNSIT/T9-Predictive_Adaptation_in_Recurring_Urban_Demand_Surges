# SurgeSense

SurgeSense is a hackathon-grade AI smart-city dashboard for predicting urban demand surges, detecting anomalies, scoring vulnerable zones, and simulating adaptive resource allocation.

## Stack

- Frontend: React + Vite + TailwindCSS
- Maps: Leaflet + OpenStreetMap
- Backend: FastAPI
- Database: SQLite
- AI/ML: Prophet-ready forecasting + Isolation Forest anomaly detection
- Charts: Recharts
- Icons/UI: Lucide + glassmorphism components

## Project Structure

```text
surgesense/
  backend/
    main.py
    requirements.txt
    app/
      api/routes.py
      database.py
      seed.py
      ml/
      services/
  frontend/
    package.json
    .env.example
    src/main.jsx
    src/styles.css
```

## Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The backend starts at `http://localhost:8000` and automatically creates `surgesense.db` with synthetic city data.

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend starts at `http://localhost:5173`.

## Environment

Create `frontend/.env` from `frontend/.env.example`:

```env
VITE_API_URL=http://localhost:8000
```

No paid map token is required. The dashboard uses OpenStreetMap tiles through Leaflet.

## API Endpoints

- `GET /api/zones`
- `GET /api/forecast?zone_id=1`
- `GET /api/anomalies?zone_id=1`
- `POST /api/simulate`
- `GET /api/dashboard`

## Demo Notes

- Forecasts are generated automatically from synthetic hourly demand history.
- Isolation Forest is used when available; fallback statistical anomaly detection keeps the demo runnable.
- Prophet is included in `requirements.txt`; the forecasting module is Prophet-ready and uses a fast deterministic fallback for hackathon reliability.

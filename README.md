# Jobnex MVP-2

Jobnex MVP-2 is an AI-powered job application and career assistance platform featuring resume analysis, job matching, interview preparation, course recommendations, and application management.

---

## Project Structure

```
final_jobnex/
├── backend/                  # FastAPI REST API & database models
│   ├── main.py               # Application entry point, auth, and API routes
│   ├── analyzer.py           # Resume analysis engine and scoring
│   ├── ai_analyzer.py        # AI interview question & course recommendation service
│   ├── database.py           # SQLAlchemy database configuration and models
│   ├── insert_test.py        # Database smoke testing script
│   ├── test_ai_analyzer.py   # Unit tests for AI service
│   ├── test_analyzer.py      # Unit tests for resume analyzer
│   ├── test_db.py            # Database connection tests
│   ├── requirements.txt      # Python dependencies
│   ├── .env.example          # Example environment variable template
│   └── RUNNING_NOTES.txt     # Backend developer notes
├── frontend/                 # Web interface (HTML5 / Vanilla CSS & JS)
│   ├── index.html            # Landing page
│   ├── login.html            # Authentication (Sign in / Sign up)
│   ├── dashboard.html        # User dashboard & statistics
│   ├── analyzer.html         # Resume analyzer interface
│   ├── jobs.html             # Job discovery & search
│   ├── applications.html     # Application tracking
│   ├── interview.html        # AI interview preparation
│   ├── chatbot.html          # Career assistant chat
│   ├── courses.html          # Recommended courses
│   ├── privacy.html          # Privacy policy
│   ├── common.css            # Design system & shared styles
│   ├── common.js             # Shared logic and UI state
│   └── api.js                # Frontend API client
├── dev.py                    # Unified local development launcher
└── .gitignore                # Git ignore rules
```

---

## Quick Start

### 1. Prerequisites
- Python 3.10+
- MySQL Server (running on port 3306)

### 2. Environment Setup
Create a `.env` file in the `backend/` directory based on `.env.example`:

```bash
cd backend
cp .env.example .env
```

Configure your `.env` variables:
```env
ANTHROPIC_API_KEY=your_anthropic_api_key
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=jobnex
DATABASE_URL=mysql+mysqlconnector://root:your_mysql_password@127.0.0.1:3306/jobnex
```

### 3. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 4. Run Locally
You can run both backend and frontend together with the dev runner:
```bash
python dev.py
```
Or run individually:
- **Backend:** `uvicorn backend.main:app --reload --port 8000`
- **Frontend:** Serve the `frontend/` directory on port 3000 (e.g. `python -m http.server 3000 --directory frontend` or Live Server).

---

## Testing
Run unit tests with:
```bash
pytest backend/
```
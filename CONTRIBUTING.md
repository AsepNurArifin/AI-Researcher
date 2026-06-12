# Contributing to HireSense AI

Thank you for your interest in contributing to HireSense AI! We welcome contributions of all kinds, including bug reports, feature requests, documentation improvements, and pull requests.

---

## 🛠️ Development Setup

HireSense AI consists of a **FastAPI** backend and a **Next.js (App Router)** frontend.

### Prerequisites
- **Python 3.12+**
- **Node.js 20+**
- **PostgreSQL** (with the `pgvector` extension enabled, e.g., via Supabase or a local instance)

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # macOS/Linux:
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up your `.env` configuration (use `.env.example` as a template):
   ```env
   DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<db_name>
   HIRESENSE_SECRET_KEY=your-jwt-secret-key
   ```
5. Apply database migrations:
   ```bash
   alembic upgrade head
   ```
6. Run the local development server:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your `.env.local` configuration (use `.env.example` as a template):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

---

## 🧪 Testing Guidelines

Before submitting any code changes, please ensure that all tests pass.

### Running Backend Tests
Navigate to the `backend` folder and execute the test runner:
```bash
pytest --cov=app tests/ -v
```

All contributions that add backend logic must include matching unit or integration tests in the `tests/` directory. Target a test coverage of **≥ 70%**.

---

## 📝 Coding Standards

To maintain code quality:
1. **Python**: Use `black` and `ruff` for code formatting and linting.
2. **TypeScript/React**: Follow standard React hook design and lint using ESLint.
3. **Database**: Always use Alembic migrations for database schema changes. Do not modify tables manually.
4. **Git Commit Messages**: Keep commit messages clear, concise, and descriptive (e.g., `feat: add company table and multi-tenant isolation`).

---

## 🚀 Pull Request Process

1. Fork the repository and create your branch from `main`.
2. Add or update tests for any new features or bug fixes.
3. Ensure the test suite passes locally.
4. Document any configuration changes or new features in the `README.md` or Swagger annotations.
5. Open a Pull Request detailing the changes, reasoning, and manual verification results.

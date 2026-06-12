@echo off
echo ============================================
echo   HireSense AI - Local Development Server
echo ============================================
echo.

:: Start Backend
echo [1/2] Menjalankan Backend (FastAPI)...
cd /d "%~dp0backend"

:: Check if .venv exists
if not exist ".venv" (
    echo      Membuat virtual environment...
    python -m venv .venv
    echo      Menginstall dependencies...
    call .venv\Scripts\activate.bat
    pip install -r requirements.txt
) else (
    call .venv\Scripts\activate.bat
)

start "HireSense Backend" cmd /k "call .venv\Scripts\activate.bat && python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
echo      Backend berjalan di http://127.0.0.1:8000
echo.

:: Start Frontend
echo [2/2] Menjalankan Frontend (Next.js)...
cd /d "%~dp0frontend"
start "HireSense Frontend" cmd /k "npm run dev"
echo      Frontend berjalan di http://localhost:3000
echo.

echo ============================================
echo   Kedua server sedang berjalan!
echo   Backend:  http://127.0.0.1:8000
echo   Frontend: http://localhost:3000
echo   API Docs: http://127.0.0.1:8000/docs
echo ============================================
echo.
echo Tutup jendela terminal backend dan frontend untuk menghentikan server.
pause

# Run NutriLens

From the repository root in PowerShell:

```powershell
.\run\all.cmd
```

That opens four windows. If a port is already in use, that window says the service is already running and leaves it alone.

| Script | What it starts | Address |
| --- | --- | --- |
| `run\web.cmd` | Next.js app | http://localhost:3000 |
| `run\api.cmd` | Express API | http://localhost:4000 |
| `run\ml.cmd` | Grade model | http://localhost:8000 |
| `run\ocr.cmd` | Label reader | http://localhost:8001 |
| `run\all.cmd` | All four | |
| `run\stop.cmd` | Stops those four ports | |
| `run\status.cmd` | Prints each health check | |
| `run\test-ocr.cmd` | Sends one image to the API | |

Sign in at http://localhost:3000/login, then use the dashboard. Scans are stored in the hosted Postgres database named in `services/api/.env` as `DATABASE_URL`. Email sign-in does not need that database. A grade needs the ML window. A photographed label needs the OCR window.

First-time Python setup, from the repository root:

```powershell
cd services\ocr
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
cd ..\ml
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

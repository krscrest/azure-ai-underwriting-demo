# Azure AI Insurance Underwriting Demo

A demo application showcasing Azure AI capabilities in insurance underwriting. Built with React + Tailwind CSS frontend and Python FastAPI backend.

## Features

- **Document Upload & AI Extraction** — Upload insurance documents and see AI extract key fields with confidence scores
- **Risk Scoring** — AI-powered risk assessment with color-coded gauge, risk factors, and plain-English explanation
- **AI Copilot Chat** — Interactive assistant that answers underwriter questions about any submission
- **Underwriter Decision Workflow** — Approve, reject, or request more info with notes
- **Dashboard** — Overview of submissions with stats and status tracking

## Tech Stack

- **Frontend:** React 19 + Tailwind CSS + React Router
- **Backend:** Python FastAPI
- **AI Services:** Azure OpenAI (GPT-4) + Azure AI Document Intelligence (mock endpoints included for demo)
- **Deployment:** Azure App Service (Linux, Python 3.12)

## Quick Start

### Prerequisites
- Python 3.12+
- Node.js 18+

### Backend
```bash
cd backend
pip install -r requirements.txt

# Set environment variables (see .env.example)
export DEMO_EMAIL=demo@insurance.com
export DEMO_PASSWORD=YourPasswordHere
export DEMO_TOKEN=YourTokenHere

python main.py
```

### Frontend (Development)
```bash
cd frontend
npm install
npm start
```

### Production Build
```bash
cd frontend
npm run build
# Copy build output to backend/static
cp -r build ../backend/static

cd ../backend
gunicorn main:app --workers 2 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## Azure Deployment

1. Create resources:
```bash
az group create --name rg-ai-underwriting-demo --location <region>
az appservice plan create --name plan-ai-underwriting --resource-group rg-ai-underwriting-demo --sku B1 --is-linux
az webapp create --name <app-name> --resource-group rg-ai-underwriting-demo --plan plan-ai-underwriting --runtime "PYTHON:3.12"
```

2. Configure:
```bash
az webapp config set --name <app-name> --resource-group rg-ai-underwriting-demo \
  --startup-file "gunicorn main:app --workers 2 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --timeout 120"

az webapp config appsettings set --name <app-name> --resource-group rg-ai-underwriting-demo \
  --settings SCM_DO_BUILD_DURING_DEPLOYMENT=true DEMO_EMAIL=demo@insurance.com DEMO_PASSWORD=YourPassword DEMO_TOKEN=YourToken
```

3. Deploy:
```bash
cd frontend && npm run build && cp -r build ../backend/static
cd ../backend
zip -r ../deploy.zip . -x "__pycache__/*"
az webapp deployment source config-zip --name <app-name> --resource-group rg-ai-underwriting-demo --src ../deploy.zip
```

## Project Structure

```
├── backend/
│   ├── main.py              # FastAPI server + all API endpoints
│   ├── requirements.txt     # Python dependencies
│   └── startup.sh           # Azure App Service startup script
├── frontend/
│   ├── src/
│   │   ├── api.js           # API client
│   │   ├── App.js           # Router + app shell
│   │   ├── components/      # Navbar
│   │   └── pages/           # Login, Dashboard, Upload, RiskScoring, Decision, Confirmation
│   ├── tailwind.config.js
│   └── package.json
├── .env.example             # Environment variable template
├── .gitignore
└── README.md
```

## License

MIT


# NutriLens

NutriLens is a nutrition-focused application that connects a Next.js frontend with a backend API.

## Current Features

- Next.js frontend using React and TypeScript.
- Backend health-check connection.
- Displays backend status and service information.
- Handles backend connection errors.

## Project Structure

```text
NutriInsightX/
├── frontend/
│   ├── app/
│   │   └── page.tsx
│   ├── package.json
│   └── ...
├── backend/
│   ├── ...
│   └── ...
├── README.md
└── .gitignore
```



## Getting Started

### 1. Clone the repository

```bash
git clone YOUR_REPOSITORY_URL
cd NutriLens
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Configure the backend URL

Create a `.env.local` file in the Next.js frontend directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 4. Start the frontend

```bash
npm run dev
```

Open the local Next.js URL shown in your terminal.

## Backend Connection

The frontend sends a GET request to:

```text
http://localhost:4000/health
```

The backend should return a JSON response similar to:

```json
{
  "status": "healthy",
  "service": "NutriTrust Backend"
}
```
## Foundations
``` 
Next.js
   ↓
Express API
   ↓
Routes
   ↓
Prisma 7
   ↓
PrismaPg
   ↓
PostgreSQL
   ↓
NutriLens DB 
```
## Backend Architecture
```
                    Next.js Frontend
                           │
                           ▼
                    Express API
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
        Controllers                 Middleware
              │
              ▼
          Services
              │
      ┌───────┼────────┬──────────┐
      ▼       ▼        ▼          ▼
    Scan    Label    Evidence   Report
   Service  Service   Service   Service
      │       │        │          │
      └───────┴────────┴──────────┘
                    │
                    ▼
              Prisma Client
                    │
                    ▼
               PostgreSQL

Later-
Express API
     │
     ├─ OCR Service->PythonML 
     │
     ├─ Verification Service
     │
     └─ Trust Score Service

```

## Roadmap

- [ ] Nutrition and food analysis.
- [ ] Food recognition.
- [ ] Nutritional information and insights.
- [ ] User interface improvements.
- [ ] Backend API integration.

```
                 FOOD LABEL
                     │
                     ▼
                    OCR
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
    Nutrition Text        Ingredients Text
          │                     │
          ▼                     ▼
    Normalization        Ingredient Parser
          │                     │
          ▼                     ├── Allergens
    Random Forest               ├── Colors
          │                     ├── Preservatives
          ▼                     ├── Additives
     Nutri-Score                ├── Sweeteners
                                ├── Flavouring
                                └── Other agents
                                │
                                ▼
                         Evidence Engine
                                │
                ┌───────────────┴───────────────┐
                ▼                               ▼
          Evidence status                Explanation
                │                               │
                └───────────────┬───────────────┘
                                ▼
                         TRUST / REPORT

```

## License

This project is currently for development and educational purposes.
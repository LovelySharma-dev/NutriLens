from fastapi import FastAPI

app = FastAPI(
    title="NutriLens ML Service",
    version="1.0.0"
)

@app.get("/health")
def health_check():
    return{
        "status": "ok",
        "service": "NutriLens ML Service"
    }
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import json
import math
import os

app = FastAPI(title="CardioAI Inference Server", description="FastAPI server for heart disease probability prediction using a trained Logistic Regression model.")

# Enable CORS for frontend compatibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model assets
assets_path = "model_assets.json"
if not os.path.exists(assets_path):
    raise RuntimeError(f"Model assets file '{assets_path}' not found. Please run 'train.py' first.")

with open(assets_path, "r") as f:
    MODEL_ASSETS = json.load(f)

# Pydantic schema for inputs
class PatientProfile(BaseModel):
    age: float = Field(..., description="Age in years")
    sex: float = Field(..., description="1 = Male; 0 = Female")
    cp: float = Field(..., description="Chest pain type (0-3)")
    trestbps: float = Field(..., description="Resting blood pressure (mm Hg)")
    chol: float = Field(..., description="Serum cholesterol (mg/dl)")
    fbs: float = Field(..., description="Fasting blood sugar > 120 mg/dl (1 = true; 0 = false)")
    restecg: float = Field(..., description="Resting ECG results (0-2)")
    thalach: float = Field(..., description="Max heart rate achieved")
    exang: float = Field(..., description="Exercise induced angina (1 = yes; 0 = no)")
    oldpeak: float = Field(..., description="ST depression induced by exercise relative to rest")
    slope: float = Field(..., description="Slope of peak exercise ST segment (0-2)")
    ca: float = Field(..., description="Number of major vessels (0-4)")
    thal: float = Field(..., description="Thalassemia type (0-3)")

CLINICAL_LABELS = {
    "age": "Age",
    "sex": "Sex",
    "cp": "Chest Pain Type",
    "trestbps": "Resting Blood Pressure",
    "chol": "Serum Cholesterol",
    "fbs": "Fasting Blood Sugar",
    "restecg": "Resting ECG Results",
    "thalach": "Max Heart Rate Achieved",
    "exang": "Exercise Induced Angina",
    "oldpeak": "ST Depression (Oldpeak)",
    "slope": "ST Segment Slope",
    "ca": "Number of Major Vessels",
    "thal": "Thalassemia Type"
}

@app.get("/")
def read_root():
    return {"status": "online", "model": "Logistic Regression", "version": "1.0.0"}

@app.get("/metrics")
def get_metrics():
    return {
        "features": MODEL_ASSETS["features"],
        "metrics": MODEL_ASSETS["metrics"]
    }

@app.post("/predict")
def predict(profile: PatientProfile):
    try:
        # Convert Pydantic object to dict
        inputs = profile.dict()
        
        # Calculate normalized features and contribution
        logit = MODEL_ASSETS["model"]["intercept"]
        contributions = []
        
        features = MODEL_ASSETS["features"]
        mean = MODEL_ASSETS["scaler"]["mean"]
        scale = MODEL_ASSETS["scaler"]["scale"]
        coefficients = MODEL_ASSETS["model"]["coefficients"]
        
        for idx, feat in enumerate(features):
            raw_val = inputs[feat]
            m = mean[idx]
            s = scale[idx]
            coeff = coefficients[idx]
            
            # Z-score standardization
            normalized = (raw_val - m) / s
            contribution = normalized * coeff
            
            logit += contribution
            
            contributions.push = {
                "name": CLINICAL_LABELS[feat],
                "value": float(contribution)
            }
            # Wait, Python list syntax is append, let's fix it
            contributions.append({
                "name": CLINICAL_LABELS[feat],
                "value": float(contribution)
            })
            
        # Probability via Sigmoid function
        probability = 1.0 / (1.0 + math.exp(-logit))
        percent = probability * 100.0
        
        # Determine risk classification
        if percent < 30.0:
            risk_class = "Low Risk"
        elif percent < 70.0:
            risk_class = "Moderate Risk"
        else:
            risk_class = "High Risk"
            
        return {
            "probability": float(probability),
            "percentage": float(percent),
            "risk_classification": risk_class,
            "contributions": contributions
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

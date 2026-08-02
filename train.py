import urllib.request
import pandas as pd
import numpy as np
import json
import os
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

def main():
    print("Starting heart disease ML model training...")
    
    # 1. Download UCI Heart Disease Dataset (Cleveland)
    url = "https://raw.githubusercontent.com/Amankharwal/Website-data/master/heart.csv"
    data_dir = "data"
    os.makedirs(data_dir, exist_ok=True)
    csv_path = os.path.join(data_dir, "heart.csv")
    
    if not os.path.exists(csv_path):
        print(f"Downloading dataset from {url}...")
        urllib.request.urlretrieve(url, csv_path)
        print("Download complete.")
    else:
        print("Dataset already downloaded.")
        
    df = pd.read_csv(csv_path)
    print(f"Dataset loaded. Shape: {df.shape}")
    print("Columns:", list(df.columns))
    
    # Features & Target
    # Columns expected: age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal, target
    X = df.drop(columns=['target'])
    y = df['target']
    
    # 2. Train/Test Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # 3. Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # 4. Train Logistic Regression model
    model = LogisticRegression(max_iter=1000, random_state=42)
    model.fit(X_train_scaled, y_train)
    
    # 5. Evaluate model
    y_pred = model.predict(X_test_scaled)
    y_prob = model.predict_proba(X_test_scaled)[:, 1]
    
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_prob)
    
    print("\n--- Model Evaluation ---")
    print(f"Accuracy:  {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    print(f"ROC AUC:   {auc:.4f}")
    
    # 6. Export parameters for Javascript
    # We need features list, scaling means, scaling scale (std dev), model coefficients, and intercept
    export_data = {
        "features": list(X.columns),
        "scaler": {
            "mean": list(scaler.mean_),
            "scale": list(scaler.scale_)
        },
        "model": {
            "coefficients": list(model.coef_[0]),
            "intercept": float(model.intercept_[0])
        },
        "metrics": {
            "accuracy": round(accuracy, 4),
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1": round(f1, 4),
            "auc": round(auc, 4)
        }
    }
    
    with open("model_assets.json", "w") as f:
        json.dump(export_data, f, indent=4)
        
    print("\nModel weights, scale factors and metrics exported to 'model_assets.json'.")

if __name__ == "__main__":
    main()

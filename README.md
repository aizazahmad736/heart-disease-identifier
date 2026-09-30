# CardioAI - Heart Disease Classifier (ML)

CardioAI is an interactive machine learning dashboard that predicts heart disease probability based on clinical measurements using Logistic Regression trained on the UCI Heart Disease Dataset.

<img width="583" height="413" alt="image" src="https://github.com/user-attachments/assets/d894333b-2fd4-4aa1-9d84-1ad30e622bd9" />

<img width="574" height="398" alt="image" src="https://github.com/user-attachments/assets/f954b305-9918-4389-a6b3-3cbece378561" />

<img width="564" height="366" alt="image" src="https://github.com/user-attachments/assets/f54a9536-b858-4d6d-a019-62eee791d0f2" />

<img width="535" height="443" alt="image" src="https://github.com/user-attachments/assets/83d5c2d2-7cc8-41bd-9191-9fc46f6e2e80" />

## Architecture

- **`train.py`**: A Python ML pipeline script. It downloads the UCI Cleveland dataset, handles preprocessing with standard scaling, trains a Scikit-Learn `LogisticRegression` classifier, evaluates the performance metrics, and exports normalized parameters to `model_assets.json`.
- **`index.html` / `style.css` / `app.js`**: A modern, high-fidelity responsive dashboard. The JS client handles step-by-step form input, applies exact z-score feature standardization, performs inference locally in the browser, and renders factor contribution charts using Chart.js.

## Performance Metrics

- **Accuracy**: ~80.3%
- **ROC AUC**: ~0.869
- **Recall (Sensitivity)**: ~90.9%
- **F1 Score**: ~83.3%

## Setup and Run

### 1. Requirements

Make sure Python 3 is installed along with the required libraries:

```bash
pip install pandas numpy scikit-learn
```

### 2. Run Model Training (Optional)

To retrain the ML model and update the weights:

```bash
python train.py
```

This updates `model_assets.json` with the latest model parameters.

### 3. Open the Dashboard

Simply open `index.html` in any web browser to run assessments immediately without needing a server.

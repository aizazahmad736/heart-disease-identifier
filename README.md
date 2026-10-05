# CardioAI - Heart Disease Classifier (ML)

CardioAI is an interactive educational dashboard that demonstrates a Logistic Regression model using measurements from the UCI Heart Disease Dataset.

> **Important:** This project is a learning demonstration, not a medical device or clinical decision-support tool. Its estimates are not validated for diagnosis or treatment. Do not use them to make health decisions or enter personally identifying information. When the API is unavailable, the dashboard uses a simple heuristic fallback rather than the trained model.

<img width="583" height="413" alt="image" src="https://github.com/user-attachments/assets/d894333b-2fd4-4aa1-9d84-1ad30e622bd9" />

<img width="574" height="398" alt="image" src="https://github.com/user-attachments/assets/f954b305-9918-4389-a6b3-3cbece378561" />

<img width="564" height="366" alt="image" src="https://github.com/user-attachments/assets/f54a9536-b858-4d6d-a019-62eee791d0f2" />

<img width="535" height="443" alt="image" src="https://github.com/user-attachments/assets/83d5c2d2-7cc8-41bd-9191-9fc46f6e2e80" />

<img width="548" height="236" alt="image" src="https://github.com/user-attachments/assets/298cd2c7-1410-49a6-a60c-cb030142744d" />

<img width="538" height="442" alt="image" src="https://github.com/user-attachments/assets/8423f281-a6ed-4b71-bcca-5516c9fbabcb" />

## Architecture

- **`train.py`**: A Python ML pipeline script. It downloads the heart dataset, handles preprocessing with standard scaling, trains a Scikit-Learn `LogisticRegression` classifier, evaluates the performance metrics, and exports normalized parameters to `model_assets.json`.
- **`main.py`**: A FastAPI inference API that validates submitted measurements and returns model estimates and feature contributions.
- **`index.html` / `style.css` / `app.js`**: A responsive dashboard that calls the local API when available, uses a simple heuristic fallback otherwise, and renders factor contribution charts using Chart.js.

## Performance Metrics

The displayed metrics are from a single train/test split and are included for demonstration only. They do not establish clinical performance or generalization to other populations.

## Setup and Run

### 1. Requirements

Make sure Python 3 is installed, then install the project and test dependencies:

```bash
pip install -r requirements.txt
```

### 2. Run the API

Start the FastAPI inference service:

```bash
uvicorn main:app --reload
```

The API runs at `http://127.0.0.1:8000`. The dashboard uses a simple heuristic fallback if the API is unavailable.

### 3. Run Model Training (Optional)

To retrain the model and update the weights:

```bash
python train.py
```

This downloads the dataset if needed and updates `model_assets.json`.

### 4. Open the Dashboard

Open `index.html` in a web browser. The API is optional because the dashboard provides a heuristic fallback, which is not a model prediction.

### Run Tests

```bash
python -m pytest
```

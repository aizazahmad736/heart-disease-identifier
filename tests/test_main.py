import pytest
from fastapi.testclient import TestClient
from html.parser import HTMLParser
from pathlib import Path

from main import app


client = TestClient(app)
ROOT = Path(__file__).resolve().parents[1]

VALID_PROFILE = {
    "age": 52,
    "sex": 1,
    "cp": 2,
    "trestbps": 125,
    "chol": 212,
    "fbs": 0,
    "restecg": 0,
    "thalach": 168,
    "exang": 0,
    "oldpeak": 1.0,
    "slope": 2,
    "ca": 0,
    "thal": 2,
}


class RiskFormParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_risk_form = False
        self.field_names = set()

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if tag == "form" and attributes.get("id") == "risk-form":
            self.in_risk_form = True
        elif self.in_risk_form and tag in {"input", "select"}:
            if attributes.get("name"):
                self.field_names.add(attributes["name"])

    def handle_endtag(self, tag):
        if tag == "form" and self.in_risk_form:
            self.in_risk_form = False


def test_risk_form_submits_every_model_feature():
    parser = RiskFormParser()
    parser.feed((ROOT / "index.html").read_text(encoding="utf-8"))

    assert parser.field_names == set(VALID_PROFILE)


def test_predict_returns_probability_and_feature_contributions():
    response = client.post("/predict", json=VALID_PROFILE)

    assert response.status_code == 200
    result = response.json()
    assert 0 <= result["probability"] <= 1
    assert 0 <= result["percentage"] <= 100
    assert len(result["contributions"]) == len(VALID_PROFILE)


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("age", 0),
        ("age", 121),
        ("sex", -1),
        ("sex", 2),
        ("sex", 1.5),
        ("cp", -1),
        ("cp", 4),
        ("cp", 1.5),
        ("trestbps", 79),
        ("trestbps", 221),
        ("chol", 99),
        ("chol", 601),
        ("fbs", 2),
        ("fbs", 0.5),
        ("restecg", 3),
        ("restecg", 1.5),
        ("thalach", 59),
        ("thalach", 221),
        ("exang", 2),
        ("exang", 0.5),
        ("oldpeak", -0.1),
        ("oldpeak", 10.1),
        ("slope", 3),
        ("slope", 1.5),
        ("ca", -1),
        ("ca", 5),
        ("ca", 1.5),
        ("thal", 4),
        ("thal", 1.5),
    ],
)
def test_predict_rejects_out_of_range_or_fractional_categories(field, value):
    profile = {**VALID_PROFILE, field: value}

    response = client.post("/predict", json=profile)

    assert response.status_code == 422

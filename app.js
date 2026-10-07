// ============================================================
// Heart Disease Identifier - Frontend JavaScript
// ============================================================

const BACKEND_URL = "http://127.0.0.1:8000";

const MODEL_ASSETS = {
    name: "Heart Disease Risk Model",
    version: "1.0.0"
};

const FEATURE_LABELS = {
    age: "Age",
    sex: "Sex",
    cp: "Chest Pain Type",
    trestbps: "Resting Blood Pressure",
    chol: "Cholesterol",
    fbs: "Fasting Blood Sugar",
    restecg: "Resting ECG",
    thalach: "Maximum Heart Rate",
    exang: "Exercise Induced Angina",
    oldpeak: "ST Depression",
    slope: "ST Slope",
    ca: "Major Vessels",
    thal: "Thalassemia"
};

const FEATURE_DESCRIPTIONS = {
    age: "Patient age",
    sex: "Biological sex",
    cp: "Type of chest pain",
    trestbps: "Resting blood pressure",
    chol: "Serum cholesterol",
    fbs: "Fasting blood sugar",
    restecg: "Resting electrocardiographic results",
    thalach: "Maximum heart rate achieved",
    exang: "Exercise induced angina",
    oldpeak: "ST depression induced by exercise",
    slope: "Slope of peak exercise ST segment",
    ca: "Number of major vessels",
    thal: "Thalassemia"
};

let featureChart = null;
let assessmentSessionHistory = [];


// ============================================================
// DOM CONTENT LOADED
// ============================================================

document.addEventListener("DOMContentLoaded", function () {
    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }

    checkBackendConnection();
    setupNavigation();
});


// ============================================================
// BACKEND CONNECTION
// ============================================================

async function checkBackendConnection() {
    try {
        const response = await fetch(`${BACKEND_URL}/`, {
            method: "GET"
        });

        if (response.ok) {
            console.log("Backend connected successfully.");
        } else {
            console.warn("Backend responded with an error.");
        }
    } catch (error) {
        console.warn(
            "Backend is not available. Local fallback mode will be used."
        );
    }
}


// ============================================================
// NAVIGATION
// ============================================================

function setupNavigation() {
    const navLinks = document.querySelectorAll(".nav-item");

    navLinks.forEach(link => {
        link.addEventListener("click", function (event) {
            event.preventDefault();
            const target = this.hash.slice(1);

            if (!target) return;

            switchTab(target);
        });
    });
}

function switchTab(sectionName) {
    const targetSection = document.getElementById(`${sectionName}-tab`);

    if (!targetSection) {
        console.error(`Navigation target not found: ${sectionName}`);
        return;
    }

    document.querySelectorAll(".tab-content").forEach(section => {
        section.classList.toggle("active", section === targetSection);
    });

    document.querySelectorAll(".nav-item").forEach(link => {
        link.classList.toggle("active", link.hash === `#${sectionName}`);
    });
}


// ============================================================
// SYNTHETIC DEMO PROFILE
// ============================================================

function loadSampleProfile() {
    const form = document.getElementById("risk-form");

    if (!form) {
        console.error("Risk form not found.");
        return;
    }

    const sampleProfile = {
        age: 52,
        sex: 1,
        cp: 2,
        trestbps: 125,
        chol: 212,
        fbs: 0,
        restecg: 0,
        thalach: 168,
        exang: 0,
        oldpeak: 1.0,
        slope: 2,
        ca: 0,
        thal: 2
    };

    Object.entries(sampleProfile).forEach(([name, value]) => {
        const field = form.elements.namedItem(name);
        if (field) field.value = value;
    });
}


// ============================================================
// CALCULATE RISK
// ============================================================

async function calculateRisk(e) {
    e.preventDefault();

    const form = document.getElementById("risk-form");

    if (!form) {
        console.error("Risk form not found.");
        return;
    }

    const formData = new FormData(form);
    const inputs = {};

    formData.forEach((value, key) => {
        inputs[key] = value;
    });

    Object.keys(inputs).forEach(key => {
        if (inputs[key] !== "" && !isNaN(inputs[key])) {
            inputs[key] = Number(inputs[key]);
        }
    });

    try {
        let result;
        let source;
        let response;

        try {
            response = await fetch(`${BACKEND_URL}/predict`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(inputs)
            });
        } catch (backendError) {
            console.warn(
                "Prediction API is unavailable; using the local heuristic demo:",
                backendError
            );
            result = generateFallbackPrediction(inputs);
            source = "fallback";
        }

        if (response) {
            if (!response.ok) {
                throw new Error(
                    `Prediction API returned HTTP ${response.status}.`
                );
            }

            result = await response.json();
            source = "model";
        }

        const percent = extractRiskPercentage(result);
        const contributions = result.contributions || [];

        displayResults(percent, contributions, inputs, source);

    } catch (error) {
        console.error("Prediction error:", error);

        alert(
            "Unable to calculate the risk assessment. " +
            "Please check your inputs and try again."
        );
    }
}


// ============================================================
// FALLBACK PREDICTION
// ============================================================

function generateFallbackPrediction(inputs) {
    let risk = 15;

    const age = Number(inputs.age) || 0;
    const trestbps = Number(inputs.trestbps) || 0;
    const chol = Number(inputs.chol) || 0;
    const thalach = Number(inputs.thalach) || 0;
    const oldpeak = Number(inputs.oldpeak) || 0;
    const cp = Number(inputs.cp) || 0;
    const exang = Number(inputs.exang) || 0;

    if (age >= 55) risk += 15;
    if (age >= 65) risk += 10;
    if (trestbps >= 140) risk += 10;
    if (chol >= 240) risk += 10;
    if (thalach > 0 && thalach < 120) risk += 10;
    if (oldpeak >= 2) risk += 15;
    if (cp >= 2) risk += 10;
    if (exang === 1) risk += 10;

    risk = Math.min(Math.max(risk, 1), 99);

    return {
        risk_percentage: risk,
        contributions: generateFallbackContributions(inputs)
    };
}


// ============================================================
// EXTRACT RISK PERCENTAGE
// ============================================================

function extractRiskPercentage(result) {
    let percent =
        result.risk_percentage ??
        result.risk_percent ??
        result.probability ??
        result.prediction_probability ??
        result.percentage ??
        result.risk ??
        0;

    percent = Number(percent);

    if (percent > 0 && percent <= 1) {
        percent *= 100;
    }

    return Math.min(Math.max(percent, 0), 100);
}


// ============================================================
// DISPLAY RESULTS
// ============================================================

function displayResults(percent, contributions, inputs, source) {
    const placeholder =
        document.getElementById("result-placeholder");

    const resultDisplay =
        document.getElementById("result-display");

    if (placeholder) {
        placeholder.classList.add("d-none");
    }

    if (resultDisplay) {
        resultDisplay.classList.remove("d-none");
    }

    const estimateSource = document.getElementById("estimate-source");
    if (estimateSource) {
        estimateSource.textContent = source === "model"
            ? "Source: trained model API"
            : "Source: local heuristic fallback — not a trained-model result";
        estimateSource.dataset.source = source;
    }

    const riskPercentage =
        document.getElementById("risk-percentage");

    if (riskPercentage) {
        riskPercentage.textContent = `${percent.toFixed(1)}%`;
    }

    const gaugeFill =
        document.getElementById("gauge-fill");

    if (gaugeFill) {
        gaugeFill.style.width = `${percent}%`;
    }

    const riskBadge =
        document.getElementById("risk-badge");

    const interpretationTitle =
        document.getElementById("interpretation-title");

    const interpretationText =
        document.getElementById("interpretation-text");

    if (percent < 30) {

        if (riskBadge) {
            riskBadge.textContent = "Lower estimate";
            riskBadge.className = "badge bg-success";
        }

        if (interpretationTitle) {
            interpretationTitle.textContent =
                "Lower Model Estimate";
            interpretationTitle.style.color = "";
        }

        if (interpretationText) {
            interpretationText.textContent =
                "This demo produced a lower model estimate. It cannot rule out heart disease or replace advice from a healthcare professional.";
        }

    } else if (percent < 60) {

        if (riskBadge) {
            riskBadge.textContent = "Moderate estimate";
            riskBadge.className =
                "badge bg-warning text-dark";
        }

        if (interpretationTitle) {
            interpretationTitle.textContent =
                "Moderate Model Estimate";
            interpretationTitle.style.color = "";
        }

        if (interpretationText) {
            interpretationText.textContent =
                "This demo produced a moderate model estimate. It is not a diagnosis; discuss health concerns with a healthcare professional.";
        }

    } else {

        if (riskBadge) {
            riskBadge.textContent = "Higher estimate";
            riskBadge.className = "badge bg-danger";
        }

        if (interpretationTitle) {
            interpretationTitle.textContent =
                "Higher Model Estimate";
            interpretationTitle.style.color = "";
        }

        if (interpretationText) {
            interpretationText.textContent =
                "This demo produced a higher model estimate. It is not a diagnosis; discuss health concerns with a healthcare professional.";
        }
    }

    renderContributionChart(contributions, source);

    saveAssessmentSession(percent, inputs);
}


// ============================================================
// CONTRIBUTION CHART
// ============================================================

function renderContributionChart(contributions, source) {
    const canvas = document.getElementById("featureChart");

    const note = document.getElementById("contribution-note");
    if (note) {
        note.textContent = source === "model"
            ? "Signed contributions show how each input moves the model score; they are not clinical explanations."
            : "Feature contributions are unavailable for the local heuristic estimate.";
    }

    if (!canvas || typeof Chart === "undefined") {
        return;
    }

    const ctx = canvas.getContext("2d");

    if (featureChart) {
        featureChart.destroy();
        featureChart = null;
    }

    if (source !== "model" || !Array.isArray(contributions) ||
        contributions.length === 0) {
        return;
    }

    const sortedContributions = contributions
        .map(item => {
            const name = item.feature || item.name || "Feature";
            const value = Number(item.contribution ?? item.value);
            return {
                label: FEATURE_LABELS[name] || name,
                value
            };
        })
        .filter(item => Number.isFinite(item.value))
        .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
        .slice(0, 10);

    const labels = sortedContributions.map(item => item.label);
    const values = sortedContributions.map(item => item.value);

    featureChart = new Chart(ctx, {
        type: "bar",

        data: {
            labels: labels,

            datasets: [
                {
                    label: "Contribution to model score",
                    data: values,
                    borderWidth: 1,
                    backgroundColor: values.map(value =>
                        value >= 0
                            ? "rgba(255, 51, 102, 0.7)"
                            : "rgba(0, 230, 118, 0.7)"
                    )
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    display: false
                }
            },

            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Contribution (log-odds)"
                    }
                }
            }
        }
    });
}


// ============================================================
// SAVE ASSESSMENT SESSION
// ============================================================

function saveAssessmentSession(percent, inputs) {
    const assessment = {
        timestamp: new Date().toISOString(),
        risk: percent,
        inputs: inputs
    };

    assessmentSessionHistory.push(assessment);

    updateAssessmentStats();
}


// ============================================================
// UPDATE DASHBOARD STATS
// ============================================================

function updateAssessmentStats() {
    const totalAssessments =
        document.getElementById("total-assessments");

    const alertsTriggered =
        document.getElementById("alerts-triggered");

    if (totalAssessments) {
        totalAssessments.textContent =
            assessmentSessionHistory.length;
    }

    if (alertsTriggered) {
        const alerts =
            assessmentSessionHistory.filter(
                assessment => assessment.risk >= 60
            ).length;

        alertsTriggered.textContent = alerts;
    }
}


// ============================================================
// IMPROVED RESET FUNCTION
// ============================================================

function resetForm() {

    const form =
        document.getElementById("risk-form");

    // Reset all form fields
    if (form) {
        form.reset();
    }

    // Show original placeholder
    const placeholder =
        document.getElementById("result-placeholder");

    if (placeholder) {
        placeholder.classList.remove("d-none");
    }

    // Hide previous result
    const resultDisplay =
        document.getElementById("result-display");

    if (resultDisplay) {
        resultDisplay.classList.add("d-none");
    }

    // Reset risk percentage
    const riskPercentage =
        document.getElementById("risk-percentage");

    if (riskPercentage) {
        riskPercentage.textContent = "0%";
    }

    // Reset gauge
    const gaugeFill =
        document.getElementById("gauge-fill");

    if (gaugeFill) {
        gaugeFill.style.width = "0%";
    }

    // Reset risk badge
    const riskBadge =
        document.getElementById("risk-badge");

    if (riskBadge) {
        riskBadge.textContent = "No Assessment";
        riskBadge.className = "badge";
    }

    // Reset interpretation title
    const interpretationTitle =
        document.getElementById("interpretation-title");

    if (interpretationTitle) {
        interpretationTitle.textContent = "Assessment";
        interpretationTitle.style.color = "";
    }

    // Reset interpretation text
    const interpretationText =
        document.getElementById("interpretation-text");

    if (interpretationText) {
        interpretationText.textContent =
            "Complete the assessment to view your results.";
    }

    // Destroy existing chart
    if (featureChart) {
        featureChart.destroy();
        featureChart = null;
    }

    console.log("Assessment form reset successfully.");
}


// ============================================================
// PRINT ASSESSMENT
// ============================================================

function printAssessment() {
    window.print();
}


// ============================================================
// CLEAR SESSION HISTORY
// ============================================================

function clearAssessmentHistory() {
    assessmentSessionHistory = [];

    updateAssessmentStats();

    console.log("Assessment history cleared.");
}
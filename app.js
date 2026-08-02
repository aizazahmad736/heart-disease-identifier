// CardioAI Application Logic & ML Inference Engine (FastAPI Integration)

const BACKEND_URL = "http://127.0.0.1:8000";
let isBackendConnected = false;

// Fallback Embedded Model Assets in case backend is offline
const FALLBACK_MODEL_ASSETS = {
    "features": [
        "age", "sex", "cp", "trestbps", "chol", "fbs", "restecg", "thalach", "exang", "oldpeak", "slope", "ca", "thal"
    ],
    "scaler": {
        "mean": [54.289256198347104, 0.6818181818181818, 0.9421487603305785, 131.70661157024793, 244.88429752066116, 0.14049586776859505, 0.5454545454545454, 150.12396694214877, 0.33884297520661155, 1.0719008264462808, 1.4132231404958677, 0.743801652892562, 2.3388429752066116],
        "scale": [9.134385146726768, 0.46577048936179993, 1.0065695006747153, 17.95726900188743, 47.748426495236316, 0.3475007610186551, 0.5300865358950273, 21.9324923110465, 0.4733163987859952, 1.2037629115359054, 0.6188421805462159, 1.0407318278586128, 0.6037584625728556]
    },
    "model": {
        "coefficients": [0.017735892695205913, -0.7140301567978149, 0.9377354404244738, -0.21143659187933428, -0.4592100577415901, -0.06364885983507007, 0.23547145007020662, 0.5396293104526309, -0.4758830163823865, -0.5948186666294085, 0.3078670529788832, -0.5592027955256134, -0.6215780683618346],
        "intercept": 0.1315952382058311
    },
    "metrics": {
        "accuracy": 0.8033,
        "precision": 0.7692,
        "recall": 0.9091,
        "f1": 0.8333,
        "auc": 0.869
    }
};

const CLINICAL_LABELS = {
    "age": "Age", "sex": "Sex", "cp": "Chest Pain Type", "trestbps": "Resting Blood Pressure",
    "chol": "Serum Cholesterol", "fbs": "Fasting Blood Sugar", "restecg": "Resting ECG Results",
    "thalach": "Max Heart Rate Achieved", "exang": "Exercise Induced Angina", "oldpeak": "ST Depression (Oldpeak)",
    "slope": "ST Segment Slope", "ca": "Number of Major Vessels", "thal": "Thalassemia Type"
};

const FEATURE_DESCRIPTIONS = {
    "age": "Age in years", "sex": "1 = Male; 0 = Female", "cp": "Chest pain type (0-3)",
    "trestbps": "Resting blood pressure (mm Hg)", "chol": "Serum cholesterol in mg/dl",
    "fbs": "Fasting blood sugar > 120 mg/dl (1 = true; 0 = false)", "restecg": "Resting electrocardiographic results",
    "thalach": "Maximum heart rate achieved", "exang": "Exercise induced angina (1 = yes; 0 = no)",
    "oldpeak": "ST depression induced by exercise relative to rest", "slope": "The slope of the peak exercise ST segment",
    "ca": "Number of major vessels (0-4) colored by fluoroscopy", "thal": "Thalassemia (1 = normal; 2 = fixed defect; 3 = reversable defect)"
};

let featureChart = null;
let assessmentSessionHistory = [];

document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();
    
    // Attempt connecting to the FastAPI backend
    checkBackendConnection();
    
    // Set up Navigation
    setupNavigation();
});

async function checkBackendConnection() {
    try {
        const response = await fetch(`${BACKEND_URL}/metrics`);
        if (response.ok) {
            const data = await response.json();
            isBackendConnected = true;
            updateStatusIndicator(true, `Connected to FastAPI`);
            updateModelMetrics(data.metrics);
            populateCoefficientsTable(data.features, FALLBACK_MODEL_ASSETS.model.coefficients);
        } else {
            throw new Error();
        }
    } catch (e) {
        isBackendConnected = false;
        updateStatusIndicator(false, `Offline (Using Local Fallback)`);
        updateModelMetrics(FALLBACK_MODEL_ASSETS.metrics);
        populateCoefficientsTable(FALLBACK_MODEL_ASSETS.features, FALLBACK_MODEL_ASSETS.model.coefficients);
    }
}

function updateStatusIndicator(connected, text) {
    const el = document.querySelector(".status-indicator");
    if (connected) {
        el.style.backgroundColor = "rgba(0, 230, 118, 0.05)";
        el.style.borderColor = "rgba(0, 230, 118, 0.15)";
        el.style.color = "var(--success)";
        el.innerHTML = `<i data-lucide="shield-check"></i> <span>${text}</span>`;
    } else {
        el.style.backgroundColor = "rgba(255, 23, 68, 0.05)";
        el.style.borderColor = "rgba(255, 23, 68, 0.15)";
        el.style.color = "var(--danger)";
        el.innerHTML = `<i data-lucide="alert-octagon"></i> <span>${text}</span>`;
    }
    lucide.createIcons();
}

function updateModelMetrics(metrics) {
    document.getElementById("acc-metric").innerText = (metrics.accuracy * 100).toFixed(1);
    document.getElementById("accuracy-display").innerText = (metrics.accuracy * 100).toFixed(1) + "%";
    
    document.getElementById("metric-acc").innerText = (metrics.accuracy * 100).toFixed(1) + "%";
    document.getElementById("metric-auc").innerText = metrics.auc.toFixed(3);
    document.getElementById("metric-precision").innerText = (metrics.precision * 100).toFixed(1) + "%";
    document.getElementById("metric-recall").innerText = (metrics.recall * 100).toFixed(1) + "%";
}

function setupNavigation() {
    const links = [
        { btn: document.getElementById("nav-dash"), tab: "dashboard" },
        { btn: document.getElementById("nav-assess"), tab: "assessment" },
        { btn: document.getElementById("nav-info"), tab: "about" }
    ];
    links.forEach(item => {
        item.btn.addEventListener("click", (e) => {
            e.preventDefault();
            switchTab(item.tab);
        });
    });
}

function switchTab(tabName) {
    document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(item => item.classList.remove("active"));
    
    if (tabName === "dashboard") {
        document.getElementById("nav-dash").classList.add("active");
        document.getElementById("dashboard-tab").classList.add("active");
    } else if (tabName === "assessment") {
        document.getElementById("nav-assess").classList.add("active");
        document.getElementById("assessment-tab").classList.add("active");
    } else if (tabName === "about") {
        document.getElementById("nav-info").classList.add("active");
        document.getElementById("about-tab").classList.add("active");
    }
}

function populateCoefficientsTable(features, coefficients) {
    const tbody = document.getElementById("coefficients-table-body");
    tbody.innerHTML = "";
    
    features.forEach((feature, index) => {
        const coeff = coefficients[index];
        const isPositive = coeff >= 0;
        const row = document.createElement("tr");
        
        row.innerHTML = `
            <td style="font-weight: 600;">${CLINICAL_LABELS[feature]}</td>
            <td><code>${feature}</code></td>
            <td>${FEATURE_DESCRIPTIONS[feature]}</td>
            <td>
                <span class="coeff-badge ${isPositive ? 'positive' : 'negative'}">
                    ${isPositive ? '+' : ''}${coeff.toFixed(4)}
                </span>
            </td>
            <td>
                <span style="color: ${isPositive ? 'var(--danger)' : 'var(--success)'}; font-weight: 500;">
                    ${isPositive ? 'Increases Risk' : 'Decreases Risk'}
                </span>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function calculateRisk(e) {
    e.preventDefault();
    
    const inputs = {
        age: parseFloat(document.getElementById("age").value),
        sex: parseFloat(document.getElementById("sex").value),
        cp: parseFloat(document.getElementById("cp").value),
        trestbps: parseFloat(document.getElementById("trestbps").value),
        chol: parseFloat(document.getElementById("chol").value),
        fbs: parseFloat(document.getElementById("fbs").value),
        restecg: parseFloat(document.getElementById("restecg").value),
        thalach: parseFloat(document.getElementById("thalach").value),
        exang: parseFloat(document.getElementById("exang").value),
        oldpeak: parseFloat(document.getElementById("oldpeak").value),
        slope: parseFloat(document.getElementById("slope").value),
        ca: parseFloat(document.getElementById("ca").value),
        thal: parseFloat(document.getElementById("thal").value)
    };

    if (isBackendConnected) {
        try {
            const response = await fetch(`${BACKEND_URL}/predict`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(inputs)
            });
            if (response.ok) {
                const result = await response.json();
                displayResults(result.percentage, result.contributions, inputs);
                return;
            }
        } catch (e) {
            console.error("FastAPI prediction failed, falling back to local computation:", e);
        }
    }
    
    // Local Fallback calculation
    calculateLocalFallback(inputs);
}

function calculateLocalFallback(inputs) {
    let logit = FALLBACK_MODEL_ASSETS.model.intercept;
    const contributions = [];

    FALLBACK_MODEL_ASSETS.features.forEach((feat, idx) => {
        const rawVal = inputs[feat];
        const mean = FALLBACK_MODEL_ASSETS.scaler.mean[idx];
        const scale = FALLBACK_MODEL_ASSETS.scaler.scale[idx];
        const coeff = FALLBACK_MODEL_ASSETS.model.coefficients[idx];
        
        const normalized = (rawVal - mean) / scale;
        const contribution = normalized * coeff;
        logit += contribution;
        
        contributions.push({
            name: CLINICAL_LABELS[feat],
            value: contribution
        });
    });

    const probability = 1 / (1 + Math.exp(-logit));
    const percent = probability * 100;
    
    displayResults(percent, contributions, inputs);
}

function displayResults(percent, contributions, inputs) {
    document.getElementById("result-placeholder").classList.add("d-none");
    const display = document.getElementById("result-display");
    display.classList.remove("d-none");

    document.getElementById("risk-percentage").innerText = percent.toFixed(1) + "%";
    
    const fill = document.getElementById("gauge-fill");
    fill.style.width = percent + "%";
    
    const badge = document.getElementById("risk-badge");
    const interpTitle = document.getElementById("interpretation-title");
    const interpText = document.getElementById("interpretation-text");
    
    badge.className = "badge";
    
    if (percent < 30) {
        badge.classList.add("low");
        badge.innerText = "Low Risk";
        interpTitle.innerText = "Low Risk Profile";
        interpTitle.style.color = "var(--success)";
        interpText.innerText = "Clinical parameters demonstrate a low probability profile. Routine preventive maintenance and cardiac checks are advised.";
    } else if (percent >= 30 && percent < 70) {
        badge.classList.add("moderate");
        badge.innerText = "Moderate Risk";
        interpTitle.innerText = "Moderate Risk Profile";
        interpTitle.style.color = "var(--warning)";
        interpText.innerText = "Moderate probability of coronary artery disease. Consider lifestyle changes and consulting a physician for preventive advice.";
    } else {
        badge.classList.add("high");
        badge.innerText = "High Risk";
        interpTitle.innerText = "High Risk Profile";
        interpTitle.style.color = "var(--danger)";
        interpText.innerText = "Model calculates high risk probability. Cardiology consultation, resting ECG review, and further diagnostic screening are highly recommended.";
    }

    const sortedCont = [...contributions].sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 6);
    renderContributionChart(sortedCont);
    saveAssessmentToSession(percent, inputs);
}

function renderContributionChart(contributions) {
    const ctx = document.getElementById('featureChart').getContext('2d');
    
    if (featureChart) {
        featureChart.destroy();
    }

    const labels = contributions.map(c => c.name);
    const data = contributions.map(c => c.value);
    const colors = data.map(v => v >= 0 ? 'rgba(255, 23, 68, 0.7)' : 'rgba(0, 230, 118, 0.7)');
    const borders = data.map(v => v >= 0 ? '#ff1744' : '#00e676');

    featureChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Risk Contribution',
                data: data,
                backgroundColor: colors,
                borderColor: borders,
                borderWidth: 1.5,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#a0aec0' }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: '#f8f9fa' }
                }
            }
        }
    });
}

function saveAssessmentToSession(percent, inputs) {
    const item = {
        id: assessmentSessionHistory.length + 1,
        age: inputs.age,
        sex: inputs.sex === 1 ? 'M' : 'F',
        risk: percent,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    assessmentSessionHistory.unshift(item);
    
    document.getElementById("total-assessments").innerText = assessmentSessionHistory.length;
    
    const highRiskCount = assessmentSessionHistory.filter(i => i.risk >= 70).length;
    document.getElementById("alerts-triggered").innerText = highRiskCount;
    
    const container = document.getElementById("recent-list");
    container.innerHTML = "";
    
    assessmentSessionHistory.forEach(history => {
        let riskColor = "var(--success)";
        if (history.risk >= 30 && history.risk < 70) {
            riskColor = "var(--warning)";
        } else if (history.risk >= 70) {
            riskColor = "var(--danger)";
        }

        const div = document.createElement("div");
        div.className = "recent-item";
        div.innerHTML = `
            <div class="recent-patient">
                <span class="recent-patient-title">Assessment #Ref:${history.id} (${history.age}y/o ${history.sex})</span>
                <span class="recent-patient-meta">Completed at ${history.time}</span>
            </div>
            <span class="recent-risk-val" style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); color: ${riskColor};">
                ${history.risk.toFixed(0)}%
            </span>
        `;
        container.appendChild(div);
    });
}

function resetForm() {
    document.getElementById("risk-form").reset();
    document.getElementById("result-placeholder").classList.remove("d-none");
    document.getElementById("result-display").classList.add("d-none");
}

function printAssessment() {
    window.print();
}

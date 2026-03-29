const API_URL = "http://127.0.0.1:5000";

let medicines = [];
let chartInstance = null;

// =========================
// Fetch all medicines
// =========================
async function fetchMedicines() {
  try {
    const res = await fetch(`${API_URL}/medicines`);
    medicines = await res.json();

    updateDashboard();
    renderMedicines();

    fetchLowStockPredictions();   // ✅ Added
    fetchTopUsedMedicines();      // ✅ Already there
  } catch (error) {
    console.error("Error fetching medicines:", error);
    alert("Could not load medicines from backend");
  }
}

// =========================
// Update Dashboard Cards
// =========================
function updateDashboard() {
  let totalMeds = medicines.length;
  let totalStock = medicines.reduce((sum, m) => sum + m.qty, 0);
  let lowStock = medicines.filter(m => m.qty <= 3).length;

  let today = new Date();
  let expSoon = medicines.filter(m => {
    let expDate = new Date(m.expiry);
    let diffDays = (expDate - today) / (1000 * 60 * 60 * 24);
    return diffDays <= 7 && diffDays >= 0;
  }).length;

  document.getElementById("totalMeds").textContent = totalMeds;
  document.getElementById("totalStock").textContent = totalStock;
  document.getElementById("lowStock").textContent = lowStock;
  document.getElementById("expiringSoon").textContent = expSoon;
}

// =========================
// Render Medicines
// =========================
function renderMedicines() {
  let grid = document.getElementById("medicineGrid");
  grid.innerHTML = "";

  let today = new Date();

  medicines.forEach((m) => {
    let warning = "";

    if (m.qty <= 3) warning += `<p class="low-stock">⚠ Low Stock</p>`;

    let expDate = new Date(m.expiry);
    let diffDays = (expDate - today) / (1000 * 60 * 60 * 24);

    if (diffDays < 0) warning += `<p class="expired">⛔ Expired</p>`;
    else if (diffDays <= 7) warning += `<p class="expiring">⚠ Expiring Soon</p>`;

    grid.innerHTML += `
      <div class="medicine-card">
        <h3>${m.name}</h3>
        <p><b>Expiry:</b> ${m.expiry}</p>

        <div class="qty-box">
          <p class="qty">Qty: ${m.qty}</p>

          <div class="btns">
            <button class="minus" onclick="decreaseQty(${m.id}, ${m.qty})">-</button>
            <button class="plus" onclick="increaseQty(${m.id}, ${m.qty})">+</button>
          </div>
        </div>

        ${warning}

        <button style="background:#e74c3c;" onclick="deleteMedicine(${m.id})">Delete</button>
      </div>
    `;
  });
}

// =========================
// Add Medicine
// =========================
async function addMedicine() {
  let name = document.getElementById("medName").value.trim();
  let qty = parseInt(document.getElementById("medQty").value);
  let expiry = document.getElementById("medExpiry").value;

  if (!name || isNaN(qty) || qty <= 0 || !expiry) {
    alert("Please fill all medicine details correctly!");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/medicines`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, qty, expiry })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to add medicine");
      return;
    }

    alert("Medicine added successfully ✅");

    document.getElementById("medName").value = "";
    document.getElementById("medQty").value = "";
    document.getElementById("medExpiry").value = "";

    fetchMedicines();
  } catch (error) {
    console.error("Error adding medicine:", error);
    alert("Error connecting to backend");
  }
}

// =========================
// Increase Quantity
// =========================
async function increaseQty(id, currentQty) {
  try {
    await fetch(`${API_URL}/medicines/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ qty: currentQty + 1 })
    });

    fetchMedicines();
  } catch (error) {
    console.error("Error increasing quantity:", error);
  }
}

// =========================
// Decrease Quantity
// =========================
async function decreaseQty(id, currentQty) {
  if (currentQty <= 0) return;

  try {
    await fetch(`${API_URL}/medicines/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ qty: currentQty - 1 })
    });

    fetchMedicines();
  } catch (error) {
    console.error("Error decreasing quantity:", error);
  }
}

// =========================
// Delete Medicine
// =========================
async function deleteMedicine(id) {
  if (!confirm("Are you sure you want to delete this medicine?")) return;

  try {
    await fetch(`${API_URL}/medicines/${id}`, {
      method: "DELETE"
    });

    fetchMedicines();
  } catch (error) {
    console.error("Error deleting medicine:", error);
  }
}

// =========================
// Fetch Low Stock Predictions
// =========================
async function fetchLowStockPredictions() {
  try {
    const res = await fetch(`${API_URL}/api/low-stock-predictions`);
    const data = await res.json();

    console.log("AI Restock Insights:", data);
    renderPredictions(data);
  } catch (error) {
    console.error("Error fetching AI restock insights:", error);
  }
}

// =========================
// Render Low Stock Predictions
// =========================
function renderPredictions(data) {
  const grid = document.getElementById("predictionGrid");

  if (!grid) {
    console.error("predictionGrid not found in HTML");
    return;
  }

  grid.innerHTML = "";

  if (!data || data.length === 0) {
    grid.innerHTML = `<p>No prediction data available.</p>`;
    return;
  }

  data.forEach((item) => {
    let priorityClass = "neutral-status";

    if (item.priority === "Urgent") priorityClass = "critical-status";
    else if (item.priority === "Soon") priorityClass = "warning-status";
    else if (item.priority === "Safe") priorityClass = "safe-status";

    grid.innerHTML += `
      <div class="medicine-card">
        <h3>${item.medicine_name}</h3>
        <p><b>Current Stock:</b> ${item.current_stock}</p>
        <p><b>Total Issued:</b> ${item.total_issued}</p>
        <p><b>Active Days:</b> ${item.active_days}</p>
        <p><b>Avg Daily Usage:</b> ${item.avg_daily_usage ?? "N/A"}</p>
        <p><b>Days Left:</b> ${item.predicted_days_left ?? "N/A"}</p>
        <p><b>Priority:</b> <span class="${priorityClass}">${item.priority}</span></p>
      </div>
    `;
  });
}

// =========================
// Fetch Top Used Medicines
// =========================
async function fetchTopUsedMedicines() {
  try {
    const res = await fetch(`${API_URL}/top-used-medicines`);
    const data = await res.json();

    renderUsageChart(data);
  } catch (error) {
    console.error("Error fetching top used medicines:", error);
  }
}

// =========================
// Render Top Used Medicines Chart
// =========================
function renderUsageChart(data) {
  const ctx = document.getElementById("usageChart").getContext("2d");

  if (chartInstance) {
    chartInstance.destroy();
  }

  if (!data || data.length === 0) {
    chartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["No Data"],
        datasets: [{
          label: "Total Issued",
          data: [0],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
    return;
  }

  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.map(item => item.medicine),
      datasets: [{
        label: "Total Issued",
        data: data.map(item => item.total_used),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// =========================
// Start
// =========================
fetchMedicines();


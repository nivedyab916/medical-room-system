const API_URL = "http://127.0.0.1:5000";

let students = [];
let medicines = [];

const studentSelect = document.getElementById("studentSelect");
const medicineSelect = document.getElementById("medicineSelect");
const studentInfo = document.getElementById("studentInfo");

// =====================
// Fetch Data
// =====================
async function fetchData() {
  try {
    let sRes = await fetch(`${API_URL}/students`);
    students = await sRes.json();

    let mRes = await fetch(`${API_URL}/medicines`);
    medicines = await mRes.json();

    loadDropdowns();
    renderMedicines();
  } catch (err) {
    console.error(err);
    alert("Error loading data from backend");
  }
}

// =====================
// Load Dropdowns
// =====================
function loadDropdowns() {
  // -------- STUDENTS --------
  studentSelect.innerHTML = `<option value="">-- Select Student --</option>`;

  students.forEach((s) => {
    let opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = `${s.name} (${s.roll})`;
    studentSelect.appendChild(opt);
  });

  // -------- MEDICINES --------
  medicineSelect.innerHTML = `<option value="">-- Select Medicine --</option>`;

  medicines.forEach((m) => {
    let opt = document.createElement("option");
    opt.value = m.id;
    opt.textContent = `${m.name} (Stock: ${m.qty})`;
    medicineSelect.appendChild(opt);
  });

  studentInfo.textContent = ""; // clear info initially
}

// =====================
// Show Student Info
// =====================
function showStudentInfo() {
  let id = studentSelect.value;

  if (!id) {
    studentInfo.textContent = "";
    return;
  }

  let s = students.find(st => st.id == id);

  if (s) {
    studentInfo.textContent =
      `Selected: ${s.name}, Roll: ${s.roll}, Room: ${s.room}, Phone: ${s.phone}`;
  }
}

// =====================
// Render Medicines
// =====================
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
        <p>Qty: ${m.qty}</p>
        ${warning}
      </div>
    `;
  });
}

// =====================
// Issue Medicine
// =====================
async function issueMedicine() {
  let student_id = studentSelect.value;
  let medicine_id = medicineSelect.value;


  if (!student_id || !medicine_id) {
    alert("Please select student and medicine!");
    return;
  }
  let qty = parseInt(document.getElementById("issueQty").value);
  let reason = document.getElementById("reason").value.trim();

  if (!qty || qty <= 0 || !reason) {
    alert("Enter valid quantity and reason!");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/issue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        student_id,
        medicine_id,
        qty,
        reason,
        date: new Date().toISOString()
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    alert("Medicine Issued Successfully ✅");

    document.getElementById("issueQty").value = "";
    document.getElementById("reason").value = "";

    fetchData(); // refresh UI
  } catch (err) {
    console.error(err);
    alert("Error issuing medicine");
  }
}

// =====================
// Start
// =====================
fetchData();
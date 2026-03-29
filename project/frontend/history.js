const API_URL = "http://127.0.0.1:5000";

let historyData = [];

// =====================
// Fetch History
// =====================
async function fetchHistory() {
  try {
    const res = await fetch(`${API_URL}/history`);
    historyData = await res.json();

    renderHistory();
  } catch (error) {
    console.error("Error fetching history:", error);
    alert("Failed to load history");
  }
}

// =====================
// Render History Table
// =====================
function renderHistory() {
  let table = document.getElementById("historyTable");
  table.innerHTML = "";

  historyData.forEach((h) => {
    table.innerHTML += `
      <tr>
        <td>${h.student_name}</td>
        <td>${h.roll}</td>
        <td>${h.room}</td>
        <td>${h.medicine}</td>
        <td>${h.qty}</td>
        <td>${h.reason}</td>
        <td>${new Date(h.date).toLocaleString()}</td>
      </tr>
    `;
  });
}

function exportCSV() {

  if (!historyData || historyData.length === 0) {
    alert("No history available to export!");
    return;
  }

  // get search value
  let search = document.getElementById("searchHistory").value.toLowerCase();

  // apply same filter as table
  let filtered = historyData.filter(h =>
    h.student_name.toLowerCase().includes(search) ||
    h.roll.toLowerCase().includes(search) ||
    h.medicine.toLowerCase().includes(search)
  );

  if (filtered.length === 0) {
    alert("No matching records to export!");
    return;
  }

  // create CSV
  let csv = "Student,Roll,Room,Medicine,Quantity,Reason,Date\n";

  filtered.forEach(h => {
    csv += `${h.student_name},${h.roll},${h.room},${h.medicine},${h.qty},${h.reason},${h.date}\n`;
  });

  // download file
  let blob = new Blob([csv], { type: "text/csv" });
  let url = URL.createObjectURL(blob);

  let a = document.createElement("a");
  a.href = url;
  a.download = "filtered_history.csv";
  a.click();

  URL.revokeObjectURL(url);
}

// =====================
// Search Function
// =====================
function searchHistory() {
  let search = document.getElementById("searchHistory").value.toLowerCase();

  let filtered = historyData.filter(h =>
    h.student_name.toLowerCase().includes(search) ||
    h.roll.toLowerCase().includes(search) ||
    h.medicine.toLowerCase().includes(search)
  );

  let table = document.getElementById("historyTable");
  table.innerHTML = "";

  filtered.forEach((h) => {
    table.innerHTML += `
      <tr>
        <td>${h.student_name}</td>
        <td>${h.roll}</td>
        <td>${h.room}</td>
        <td>${h.medicine}</td>
        <td>${h.qty}</td>
        <td>${h.reason}</td>
        <td>${new Date(h.date).toLocaleString()}</td>
      </tr>
    `;
  });
}

// =====================
// Start
// =====================
fetchHistory();
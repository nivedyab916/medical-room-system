const API_BASE = "http://127.0.0.1:5000";

let students = [];

// Load students from backend
async function loadStudents() {
  try {
    const res = await fetch(`${API_BASE}/students`);
    students = await res.json();
    renderStudents();
  } catch (error) {
    console.error("Error loading students:", error);
    alert("Failed to load students from backend!");
  }
}

// Add student to backend
async function addStudent() {
  let name = document.getElementById("sName").value.trim();
  let roll = document.getElementById("sRoll").value.trim();
  let room = document.getElementById("sRoom").value.trim();
  let phone = document.getElementById("sPhone").value.trim();

  if (!name || !roll || !room || !phone) {
    alert("Please fill all student details!");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/students`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, roll, room, phone })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to add student!");
      return;
    }

    document.getElementById("sName").value = "";
    document.getElementById("sRoll").value = "";
    document.getElementById("sRoom").value = "";
    document.getElementById("sPhone").value = "";

    loadStudents();
    alert("Student added successfully ✅");
  } catch (error) {
    console.error("Error adding student:", error);
    alert("Backend connection failed!");
  }
}

// Delete student from backend
async function deleteStudent(id) {
  if (!confirm("Delete this student?")) return;

  try {
    const res = await fetch(`${API_BASE}/students/${id}`, {
      method: "DELETE"
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to delete student!");
      return;
    }

    loadStudents();
    alert("Student deleted successfully 🗑️");
  } catch (error) {
    console.error("Error deleting student:", error);
    alert("Backend connection failed!");
  }
}

// Render students in table
function renderStudents() {
  let search = document.getElementById("searchStudent").value.toLowerCase();
  let table = document.getElementById("studentTable");
  table.innerHTML = "";

  let filtered = students.filter(s =>
    s.name.toLowerCase().includes(search) ||
    s.roll.toLowerCase().includes(search)
  );

  if (filtered.length === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="5" style="padding:15px; font-weight:bold; color:red;">
          No Students Found
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach((s) => {
    table.innerHTML += `
      <tr>
        <td>${s.name}</td>
        <td>${s.roll}</td>
        <td>${s.room}</td>
        <td>${s.phone}</td>
        <td><button onclick="deleteStudent(${s.id})">Delete</button></td>
      </tr>
    `;
  });
}

// Load students when page opens
document.addEventListener("DOMContentLoaded", () => {
  loadStudents();

  document
    .getElementById("searchStudent")
    .addEventListener("input", renderStudents);
});
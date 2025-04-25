// ========== Admin Login ==========
function adminLogin(event) {
  event.preventDefault();
  const username = document.getElementById("admin-username").value;
  const password = document.getElementById("admin-password").value;

  if (username === "admin" && password === "admin123") {
    alert("Login successful!");
    window.location.href = "admin_dashboard.html";
  } else {
    alert("Invalid credentials!");
  }
}

// ========== Create Staff ==========
function createStaff(event) {
  event.preventDefault();

  const username = document.getElementById("staff-username").value;
  const password = document.getElementById("staff-password").value;
  const year = document.getElementById("staff-year").value.trim();
  const section = document.getElementById("staff-section").value.trim();

  if (!username || !password || !year || !section) {
    alert("Please fill in all fields.");
    return;
  }

  const staffList = JSON.parse(localStorage.getItem("staffList")) || [];
  if (staffList.some(staff => staff.username === username)) {
    alert("Staff username already exists!");
    return;
  }

  const staff = { username, password, year, section };
  staffList.push(staff);
  localStorage.setItem("staffList", JSON.stringify(staffList));

  const table = document.getElementById("staff-list")?.getElementsByTagName("tbody")[0];
  if (table) {
    const row = table.insertRow();
    row.innerHTML = `<td>${username}</td><td>${year}</td><td>${section}</td>`;
  }

  alert("Staff created successfully!");
}

// ========== Staff Login ==========
function staffLogin(event) {
  event.preventDefault();

  const username = document.getElementById("staff-username").value;
  const password = document.getElementById("staff-password").value;

  const staffList = JSON.parse(localStorage.getItem("staffList")) || [];
  const staff = staffList.find(s => s.username === username && s.password === password);

  if (staff) {
    localStorage.setItem("currentStaff", JSON.stringify(staff));
    window.location.href = "staff_dashboard.html";
  } else {
    alert("Invalid username or password. Please try again.");
  }
}

// ========== Load Staff Dashboard ==========
document.addEventListener("DOMContentLoaded", () => {
  const currentStaff = JSON.parse(localStorage.getItem("currentStaff"));
  if (!currentStaff) {
    alert("Please log in first.");
    window.location.href = "staff_login.html";
  } else {
    document.getElementById("staff-username").innerText = currentStaff.username;
    document.getElementById("staff-year-name").innerText = currentStaff.year;
    document.getElementById("staff-section-name").innerText = currentStaff.section;

    const selectedDate = document.getElementById("attendance-date")?.value || "";
    loadAttendance(currentStaff.year, currentStaff.section, selectedDate);
  }
});

// ========== Render Attendance Table ==========
function renderAttendanceTable(students) {
  const tbody = document.querySelector("#attendanceTable tbody");
  tbody.innerHTML = "";

  students.forEach(student => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${student.RollNo}</td>
      <td>${student.Name}</td>
      ${[...Array(7)].map(() => `<td class="present" onclick="toggleStatus(this)">Present</td>`).join("")}
    `;
    tbody.appendChild(row);
  });

  saveAttendanceToLocal(); // Save the default "Present" status to localStorage
}

// ========== Toggle Attendance Status ==========
function toggleStatus(cell) {
  if (cell.classList.contains("present")) {
    cell.classList.remove("present");
    cell.classList.add("absent");
    cell.textContent = "Absent";
  } else {
    cell.classList.remove("absent");
    cell.classList.add("present");
    cell.textContent = "Present";
  }

  saveAttendanceToLocal(); // Save data after toggling
}

// ========== Save Attendance to LocalStorage ==========
function saveAttendanceToLocal() {
  const rows = document.querySelectorAll("#attendanceTable tbody tr");
  const attendance = [];

  rows.forEach(row => {
    const cols = row.querySelectorAll("td");
    const student = {
      RollNo: cols[0].textContent,
      Name: cols[1].textContent,
      Periods: []
    };

    for (let i = 2; i < cols.length; i++) {
      student.Periods.push(cols[i].classList.contains("present") ? "Present" : "Absent");
    }

    attendance.push(student);
  });

  localStorage.setItem("markedAttendance", JSON.stringify(attendance));
}

// ========== Upload Student List ==========
function uploadStudentData(event) {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    if (!jsonData.length || !jsonData[0].RollNo || !jsonData[0].Name) {
      alert("Excel must have 'RollNo' and 'Name' columns!");
      return;
    }

    localStorage.setItem("studentList", JSON.stringify(jsonData)); // Save to localStorage
    renderAttendanceTable(jsonData);
  };

  reader.readAsArrayBuffer(file);
}

// ========== Download Attendance ==========
function downloadAttendance() {
  alert("Download functionality is not implemented yet.");
}

// ========== Load Attendance ==========
function loadAttendance(year, section, selectedDate = "") {
  const studentsKey = `students_${year}_${section}`;
  const studentList = JSON.parse(localStorage.getItem(studentsKey)) || [];

  const attendanceKey = selectedDate ? `attendance_${year}_${section}_${selectedDate}` : "";
  const attendanceData = selectedDate ? JSON.parse(localStorage.getItem(attendanceKey)) || {} : {};

  const table = document.getElementById("attendance-table").getElementsByTagName("tbody")[0];
  table.innerHTML = "";

  studentList.forEach((student, index) => {
    const row = table.insertRow();
    row.innerHTML = `
      <td>${student.RollNumber}</td>
      <td>${student.Name}</td>
      ${generateAttendanceCells(student.RollNumber, attendanceData)}
    `;
  });

  // Save attendance data to localStorage whenever the table is loaded
  const saveButton = document.getElementById("save-attendance");
  if (saveButton) {
    saveButton.onclick = () => {
      const rows = table.getElementsByTagName("tr");
      const updatedAttendance = {};

      Array.from(rows).forEach(row => {
        const rollNumber = row.cells[0].textContent;
        updatedAttendance[rollNumber] = {};

        for (let i = 2; i < row.cells.length; i++) {
          const select = row.cells[i].querySelector("select");
          if (select) {
            updatedAttendance[rollNumber][`period${i - 1}`] = select.value;
          }
        }
      });

      if (selectedDate) {
        localStorage.setItem(attendanceKey, JSON.stringify(updatedAttendance));
        alert("Attendance saved successfully!");
      } else {
        alert("Please select a date to save attendance.");
      }
    };
  }
}

// ========== Generate Attendance Cells ==========
function generateAttendanceCells(rollNumber, attendanceData) {
  let cells = "";
  for (let i = 1; i <= 7; i++) {
    const key = `period${i}`;
    const status = attendanceData[rollNumber]?.[key] || "Present"; // Default to Present
    cells += `
      <td>
        <select id="attendance-${rollNumber}-${i}">
          <option value="Present" ${status === "Present" ? "selected" : ""}>Present</option>
          <option value="Absent" ${status === "Absent" ? "selected" : ""}>Absent</option>
        </select>
      </td>
    `;
  }
  return cells;
}
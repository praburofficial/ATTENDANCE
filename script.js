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
}

// ========== Generate Period Cells ==========
function generateAttendanceCells(rollNumber, attendanceData) {
  let cells = "";
  for (let i = 1; i <= 7; i++) {
    const key = `period${i}`;
    const status = attendanceData[rollNumber]?.[key] || "Absent";
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

// ========== Save Attendance ==========
function saveAttendance() {
  const currentStaff = JSON.parse(localStorage.getItem("currentStaff"));
  const year = currentStaff.year;
  const section = currentStaff.section;
  const selectedDate = document.getElementById("attendance-date").value;

  const studentsKey = `students_${year}_${section}`;
  const studentList = JSON.parse(localStorage.getItem(studentsKey)) || [];

  const attendanceData = {};
  studentList.forEach(student => {
    const periods = {};
    for (let i = 1; i <= 7; i++) {
      const status = document.getElementById(`attendance-${student.RollNumber}-${i}`).value;
      periods[`period${i}`] = status;
    }
    attendanceData[student.RollNumber] = periods;
  });

  const attendanceKey = `attendance_${year}_${section}_${selectedDate}`;
  localStorage.setItem(attendanceKey, JSON.stringify(attendanceData));
  alert("Attendance saved successfully!");
}

// ========== Load Attendance for Selected Date ==========
function loadAttendance(year, section, selectedDate = "") {
  const studentsKey = `students_${year}_${section}`;
  const studentList = JSON.parse(localStorage.getItem(studentsKey)) || [];

  const attendanceKey = `attendance_${year}_${section}_${selectedDate}`;
  const attendanceData = JSON.parse(localStorage.getItem(attendanceKey)) || {};

  const table = document.getElementById("attendance-table").getElementsByTagName("tbody")[0];
  table.innerHTML = "";

  studentList.forEach((student) => {
    const row = table.insertRow();
    row.innerHTML = `
      <td>${student.RollNumber}</td>
      <td>${student.Name}</td>
      ${generateAttendanceCells(student.RollNumber, attendanceData)}
    `;
  });
}

// ========== Upload Student List from Excel ==========
function handleStudentUpload() {
  const fileInput = document.getElementById("excel-file");
  const file = fileInput.files[0];

  if (!file) {
    alert("Please select an Excel file.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const studentList = XLSX.utils.sheet_to_json(sheet);

    const currentStaff = JSON.parse(localStorage.getItem("currentStaff"));
    if (!currentStaff) {
      alert("Staff not logged in.");
      return;
    }

    const key = `students_${currentStaff.year}_${currentStaff.section}`;
    localStorage.setItem(key, JSON.stringify(studentList));
    alert("Student list uploaded successfully!");

    const selectedDate = document.getElementById("attendance-date")?.value;
    if (selectedDate) {
      loadAttendance(currentStaff.year, currentStaff.section, selectedDate);
    }
  };

  reader.readAsArrayBuffer(file);
}

// ========== Download Attendance Report ==========
function downloadAttendanceReport() {
  const currentStaff = JSON.parse(localStorage.getItem("currentStaff"));
  const year = currentStaff.year;
  const section = currentStaff.section;
  const selectedDate = document.getElementById("attendance-date").value;

  const studentsKey = `students_${year}_${section}`;
  const studentList = JSON.parse(localStorage.getItem(studentsKey)) || [];

  const attendanceKey = `attendance_${year}_${section}_${selectedDate}`;
  const attendanceData = JSON.parse(localStorage.getItem(attendanceKey)) || {};

  const reportData = studentList.map(student => {
    const row = { RollNumber: student.RollNumber, Name: student.Name };
    for (let i = 1; i <= 7; i++) {
      row[`Period ${i}`] = attendanceData[student.RollNumber]?.[`period${i}`] || "Absent";
    }
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(reportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Attendance");
  XLSX.writeFile(wb, `Attendance_Report_${year}_${section}_${selectedDate}.xlsx`);
}

// ========== Manual Toggle Mode (Optional UI Alternate) ==========
function renderAttendanceTable(students) {
  const tbody = document.querySelector("#attendance-table tbody");
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
}

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
}
function generateAttendanceCells(rollNumber, attendanceData) {
  let attendanceCells = "";
  for (let i = 1; i <= 7; i++) {
    const periodKey = `period${i}`;
    const status = attendanceData[rollNumber]?.[periodKey] || "Present"; // Default to Present
    attendanceCells += `
      <td>
        <select id="attendance-${rollNumber}-${i}">
          <option value="Present" ${status === "Present" ? "selected" : ""}>Present</option>
          <option value="Absent" ${status === "Absent" ? "selected" : ""}>Absent</option>
        </select>
      </td>
    `;
  }
  return attendanceCells;
}
function saveAttendance() {
  const year = localStorage.getItem("staffYear");
  const section = localStorage.getItem("staffSection");
  const selectedDate = document.getElementById("attendance-date").value;
  const dayOrder = document.getElementById("day-order").value;

  const attendanceKey = `attendance_${year}_${section}_${selectedDate}`;
  const attendanceData = {};

  const rows = document.querySelectorAll("#attendance-table tbody tr");
  rows.forEach((row) => {
    const rollNumber = row.cells[0].textContent;
    attendanceData[rollNumber] = {};

    for (let i = 1; i <= 7; i++) {
      const select = document.getElementById(`attendance-${rollNumber}-${i}`);
      attendanceData[rollNumber][`period${i}`] = select.value;
    }
  });

  // Include day order
  const fullData = {
    dayOrder: dayOrder,
    attendance: attendanceData
  };

  localStorage.setItem(attendanceKey, JSON.stringify(fullData));
  alert("Attendance saved successfully!");
}
function saveAttendance() {
  // Your existing logic to save attendance...
  
  alert("Attendance saved successfully!");

  // Show the analytics button
  document.getElementById("view-analytics-btn").style.display = "inline-block";
}
document.addEventListener("DOMContentLoaded", function () {
  const attendanceData = JSON.parse(localStorage.getItem("attendanceData")) || {};
  const today = new Date().toISOString().split("T")[0];

  const todayData = attendanceData[today] || [];
  const totalStudents = todayData.length;
  let presentCount = 0;
  const hourWise = [0, 0, 0, 0, 0, 0, 0];

  todayData.forEach(student => {
    for (let i = 0; i < 7; i++) {
      if (student.attendance[i] === "P") {
        hourWise[i]++;
      }
    }
  });

  const overallPercentage = totalStudents
    ? Math.round((hourWise.reduce((a, b) => a + b, 0) / (totalStudents * 7)) * 100)
    : 0;

  document.getElementById("analytics-date").textContent = `Date: ${today}`;
  document.getElementById("overall-percentage").textContent = `Overall: ${overallPercentage}%`;

  const hourLabels = [
    "Period 1", "Period 2", "Period 3", "Period 4",
    "Period 5", "Period 6", "Period 7"
  ];

  const hourList = document.getElementById("hour-list");
  hourList.innerHTML = "";

  hourWise.forEach((count, index) => {
    const percentage = totalStudents ? Math.round((count / totalStudents) * 100) : 0;
    const li = document.createElement("li");
    li.textContent = `${hourLabels[index]}: ${percentage}% present`;
    hourList.appendChild(li);
  });
});

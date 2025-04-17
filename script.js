// ========== Admin Login ==========
function adminLogin() {
    let username = document.getElementById("admin-username").value;
    let password = document.getElementById("admin-password").value;

    if (username === "admin" && password === "admin123") {
        alert("Login Successful!");
        window.location.href = "admin_dashboard.html";
    } else {
        alert("Invalid credentials!");
    }
}

// ========== Create and Store Staff ==========
function createStaff() {
    let username = document.getElementById("staff-username").value;
    let password = document.getElementById("staff-password").value;
    let batch = document.getElementById("batch").value;
    let year = document.getElementById("year").value;
    let section = document.getElementById("section").value;

    if (!username || !password || !batch || !year || !section) {
        alert("Please fill all fields!");
        return;
    }

    let staffList = JSON.parse(localStorage.getItem("staffList")) || [];

    if (staffList.some(staff => staff.username === username)) {
        alert("Username already exists!");
        return;
    }

    staffList.push({ username, password, batch, year, section });
    localStorage.setItem("staffList", JSON.stringify(staffList));

    let table = document.getElementById("staffTable");
    let row = table.insertRow();
    row.innerHTML = `<td>${username}</td><td>${batch}</td><td>${year}</td><td>${section}</td>`;

    alert("Staff added successfully!");
}

// ========== Staff Login ==========
function handleStaffLogin() {
    let username = document.getElementById("staffUsername").value;
    let password = document.getElementById("staffPassword").value;

    let staffList = JSON.parse(localStorage.getItem("staffList")) || [];
    let staff = staffList.find(s => s.username === username && s.password === password);

    if (staff) {
        localStorage.setItem("currentStaff", username);
        localStorage.setItem("currentBatch", staff.batch);
        localStorage.setItem("currentYear", staff.year);
        localStorage.setItem("currentSection", staff.section);

        alert(`Login Successful! Section ${staff.section}`);
        window.location.href = "staff_dashboard.html";
    } else {
        alert("Invalid username or password!");
    }
}

// ========== Upload Excel (Student List) ==========
function uploadStudentData(event) {
    const file = event.target.files[0];
    if (!file) return alert("Please select a file.");

    const reader = new FileReader();
    reader.readAsBinaryString(file);

    reader.onload = function (e) {
        const workbook = XLSX.read(e.target.result, { type: "binary" });
        const sheet = workbook.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);

        if (data.length === 0) return alert("Empty Excel!");

        const batch = localStorage.getItem("currentBatch");
        const year = localStorage.getItem("currentYear");
        const section = localStorage.getItem("currentSection");

        const formattedData = data.map(student => ({
            RollNumber: student["Roll Number"] || student["RollNumber"],
            Name: student["Student Name"] || student["Name"]
        }));

        const storageKey = `students_${batch}_${year}_${section}`;
        localStorage.setItem(storageKey, JSON.stringify(formattedData));

        alert(`Uploaded student list for section ${section}.`);
        if (window.location.pathname.includes("attendance.html")) {
            loadAttendancePage();
        }
    };
}

// ========== Load Attendance ==========
function loadAttendancePage() {
    const batch = localStorage.getItem("currentBatch");
    const year = localStorage.getItem("currentYear");
    const section = localStorage.getItem("currentSection");

    const storageKey = `students_${batch}_${year}_${section}`;
    const studentList = JSON.parse(localStorage.getItem(storageKey)) || [];
    const attendanceKey = `attendance_${batch}_${year}_${section}`;
    const attendanceData = JSON.parse(localStorage.getItem(attendanceKey)) || {};

    const studentTable = document.getElementById("studentList");
    studentTable.innerHTML = "";

    if (studentList.length === 0) {
        studentTable.innerHTML = "<tr><td colspan='3'>No students found.</td></tr>";
        return;
    }

    studentList.forEach((student, index) => {
        const status = attendanceData[student.RollNumber] || "Present";
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${student.RollNumber}</td>
            <td>${student.Name}</td>
            <td>
                <select id="attendance-${index}">
                    <option value="Present" ${status === "Present" ? "selected" : ""}>Present</option>
                    <option value="Absent" ${status === "Absent" ? "selected" : ""}>Absent</option>
                </select>
            </td>
        `;
        studentTable.appendChild(row);
    });

    document.getElementById("sectionName").innerText = `Section: ${section}`;
}

// ========== Save Attendance ==========
function saveAttendance() {
    const batch = localStorage.getItem("currentBatch");
    const year = localStorage.getItem("currentYear");
    const section = localStorage.getItem("currentSection");

    const storageKey = `students_${batch}_${year}_${section}`;
    const studentList = JSON.parse(localStorage.getItem(storageKey)) || [];

    const attendanceData = {};
    studentList.forEach((student, index) => {
        const status = document.getElementById(`attendance-${index}`).value;
        attendanceData[student.RollNumber] = status;
    });

    const attendanceKey = `attendance_${batch}_${year}_${section}`;
    localStorage.setItem(attendanceKey, JSON.stringify(attendanceData));

    alert("Attendance saved!");
}

// ========== Download Attendance ==========
function downloadAttendance() {
    const batch = localStorage.getItem("currentBatch");
    const year = localStorage.getItem("currentYear");
    const section = localStorage.getItem("currentSection");

    const storageKey = `students_${batch}_${year}_${section}`;
    const studentList = JSON.parse(localStorage.getItem(storageKey)) || [];

    const attendanceKey = `attendance_${batch}_${year}_${section}`;
    const attendanceData = JSON.parse(localStorage.getItem(attendanceKey)) || {};

    if (studentList.length === 0) return alert("No students found.");

    let csv = "Roll Number,Student Name,Attendance\n";
    studentList.forEach(student => {
        csv += `${student.RollNumber},${student.Name},${attendanceData[student.RollNumber] || "Present"}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Attendance_${section}.csv`;
    link.click();
}

document.addEventListener("DOMContentLoaded", function () {
    if (window.location.pathname.includes("attendance.html")) {
        loadAttendancePage();
    }
});

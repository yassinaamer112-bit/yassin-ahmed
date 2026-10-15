// app.js
// تشغيل بيانات الطلاب + اختيار الصف والفصل + عرض الغياب

document.addEventListener("DOMContentLoaded", () => {
  const gradeSelect = document.getElementById("gradeSelect");
  const classSelect = document.getElementById("classSelect");
  const studentsContainer = document.getElementById("studentsContainer");
  const showAbsenceBtn = document.getElementById("showAbsenceBtn");
  const absenceContainer = document.getElementById("absenceContainer");
  const totalStudents = document.getElementById("totalStudents");
  const absentCount = document.getElementById("absentCount");

  // لو الصفحة لا تحتوي على العناصر المطلوبة
  if (!gradeSelect || !classSelect) {
    console.warn("عناصر اختيار الصف والفصل غير موجودة في الصفحة.");
    return;
  }

  let selectedStudents = [];
  let attendance = {};

  // ==============================
  // تحميل الصفوف
  // ==============================

  function loadGrades() {
    gradeSelect.innerHTML = `
      <option value="">اختر الصف</option>
      <option value="1">الصف الأول الثانوي</option>
      <option value="2">الصف الثاني الثانوي</option>
    `;

    classSelect.innerHTML = `
      <option value="">اختر الفصل</option>
    `;

    classSelect.disabled = true;
  }

  // ==============================
  // عند اختيار الصف
  // ==============================

  gradeSelect.addEventListener("change", () => {
    const grade = gradeSelect.value;

    classSelect.innerHTML = `
      <option value="">اختر الفصل</option>
    `;

    studentsContainer.innerHTML = "";
    absenceContainer.innerHTML = "";

    if (!grade || !schoolData?.grades?.[grade]) {
      classSelect.disabled = true;
      resetCounters();
      return;
    }

    const classNames = Object.keys(schoolData.grades[grade]);

    classNames.forEach(className => {
      const option = document.createElement("option");
      option.value = className;
      option.textContent = `فصل ${className}`;
      classSelect.appendChild(option);
    });

    classSelect.disabled = false;
    resetCounters();
  });

  // ==============================
  // عند اختيار الفصل
  // ==============================

  classSelect.addEventListener("change", () => {
    const grade = gradeSelect.value;
    const className = classSelect.value;

    studentsContainer.innerHTML = "";
    absenceContainer.innerHTML = "";
    attendance = {};

    if (!grade || !className) {
      resetCounters();
      return;
    }

    selectedStudents = schoolData.grades[grade][className] || [];

    renderStudents();
  });

  // ==============================
  // عرض الطلاب
  // ==============================

  function renderStudents() {
    studentsContainer.innerHTML = "";

    if (selectedStudents.length === 0) {
      studentsContainer.innerHTML = `
        <div class="empty-state">
          لا يوجد طلاب في هذا الفصل.
        </div>
      `;

      resetCounters();
      return;
    }

    selectedStudents.forEach((student, index) => {
      attendance[index] = true;

      const studentCard = document.createElement("div");
      studentCard.className = "student-card present";
      studentCard.dataset.index = index;

      studentCard.innerHTML = `
        <div class="student-info">
          <span class="student-number">${index + 1}</span>

          <div>
            <div class="student-name">
              ${student.name}
            </div>

            ${
              student.specialization
                ? `<div class="student-specialization">
                    ${student.specialization}
                   </div>`
                : ""
            }
          </div>
        </div>

        <button
          type="button"
          class="attendance-btn present-btn"
          data-index="${index}"
        >
          حاضر
        </button>
      `;

      studentsContainer.appendChild(studentCard);
    });

    updateCounters();
    attachAttendanceEvents();
  }

  // ==============================
  // زر حاضر / غائب
  // ==============================

  function attachAttendanceEvents() {
    const buttons = document.querySelectorAll(".attendance-btn");

    buttons.forEach(button => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.index);
        const card = document.querySelector(
          `.student-card[data-index="${index}"]`
        );

        if (attendance[index] === true) {
          attendance[index] = false;

          card.classList.remove("present");
          card.classList.add("absent");

          button.classList.remove("present-btn");
          button.classList.add("absent-btn");

          button.textContent = "غائب";
        } else {
          attendance[index] = true;

          card.classList.remove("absent");
          card.classList.add("present");

          button.classList.remove("absent-btn");
          button.classList.add("present-btn");

          button.textContent = "حاضر";
        }

        updateCounters();
      });
    });
  }

  // ==============================
  // تحديث العدادات
  // ==============================

  function updateCounters() {
    const total = selectedStudents.length;

    const absent = Object.values(attendance).filter(
      status => status === false
    ).length;

    if (totalStudents) {
      totalStudents.textContent = total;
    }

    if (absentCount) {
      absentCount.textContent = absent;
    }
  }

  function resetCounters() {
    if (totalStudents) {
      totalStudents.textContent = "0";
    }

    if (absentCount) {
      absentCount.textContent = "0";
    }
  }

  // ==============================
  // زر عرض الغياب
  // ==============================

  if (showAbsenceBtn) {
    showAbsenceBtn.addEventListener("click", () => {
      showAbsence();
    });
  }

  function showAbsence() {
    if (!absenceContainer) return;

    absenceContainer.innerHTML = "";

    if (!gradeSelect.value || !classSelect.value) {
      absenceContainer.innerHTML = `
        <div class="empty-state">
          اختر الصف والفصل أولاً.
        </div>
      `;
      return;
    }

    const absentStudents = selectedStudents.filter((student, index) => {
      return attendance[index] === false;
    });

    if (absentStudents.length === 0) {
      absenceContainer.innerHTML = `
        <div class="absence-empty">
          <strong>لا يوجد غياب</strong>
          <span>جميع الطلاب حاضرون.</span>
        </div>
      `;
      return;
    }

    const header = document.createElement("div");
    header.className = "absence-header";

    header.innerHTML = `
      <div>
        <strong>الطلاب الغائبون</strong>
        <span>${absentStudents.length} طالب</span>
      </div>
    `;

    absenceContainer.appendChild(header);

    const list = document.createElement("div");
    list.className = "absence-list";

    absentStudents.forEach((student, index) => {
      const item = document.createElement("div");

      item.className = "absence-item";

      item.innerHTML = `
        <span class="absence-number">${index + 1}</span>
        <div>
          <div class="absence-name">
            ${student.name}
          </div>

          ${
            student.specialization
              ? `<small>${student.specialization}</small>`
              : ""
          }
        </div>
      `;

      list.appendChild(item);
    });

    absenceContainer.appendChild(list);
  }

  // ==============================
  // تحميل الصفوف عند فتح الصفحة
  // ==============================

  loadGrades();
});
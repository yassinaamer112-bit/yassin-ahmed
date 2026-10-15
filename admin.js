/* ========================================
   1. حماية صفحة المدير
======================================== */

const adminToken = localStorage.getItem("attendanceToken");
const adminRole = localStorage.getItem("attendanceRole");

if (!adminToken || adminRole !== "admin") {
    window.location.replace("admin-login.html");
} else {

document.addEventListener("DOMContentLoaded", () => {

    /* ========================================
       2. إعدادات السيرفر
    ======================================== */

    const API_URL = "http://localhost:3000";

    /* ========================================
       3. عناصر صفحة المدير
    ======================================== */

    const attendanceInfo = document.getElementById("attendanceInfo");
    const studentsContainer = document.getElementById("studentsContainer");
    const historyContainer = document.getElementById("historyContainer");

    const totalStudents = document.getElementById("totalStudents");
    const presentStudents = document.getElementById("presentStudents");
    const absentStudents = document.getElementById("absentStudents");

    const refreshBtn = document.getElementById("refreshBtn");
    const clearViewBtn = document.getElementById("clearViewBtn");
    const adminLogoutBtn = document.getElementById("adminLogoutBtn");

    /* ========================================
       4. عناصر التقرير الأسبوعي
    ======================================== */

    const weekStart = document.getElementById("weekStart");
    const weekEnd = document.getElementById("weekEnd");

    const weeklyGradeSelect =
        document.getElementById("weeklyGradeSelect");

    const weeklyClassSelect =
        document.getElementById("weeklyClassSelect");

    const weeklyReportBtn =
        document.getElementById("weeklyReportBtn");

    const weeklyReportContainer =
        document.getElementById("weeklyReportContainer");

    /* ========================================
       5. عناصر التقرير اليومي
    ======================================== */

    const dailyDate = document.getElementById("dailyDate");

    const dailyGradeSelect =
        document.getElementById("dailyGradeSelect");

    const dailyClassSelect =
        document.getElementById("dailyClassSelect");

    const dailyReportBtn =
        document.getElementById("dailyReportBtn");

    const dailyReportContainer =
        document.getElementById("dailyReportContainer");

    /* ========================================
       6. المتغيرات
    ======================================== */

    let records = [];
    let viewCleared = false;
    let loadingRecords = false;

    /* ========================================
       7. أسماء الصفوف
    ======================================== */

    function getGradeName(grade) {
        const names = {
            "1": "الصف الأول الثانوي",
            "2": "الصف الثاني الثانوي",
            "3": "الصف الثالث الثانوي"
        };

        return names[String(grade)] || `الصف ${grade}`;
    }

    /* ========================================
       8. تنسيق التاريخ
    ======================================== */

    function formatDate(date) {
        if (!date) return "-";

        const parts = String(date).slice(0, 10).split("-");

        if (parts.length === 3 && parts[0].length === 4) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }

        return String(date);
    }

    /* ========================================
       9. الحصول على تاريخ اليوم المحلي
    ======================================== */

    function getLocalDate() {
        const now = new Date();

        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    /* ========================================
       10. اسم اليوم
    ======================================== */

    function getDayName(date) {
        if (!date) return "-";

        const day = new Date(`${date}T00:00:00`).getDay();

        const days = [
            "الأحد",
            "الاثنين",
            "الثلاثاء",
            "الأربعاء",
            "الخميس",
            "الجمعة",
            "السبت"
        ];

        return days[day] || "-";
    }

    /* ========================================
       11. تحميل سجلات الغياب من السيرفر
    ======================================== */

    async function loadRecords() {
        if (loadingRecords) return;

        loadingRecords = true;

        try {
            console.log("جاري تحميل سجلات الغياب...");

            const response = await fetch(
                `${API_URL}/api/attendance`,
                {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${adminToken}`
                    }
                }
            );

            const result = await response.json();

            console.log("حالة السيرفر:", response.status);
            console.log("سجلات الغياب:", result);

            if (response.status === 401) {
                if (attendanceInfo) {
                    attendanceInfo.textContent =
                        "جلسة الدخول غير صالحة. سجّل دخول المدير مرة أخرى.";
                }

                return;
            }

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "فشل تحميل سجلات الغياب"
                );
            }

            records = Array.isArray(result.records)
                ? result.records
                : [];

            viewCleared = false;

            renderPage();

        } catch (error) {
            console.error("خطأ تحميل السجلات:", error);

            if (attendanceInfo) {
                attendanceInfo.textContent =
                    `تعذر تحميل سجلات الغياب: ${error.message}`;
            }

            if (historyContainer) {
                historyContainer.innerHTML = `
                    <div class="empty-state">
                        تعذر تحميل السجلات. تأكد من تشغيل السيرفر.
                    </div>
                `;
            }

        } finally {
            loadingRecords = false;
        }
    }

    /* ========================================
       12. عرض الإحصائيات
    ======================================== */

    function renderStatistics() {
        let total = 0;
        let present = 0;
        let absent = 0;

        records.forEach(record => {
            total += Number(record.totalStudents || 0);
            present += Number(record.presentCount || 0);
            absent += Number(record.absentCount || 0);
        });

        if (totalStudents) {
            totalStudents.textContent = total;
        }

        if (presentStudents) {
            presentStudents.textContent = present;
        }

        if (absentStudents) {
            absentStudents.textContent = absent;
        }

        if (attendanceInfo) {
            if (records.length === 0) {
                attendanceInfo.innerHTML = `
                    <div class="empty-state">
                        لا توجد سجلات غياب حتى الآن.
                    </div>
                `;
            } else {
                const latest = [...records].sort((a, b) =>
                    String(b.date || "").localeCompare(
                        String(a.date || "")
                    )
                )[0];

                attendanceInfo.innerHTML = `
                    <div class="absence-card">
                        <div class="absence-card-header">
                            <h3>آخر غياب تم إرساله</h3>
                            <span>${formatDate(latest.date)}</span>
                        </div>

                        <div class="absence-card-info">
                            <div>
                                الصف:
                                <strong>${getGradeName(latest.grade)}</strong>
                            </div>

                            <div>
                                الفصل:
                                <strong>${latest.className || "-"}</strong>
                            </div>

                            <div>
                                المادة:
                                <strong>${latest.subject || "-"}</strong>
                            </div>

                            <div>
                                الحصة:
                                <strong>${latest.period || "-"}</strong>
                            </div>

                            <div>
                                الحاضرون:
                                <strong>${Number(latest.presentCount || 0)}</strong>
                            </div>

                            <div>
                                الغائبون:
                                <strong>${Number(latest.absentCount || 0)}</strong>
                            </div>
                        </div>

                        <div class="absence-card-footer">
                            اختر السجل من القائمة لعرض أسماء الغائبين.
                        </div>
                    </div>
                `;
            }
        }
    }

    /* ========================================
       13. عرض كل سجلات الغياب
    ======================================== */

    function renderHistory() {
        if (!historyContainer) return;

        if (records.length === 0) {
            historyContainer.innerHTML = `
                <div class="empty-state">
                    لا توجد سجلات غياب حتى الآن.
                </div>
            `;
            return;
        }

        const sortedRecords = [...records].sort((a, b) =>
            String(b.date || "").localeCompare(
                String(a.date || "")
            )
        );

        historyContainer.innerHTML = sortedRecords.map(
            (record, index) => `
                <div class="history-card"
                     data-record-index="${index}"
                     tabindex="0"
                     role="button"
                     aria-label="عرض غياب ${record.subject || "الحصة"}">

                    <div class="history-header">
                        <strong>${record.subject || "-"}</strong>
                        <span>${formatDate(record.date)}</span>
                    </div>

                    <div class="history-details">
                        <div>
                            الصف:
                            <strong>${getGradeName(record.grade)}</strong>
                        </div>

                        <div>
                            الفصل:
                            <strong>${record.className || "-"}</strong>
                        </div>

                        <div>
                            الحصة:
                            <strong>${record.period || "-"}</strong>
                        </div>

                        <div>
                            اليوم:
                            <strong>${getDayName(record.date)}</strong>
                        </div>
                    </div>

                    <div class="history-counts">
                        <span>
                            إجمالي الطلاب:
                            <strong>${Number(record.totalStudents || 0)}</strong>
                        </span>

                        <span>
                            الحاضر:
                            <strong>${Number(record.presentCount || 0)}</strong>
                        </span>

                        <span>
                            الغائب:
                            <strong>${Number(record.absentCount || 0)}</strong>
                        </span>
                    </div>

                    <small>اضغط لعرض أسماء الغائبين</small>
                </div>
            `
        ).join("");

        historyContainer.querySelectorAll(".history-card")
            .forEach((card, index) => {
                function openRecord() {
                    renderStudents(sortedRecords[index]);

                    if (studentsContainer) {
                        studentsContainer.scrollIntoView({
                            behavior: "smooth",
                            block: "nearest"
                        });
                    }
                }

                card.addEventListener("click", openRecord);

                card.addEventListener("keydown", event => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openRecord();
                    }
                });
            });
    }

    /* ========================================
       14. عرض أسماء الطلاب الغائبين
    ======================================== */

    function renderStudents(record) {
        if (!studentsContainer) return;

        if (!record || !Array.isArray(record.students)) {
            studentsContainer.innerHTML = `
                <div class="empty-state">
                    لا توجد بيانات للطلاب في هذا السجل.
                </div>
            `;
            return;
        }

        const absentList = record.students.filter(student =>
            String(student.status).toLowerCase() === "absent"
        );

        if (absentList.length === 0) {
            studentsContainer.innerHTML = `
                <div class="empty-state">
                    لا يوجد طلاب غائبون في هذه الحصة.
                </div>
            `;
            return;
        }

        let html = `
            <h3>الطلاب الغائبون</h3>
            <div class="students-list">
        `;

        absentList.forEach((student, index) => {
            html += `
                <div class="student-row">
                    <span>${index + 1}</span>
                    <strong>${student.name || "اسم غير متوفر"}</strong>
                </div>
            `;
        });

        html += "</div>";

        studentsContainer.innerHTML = html;
    }

    /* ========================================
       15. إعادة عرض الصفحة
    ======================================== */

    function renderPage() {
        if (viewCleared) return;

        renderStatistics();
        renderHistory();
    }

    /* ========================================
       16. تحميل الصفوف في التقرير الأسبوعي
    ======================================== */

    function loadWeeklyGrades() {
        if (!weeklyGradeSelect) return;

        weeklyGradeSelect.innerHTML = `
            <option value="">اختر الصف</option>
        `;

        if (
            typeof schoolData === "undefined" ||
            !schoolData.grades
        ) {
            console.error("schoolData غير موجود. تأكد من تحميل data.js");
            return;
        }

        Object.keys(schoolData.grades).forEach(grade => {
            const option = document.createElement("option");

            option.value = grade;
            option.textContent = getGradeName(grade);

            weeklyGradeSelect.appendChild(option);
        });
    }

    /* ========================================
       17. تحميل الفصول في التقرير الأسبوعي
    ======================================== */

    function loadWeeklyClasses() {
        if (!weeklyClassSelect) return;

        const grade = weeklyGradeSelect
            ? weeklyGradeSelect.value
            : "";

        weeklyClassSelect.innerHTML = `
            <option value="">اختر الفصل</option>
        `;

        if (
            !grade ||
            typeof schoolData === "undefined" ||
            !schoolData.grades ||
            !schoolData.grades[grade]
        ) {
            return;
        }

        Object.keys(schoolData.grades[grade]).forEach(className => {
            const option = document.createElement("option");

            option.value = className;
            option.textContent = className;

            weeklyClassSelect.appendChild(option);
        });
    }

    /* ========================================
       18. إنشاء التقرير الأسبوعي
    ======================================== */

    async function generateWeeklyReport() {
        if (!weeklyReportContainer) return;

        const grade = weeklyGradeSelect
            ? weeklyGradeSelect.value
            : "";

        const className = weeklyClassSelect
            ? weeklyClassSelect.value
            : "";

        const startDate = weekStart ? weekStart.value : "";
        const endDate = weekEnd ? weekEnd.value : "";

        if (!grade || !className || !startDate || !endDate) {
            weeklyReportContainer.innerHTML = `
                <div class="empty-state">
                    اختر الصف والفصل وبداية الأسبوع ونهايته.
                </div>
            `;
            return;
        }

        if (startDate > endDate) {
            weeklyReportContainer.innerHTML = `
                <div class="empty-state">
                    تاريخ بداية الأسبوع يجب أن يسبق تاريخ نهايته.
                </div>
            `;
            return;
        }

        weeklyReportContainer.innerHTML = `
            <div class="empty-state">جاري تحميل التقرير...</div>
        `;

        try {
            const params = new URLSearchParams({
                startDate,
                endDate,
                grade,
                className
            });

            const response = await fetch(
                `${API_URL}/api/attendance/weekly?${params.toString()}`,
                {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${adminToken}`
                    }
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "تعذر تحميل التقرير الأسبوعي"
                );
            }

            renderWeeklyReport(result);

        } catch (error) {
            console.error("Weekly Report Error:", error);

            weeklyReportContainer.innerHTML = `
                <div class="empty-state">
                    تعذر تحميل التقرير: ${error.message}
                </div>
            `;
        }
    }

    /* ========================================
       19. عرض التقرير الأسبوعي
    ======================================== */

    function renderWeeklyReport(data) {
        if (!weeklyReportContainer) return;

        const students = Array.isArray(data.students)
            ? data.students
            : [];

        let html = `
            <div class="weekly-summary">
                <div class="weekly-summary-card">
                    <span>عدد الحصص</span>
                    <strong>${data.totalLessons || 0}</strong>
                </div>

                <div class="weekly-summary-card">
                    <span>الحضور</span>
                    <strong>${data.totalPresent || 0}</strong>
                </div>

                <div class="weekly-summary-card">
                    <span>الغياب</span>
                    <strong>${data.totalAbsent || 0}</strong>
                </div>

                <div class="weekly-summary-card">
                    <span>نسبة الحضور</span>
                    <strong>${data.attendancePercentage || 0}%</strong>
                </div>
            </div>
        `;

        if (students.length === 0) {
            html += `
                <div class="empty-state">
                    لا توجد بيانات طلاب في الفترة المحددة.
                </div>
            `;

            weeklyReportContainer.innerHTML = html;
            return;
        }

      html += `
            <div class="weekly-report-table-wrapper">
                <table class="weekly-report-table">
                    <thead>
                        <tr>
                            <th>الطالب</th>
                            <th>الأحد</th>
                            <th>الاثنين</th>
                            <th>الثلاثاء</th>
                            <th>الأربعاء</th>
                            <th>الخميس</th>
                            <th>الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        students.forEach(student => {
            html += `
                <tr>
                    <td>${student.name || "-"}</td>
                    <td>${student.sunday || 0}</td>
                    <td>${student.monday || 0}</td>
                    <td>${student.tuesday || 0}</td>
                    <td>${student.wednesday || 0}</td>
                    <td>${student.thursday || 0}</td>
                    <td><strong>${student.total || 0}</strong></td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        weeklyReportContainer.innerHTML = html;
    }

  /* ========================================
       تشغيل لوحة تحكم المدير
    ======================================== */

    /* ========================================
       دوال التقرير اليومي
    ======================================== */

    function loadDailyGrades() {
        if (!dailyGradeSelect) {
            console.error("عنصر dailyGradeSelect غير موجود في HTML");
            return;
        }

        dailyGradeSelect.innerHTML =
            '<option value="">اختر الصف</option>';

        if (
            typeof schoolData === "undefined" ||
            !schoolData.grades
        ) {
            console.error("بيانات schoolData غير متاحة");
            return;
        }

        Object.keys(schoolData.grades).forEach(grade => {
            const option = document.createElement("option");

            option.value = grade;
            option.textContent = getGradeName(grade);

            dailyGradeSelect.appendChild(option);
        });
    }

    function loadDailyClasses() {
        if (!dailyClassSelect || !dailyGradeSelect) return;

        const grade = dailyGradeSelect.value;

        dailyClassSelect.innerHTML =
            '<option value="">اختر الفصل</option>';

        if (
            !grade ||
            typeof schoolData === "undefined" ||
            !schoolData.grades ||
            !schoolData.grades[grade]
        ) {
            return;
        }

        const gradeData = schoolData.grades[grade];

        Object.keys(gradeData).forEach(className => {
            const option = document.createElement("option");

            option.value = className;
            option.textContent = className;

            dailyClassSelect.appendChild(option);
        });

        console.log(
            "تم تحميل فصول التقرير اليومي:",
            Object.keys(gradeData)
        );
    }

    function generateDailyReport() {
        if (!dailyReportContainer) {
            console.error("عنصر dailyReportContainer غير موجود في HTML");
            return;
        }

        const date = dailyDate ? dailyDate.value : "";
        const grade = dailyGradeSelect
            ? dailyGradeSelect.value
            : "";
        const className = dailyClassSelect
            ? dailyClassSelect.value
            : "";

        if (!date || !grade || !className) {
            dailyReportContainer.innerHTML = `
                <div class="empty-state">
                    اختر التاريخ والصف والفصل أولًا.
                </div>
            `;
            return;
        }

        const matchingRecords = records.filter(record =>
            String(record.date || "").slice(0, 10) === date &&
            String(record.grade) === String(grade) &&
            String(record.className) === String(className)
        );

        if (matchingRecords.length === 0) {
            dailyReportContainer.innerHTML = `
                <div class="empty-state">
                    لا توجد سجلات غياب لهذا الفصل في التاريخ المحدد.
                </div>
            `;
            return;
        }

        let html = `
            <div class="daily-report-summary">
                <h3>تقرير الغياب اليومي</h3>
                <p>التاريخ: ${formatDate(date)}</p>
                <p>الصف: ${getGradeName(grade)}</p>
                <p>الفصل: ${className}</p>
                <p>عدد الحصص المسجلة: ${matchingRecords.length}</p>
            </div>
        `;

        matchingRecords.forEach(record => {
            const students = Array.isArray(record.students)
                ? record.students
                : [];

            const absentStudents = students.filter(student =>
                String(student.status || "").toLowerCase() === "absent"
            );

            html += `
                <div class="daily-report-card">
                    <h4>
                        المادة: ${record.subject || "-"}
                        — الحصة: ${record.period || "-"}
                    </h4>

                    <p>
                        إجمالي الطلاب:
                        ${Number(record.totalStudents || 0)}
                    </p>

                    <p>
                        الحاضرون:
                        ${Number(record.presentCount || 0)}
                    </p>

                    <p>
                        الغائبون:
                        ${Number(record.absentCount || 0)}
                    </p>

                    <h4>أسماء الغائبين</h4>
            `;

            if (absentStudents.length === 0) {
                html += `
                    <p>لا يوجد طلاب غائبون في هذه الحصة.</p>
                `;
            } else {
                html += `<ol class="daily-absent-list">`;

                absentStudents.forEach(student => {
                    html += `
                        <li>${student.name || "اسم غير متوفر"}</li>
                    `;
                });

                html += `</ol>`;
            }

            html += `</div>`;
        });

        dailyReportContainer.innerHTML = html;
    }

    /* ========================================
       أحداث التقرير الأسبوعي واليومي
    ======================================== */

    if (weeklyGradeSelect) {
        weeklyGradeSelect.addEventListener("change", () => {
            loadWeeklyClasses();

            if (weeklyReportContainer) {
                weeklyReportContainer.innerHTML = "";
            }
        });
    }

    if (weeklyClassSelect) {
        weeklyClassSelect.addEventListener("change", () => {
            if (weeklyReportContainer) {
                weeklyReportContainer.innerHTML = "";
            }
        });
    }

    if (weeklyReportBtn) {
        weeklyReportBtn.addEventListener(
            "click",
            generateWeeklyReport
        );
    }

    if (dailyGradeSelect) {
        dailyGradeSelect.addEventListener("change", () => {
            loadDailyClasses();

            if (dailyReportContainer) {
                dailyReportContainer.innerHTML = "";
            }
        });
    }

    if (dailyClassSelect) {
        dailyClassSelect.addEventListener("change", () => {
            if (dailyReportContainer) {
                dailyReportContainer.innerHTML = "";
            }
        });
    }

    if (dailyReportBtn) {
        dailyReportBtn.addEventListener(
            "click",
            generateDailyReport
        );
    }

    /* ========================================
       أزرار تحديث ومسح العرض وتسجيل الخروج
    ======================================== */

    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            loadRecords();
        });
    }

    if (clearViewBtn) {
        clearViewBtn.addEventListener("click", () => {
            viewCleared = true;

            if (attendanceInfo) attendanceInfo.innerHTML = "";
            if (historyContainer) historyContainer.innerHTML = "";
            if (studentsContainer) studentsContainer.innerHTML = "";
            if (weeklyReportContainer) weeklyReportContainer.innerHTML = "";
            if (dailyReportContainer) dailyReportContainer.innerHTML = "";

            if (totalStudents) totalStudents.textContent = "0";
            if (presentStudents) presentStudents.textContent = "0";
            if (absentStudents) absentStudents.textContent = "0";
        });
    }

    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener("click", () => {
            localStorage.removeItem("attendanceToken");
            localStorage.removeItem("attendanceRole");

            window.location.replace("admin-login.html");
        });
    }

    /* ========================================
       بدء تشغيل لوحة المدير
    ======================================== */

    function initializeAdminPage() {
        loadWeeklyGrades();
        loadWeeklyClasses();

        loadDailyGrades();
        loadDailyClasses();

        if (dailyDate && !dailyDate.value) {
            dailyDate.value = getLocalDate();
        }

        loadRecords();
    }

    initializeAdminPage();

/* نهاية DOMContentLoaded */
});

}
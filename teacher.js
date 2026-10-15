// ========================================
// حماية صفحة المدرس
// ========================================

// جلب بيانات جلسة تسجيل الدخول
const teacherToken = localStorage.getItem("attendanceToken");
const teacherRole = localStorage.getItem("attendanceRole");

// لو مفيش تسجيل دخول أو الحساب مش مدرس
// نرجعه لصفحة دخول المدرس
if (!teacherToken || teacherRole !== "teacher") {

    window.location.href = "teacher-login.html";

}


// ========================================
// تشغيل الصفحة بعد تحميل HTML
// ========================================

document.addEventListener("DOMContentLoaded", () => {

    // ========================================
    // عناصر الصفحة
    // ========================================

    const gradeSelect =
        document.getElementById("gradeSelect");

    const classSelect =
        document.getElementById("classSelect");

    const periodSelect =
        document.getElementById("periodSelect");

    const attendanceDate =
        document.getElementById("attendanceDate");

    const studentsContainer =
        document.getElementById("studentsContainer");

    const totalStudents =
        document.getElementById("totalStudents");

    const presentStudents =
        document.getElementById("presentStudents");

    const absentStudents =
        document.getElementById("absentStudents");

    const showStudentsBtn =
        document.getElementById("showStudentsBtn");

    const saveAttendanceBtn =
        document.getElementById("saveAttendanceBtn");

    const refreshBtn =
        document.getElementById("refreshBtn");


    // ========================================
    // رابط السيرفر
    // ========================================

    const API_URL = "http://localhost:3000";


    // ========================================
    // بيانات الطلاب الحالية
    // ========================================

    let students = [];

    let attendance = {};


    // ========================================
    // تحديد تاريخ اليوم تلقائيًا
    // ========================================

    if (attendanceDate) {

        const today = new Date();

        const year =
            today.getFullYear();

        const month =
            String(today.getMonth() + 1)
                .padStart(2, "0");

        const day =
            String(today.getDate())
                .padStart(2, "0");

        attendanceDate.value =
            `${year}-${month}-${day}`;

    }


    // ========================================
    // تحميل الصفوف
    // ========================================

    if (gradeSelect) {

        gradeSelect.innerHTML = `
            <option value="">اختر الصف</option>

            <option value="1">
                الصف الأول الثانوي
            </option>

            <option value="2">
                الصف الثاني الثانوي
            </option>
        `;


        gradeSelect.addEventListener(
            "change",
            () => {

                const grade =
                    gradeSelect.value;


                // إعادة ضبط اختيار الفصل
                classSelect.innerHTML = `
                    <option value="">
                        اختر الفصل
                    </option>
                `;


                // مسح الطلاب
                studentsContainer.innerHTML = "";

                students = [];

                attendance = {};

                updateStats();


                // التأكد من وجود بيانات المدرسة
                if (
                    !grade ||
                    !window.schoolData ||
                    !window.schoolData.grades ||
                    !window.schoolData.grades[grade]
                ) {

                    return;

                }


                // جلب أسماء الفصول
                const classes =
                    Object.keys(
                        window.schoolData.grades[grade]
                    );


                // إضافة الفصول للقائمة
                classes.forEach(
                    className => {

                        const option =
                            document.createElement(
                                "option"
                            );

                        option.value =
                            className;

                        option.textContent =
                            `فصل ${className}`;

                        classSelect.appendChild(
                            option
                        );

                    }
                );

            }
        );

    }


    // ========================================
    // عند تغيير الفصل
    // ========================================

    if (classSelect) {

        classSelect.addEventListener(
            "change",
            () => {

                studentsContainer.innerHTML =
                    "";

                students = [];

                attendance = {};

                updateStats();

            }
        );

    }


    // ========================================
    // عرض الطلاب
    // ========================================

    function loadStudents() {

        const grade =
            gradeSelect.value;

        const className =
            classSelect.value;


        // التأكد من اختيار الصف
        if (!grade) {

            alert("اختر الصف أولاً");

            return;

        }


        // التأكد من اختيار الفصل
        if (!className) {

            alert("اختر الفصل أولاً");

            return;

        }


        // التأكد من وجود بيانات الطلاب
        if (!window.schoolData) {

            alert("بيانات الطلاب غير موجودة");

            return;

        }


        const selectedClass =
            window.schoolData.grades[
                grade
            ][className];


        if (!selectedClass) {

            alert(
                "لم يتم العثور على هذا الفصل"
            );

            return;

        }


        // حفظ الطلاب
        students =
            selectedClass;


        // جعل الجميع حاضر
        attendance = {};


        students.forEach(
            (student, index) => {

                attendance[index] =
                    "present";

            }
        );


        renderStudents();

        updateStats();

    }


    // ========================================
    // رسم الطلاب على الصفحة
    // ========================================

    function renderStudents() {

        studentsContainer.innerHTML =
            "";


        // لو مفيش طلاب
        if (!students.length) {

            studentsContainer.innerHTML = `
                <div class="empty-state">
                    لا يوجد طلاب في هذا الفصل
                </div>
            `;

            return;

        }


        // رسم كل طالب
        students.forEach(
            (student, index) => {

                const studentCard =
                    document.createElement(
                        "div"
                    );


                studentCard.className =
                    "student-card";


                const specialization =
                    student.specialization
                        ? ` - ${student.specialization}`
                        : "";


                studentCard.innerHTML = `

                    <div class="student-info">

                        <span class="student-number">
                            ${index + 1}
                        </span>

                        <div>

                            <div class="student-name">
                                ${student.name}
                            </div>

                            ${
                                specialization
                                    ? `
                                        <div class="student-specialization">
                                            ${specialization}
                                        </div>
                                      `
                                    : ""
                            }

                        </div>

                    </div>


                    <button
                        class="attendance-btn present"
                        data-index="${index}"
                    >
                        حاضر
                    </button>

                `;


                studentsContainer.appendChild(
                    studentCard
                );

            }
        );


        // إضافة حدث لأزرار الحضور والغياب
        document
            .querySelectorAll(".attendance-btn")
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const index =
                                Number(
                                    button.dataset.index
                                );


                            // تبديل الحالة
                            if (
                                attendance[index] ===
                                "present"
                            ) {

                                attendance[index] =
                                    "absent";

                            } else {

                                attendance[index] =
                                    "present";

                            }


                            // تحديث الزر
                            updateAttendanceButton(
                                button,
                                index
                            );


                            // تحديث الإحصائيات
                            updateStats();

                        }
                    );

                }
            );

    }


    // ========================================
    // تحديث زر الحضور والغياب
    // ========================================

    function updateAttendanceButton(
        button,
        index
    ) {

        if (
            attendance[index] ===
            "absent"
        ) {

            button.textContent =
                "غائب";

            button.classList.remove(
                "present"
            );

            button.classList.add(
                "absent"
            );

        } else {

            button.textContent =
                "حاضر";

            button.classList.remove(
                "absent"
            );

            button.classList.add(
                "present"
            );

        }

    }


    // ========================================
    // تحديث الإحصائيات
    // ========================================

    function updateStats() {

        const total =
            students.length;

        let absent = 0;


        Object.values(
            attendance
        ).forEach(
            status => {

                if (
                    status === "absent"
                ) {

                    absent++;

                }

            }
        );


        const present =
            total - absent;


        if (totalStudents) {

            totalStudents.textContent =
                total;

        }


        if (presentStudents) {

            presentStudents.textContent =
                present;

        }


        if (absentStudents) {

            absentStudents.textContent =
                absent;

        }

    }


    // ========================================
    // زر عرض الطلاب
    // ========================================

    if (showStudentsBtn) {

        showStudentsBtn.addEventListener(
            "click",
            () => {

                loadStudents();

            }
        );

    }


    // ========================================
    // زر تحديث الطلاب
    // ========================================

    if (refreshBtn) {

        refreshBtn.addEventListener(
            "click",
            () => {

                loadStudents();

            }
        );

    }


    // ========================================
    // إرسال الغياب للسيرفر
    // ========================================

    if (saveAttendanceBtn) {

        saveAttendanceBtn.addEventListener(
            "click",
            async () => {

                // التأكد من عرض الطلاب
                if (!students.length) {

                    alert(
                        "اعرض الطلاب أولاً"
                    );

                    return;

                }


                // ========================================
                // جلب بيانات الحصة
                // ========================================

                const grade =
                    gradeSelect.value;

                const className =
                    classSelect.value;


                const subjectSelect =
                    document.getElementById(
                        "subjectSelect"
                    );


                const subject =
                    subjectSelect
                        ? subjectSelect.value
                        : "";


                const period =
                    periodSelect.value;

                const date =
                    attendanceDate.value;


                // ========================================
                // التأكد من اكتمال البيانات
                // ========================================

                if (
                    !grade ||
                    !className ||
                    !subject ||
                    !period ||
                    !date
                ) {

                    alert(
                        "أكمل بيانات الحضور أولاً"
                    );

                    return;

                }


                // ========================================
                // تجهيز سجل الغياب
                // ========================================

                const record = {

                    grade:
                        grade,

                    className:
                        className,

                    subject:
                        subject,

                    date:
                        date,

                    period:
                        period,

                    totalStudents:
                        students.length,

                    presentCount:
                        students.filter(
                            (student, index) =>
                                attendance[index] !==
                                "absent"
                        ).length,

                    absentCount:
                        students.filter(
                            (student, index) =>
                                attendance[index] ===
                                "absent"
                        ).length,

                    students:
                        students.map(
                            (student, index) => ({

                                name:
                                    student.name,

                                specialization:
                                    student.specialization ||
                                    "",

                                status:
                                    attendance[index] ||
                                    "present"

                            })
                        )

                };


                // ========================================
                // إرسال البيانات للسيرفر
                // ========================================

                try {

                    const response =
                        await fetch(
                            `${API_URL}/api/attendance`,
                            {

                                // نوع الطلب
                                method: "POST",

                                // البيانات المطلوبة
                                headers: {

                                    "Content-Type":
                                        "application/json",

                                    // Token المدرس
                                    "Authorization":
                                        `Bearer ${teacherToken}`

                                },

                                // إرسال سجل الغياب
                                body:
                                    JSON.stringify(
                                        record
                                    )

                            }
                        );


                    // قراءة رد السيرفر
                    const result =
                        await response.json();


                    // ========================================
                    // التأكد من نجاح الحفظ
                    // ========================================

                    if (
                        !response.ok ||
                        !result.success
                    ) {

                        throw new Error(
                            result.message ||
                            "فشل إرسال الغياب"
                        );

                    }


                    // ========================================
                    // نجاح الإرسال
                    // ========================================

                    alert(
                        "تم إرسال الغياب بنجاح"
                    );


                    // إعادة الجميع إلى حاضر
                    attendance = {};


                    students.forEach(
                        (student, index) => {

                            attendance[index] =
                                "present";

                        }
                    );


                    renderStudents();

                    updateStats();

                } catch (error) {

                    console.error(
                        "Attendance Error:",
                        error
                    );


                    alert(
                        "فشل الاتصال بالسيرفر.\n\n" +
                        "تأكد أن server.js يعمل."
                    );

                }

            }
        );

    }


    // ========================================
    // تشغيل الإحصائيات أول مرة
    // ========================================

    updateStats();

});


// ========================================
// تسجيل خروج المدرس
// ========================================

const teacherLogoutBtn =
    document.getElementById(
        "teacherLogoutBtn"
    );


if (teacherLogoutBtn) {

    teacherLogoutBtn.addEventListener(
        "click",
        () => {

            // حذف Token الجلسة
            localStorage.removeItem(
                "attendanceToken"
            );


            // حذف نوع الحساب
            localStorage.removeItem(
                "attendanceRole"
            );


            // العودة لتسجيل دخول المدرس
            window.location.href =
                "teacher-login.html";

        }
    );

}
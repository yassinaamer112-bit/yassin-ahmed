const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const jwt = require("jsonwebtoken");
const path = require("path");

// ========================================
// إعدادات السيرفر
// ========================================

const app = express();
const PORT = process.env.PORT || 3000;

const JWT_SECRET =
    process.env.JWT_SECRET || "attendance-system-secret-2026";

const LOGIN_PASSWORDS = {
    admin: process.env.ADMIN_PASSWORD || "سعيد زكي",
    teacher: process.env.TEACHER_PASSWORD || "عماد الدين"
};

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// ========================================
// قاعدة البيانات
// تثبيت المسار داخل مجلد backend
// ========================================

const db = new Database(
    path.join(__dirname, "attendance.db")
);

db.pragma("journal_mode = WAL");

db.prepare(`
    CREATE TABLE IF NOT EXISTS attendance_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        grade TEXT NOT NULL,
        class_name TEXT NOT NULL,
        subject TEXT NOT NULL,
        date TEXT NOT NULL,
        period TEXT NOT NULL,
        total_students INTEGER NOT NULL,
        present_count INTEGER NOT NULL,
        absent_count INTEGER NOT NULL,
        students_json TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
`).run();

// ========================================
// أدوات مساعدة
// ========================================

function sendError(res, status, message) {
    return res.status(status).json({
        success: false,
        message
    });
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return sendError(
            res,
            401,
            "غير مصرح لك بالدخول."
        );
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
        return sendError(
            res,
            401,
            "صيغة التوكن غير صحيحة."
        );
    }

    try {
        req.user = jwt.verify(parts[1], JWT_SECRET);
        next();
    } catch (error) {
        return sendError(
            res,
            401,
            "جلسة الدخول غير صالحة أو انتهت."
        );
    }
}

function requireRole(role) {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            return sendError(
                res,
                403,
                "ليس لديك صلاحية لتنفيذ هذا الطلب."
            );
        }

        next();
    };
}

function parseStudents(json) {
    const students = JSON.parse(json);

    if (!Array.isArray(students)) {
        throw new Error("بيانات الطلاب ليست قائمة صحيحة.");
    }

    return students;
}

function formatRecord(row) {
    return {
        id: row.id,
        grade: row.grade,
        className: row.class_name,
        subject: row.subject,
        date: row.date,
        period: row.period,
        totalStudents: row.total_students,
        presentCount: row.present_count,
        absentCount: row.absent_count,
        students: parseStudents(row.students_json),
        createdAt: row.created_at
    };
}

// ========================================
// تسجيل الدخول
// ========================================

app.post("/api/login", (req, res) => {
    try {
        const { role, password } = req.body || {};

        if (
            !role ||
            !password ||
            !Object.prototype.hasOwnProperty.call(
                LOGIN_PASSWORDS,
                role
            )
        ) {
            return sendError(
                res,
                400,
                "من فضلك اختر نوع المستخدم وأدخل كلمة المرور."
            );
        }

        if (password !== LOGIN_PASSWORDS[role]) {
            return res.json({
                success: false,
                message: "كلمة المرور غير صحيحة."
            });
        }

        const token = jwt.sign(
            { role },
            JWT_SECRET,
            { expiresIn: "12h" }
        );

        return res.json({
            success: true,
            role,
            token,
            message: "تم تسجيل الدخول بنجاح."
        });
    } catch (error) {
        console.error("Login error:", error);

        return sendError(
            res,
            500,
            "حدث خطأ أثناء تسجيل الدخول."
        );
    }
});

// ========================================
// الصفحة الرئيسية وفحص الاتصال
// ========================================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Attendance Server is working",
        database: "Connected successfully"
    });
});

app.get("/api/health", (req, res) => {
    try {
        db.prepare("SELECT 1").get();

        res.json({
            success: true,
            server: "running",
            database: "connected"
        });
    } catch (error) {
        console.error("Health check error:", error);

        sendError(
            res,
            500,
            "تعذر الاتصال بقاعدة البيانات."
        );
    }
});

// ========================================
// تسجيل الغياب
// المدرس فقط
// ========================================

app.post(
    "/api/attendance",
    authenticateToken,
    requireRole("teacher"),
    (req, res) => {
        try {
            const {
                grade,
                className,
                subject,
                date,
                period,
                totalStudents,
                presentCount,
                absentCount,
                students
            } = req.body || {};

            if (
                !grade ||
                !className ||
                !subject ||
                !date ||
                !period ||
                !Array.isArray(students)
            ) {
                return sendError(
                    res,
                    400,
                    "بيانات الغياب غير مكتملة."
                );
            }

            const counts = [
                totalStudents,
                presentCount,
                absentCount
            ];

            const validCounts = counts.every(
                value =>
                    Number.isInteger(Number(value)) &&
                    Number(value) >= 0
            );

            if (!validCounts) {
                return sendError(
                    res,
                    400,
                    "أعداد الطلاب والحضور والغياب غير صحيحة."
                );
            }

            const total = Number(totalStudents);
            const present = Number(presentCount);
            const absent = Number(absentCount);

            if (present + absent !== total) {
                return sendError(
                    res,
                    400,
                    "إجمالي الحضور والغياب لا يساوي إجمالي الطلاب."
                );
            }

            const existingRecord = db.prepare(`
                SELECT id
                FROM attendance_records
                WHERE grade = ?
                  AND class_name = ?
                  AND subject = ?
                  AND date = ?
                  AND period = ?
            `).get(
                String(grade),
                String(className),
                String(subject),
                String(date),
                String(period)
            );

            if (existingRecord) {
                return res.json({
                    success: false,
                    message: "تم تسجيل غياب هذه الحصة بالفعل."
                });
            }

            const createdAt = new Date().toISOString();

            const result = db.prepare(`
                INSERT INTO attendance_records (
                    grade,
                    class_name,
                    subject,
                    date,
                    period,
                    total_students,
                    present_count,
                    absent_count,
                    students_json,
                    created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                String(grade),
                String(className),
                String(subject),
                String(date),
                String(period),
                total,
                present,
                absent,
                JSON.stringify(students),
                createdAt
            );

            return res.json({
                success: true,
                message: "تم حفظ الغياب",
                record: {
                    id: Number(result.lastInsertRowid),
                    grade,
                    className,
                    subject,
                    date,
                    period,
                    totalStudents: total,
                    presentCount: present,
                    absentCount: absent,
                    students,
                    createdAt
                }
            });
        } catch (error) {
            console.error("Save attendance error:", error);

            return sendError(
                res,
                500,
                "حدث خطأ أثناء حفظ الغياب."
            );
        }
    }
);

// ========================================
// جلب كل سجلات الغياب
// المدير فقط
// ========================================

app.get(
    "/api/attendance",
    authenticateToken,
    requireRole("admin"),
    (req, res) => {
        try {
            const rows = db.prepare(`
                SELECT *
                FROM attendance_records
                ORDER BY id DESC
            `).all();

            const records = rows.map(formatRecord);

            return res.json({
                success: true,
                records
            });
        } catch (error) {
            console.error("Load attendance error:", error);

            return sendError(
                res,
                500,
                "حدث خطأ أثناء تحميل السجلات."
            );
        }
    }
);

// ========================================
// التقرير الأسبوعي
// المدير فقط
// ========================================

app.get(
    "/api/attendance/weekly",
    authenticateToken,
    requireRole("admin"),
    (req, res) => {
        try {
            const {
                startDate,
                endDate,
                grade,
                className
            } = req.query;

            if (
                !startDate ||
                !endDate ||
                !grade ||
                !className
            ) {
                return sendError(
                    res,
                    400,
                    "يجب تحديد بداية الأسبوع ونهايته والصف والفصل."
                );
            }

            if (startDate > endDate) {
                return sendError(
                    res,
                    400,
                    "تاريخ بداية التقرير يجب ألا يكون بعد تاريخ نهايته."
                );
            }

            const rows = db.prepare(`
                SELECT *
                FROM attendance_records
                WHERE date >= ?
                  AND date <= ?
                  AND grade = ?
                  AND class_name = ?
                ORDER BY date ASC, id ASC
            `).all(
                startDate,
                endDate,
                String(grade),
                String(className)
            );

            const studentsMap = new Map();

            for (const row of rows) {
                const students = parseStudents(
                    row.students_json
                );

                for (const student of students) {
                    if (!student || !student.name) {
                        continue;
                    }

                    if (!studentsMap.has(student.name)) {
                        studentsMap.set(student.name, {
                            name: student.name,
                            specialization:
                                student.specialization || "",
                            sunday: 0,
                            monday: 0,
                            tuesday: 0,
                            wednesday: 0,
                            thursday: 0,
                            total: 0
                        });
                    }

                    const studentData =
                        studentsMap.get(student.name);

                    if (student.status === "absent") {
                        const day = new Date(
                            row.date + "T00:00:00"
                        ).getDay();

                        const dayFields = {
                            0: "sunday",
                            1: "monday",
                            2: "tuesday",
                            3: "wednesday",
                            4: "thursday"
                        };

                        if (dayFields[day]) {
                            studentData[dayFields[day]]++;
                        }

                        studentData.total++;
                    }
                }
            }

            const students = Array.from(
                studentsMap.values()
            );

            const totalLessons = rows.length;

            const totalPresent = rows.reduce(
                (sum, row) =>
                    sum + Number(row.present_count),
                0
            );

            const totalAbsent = rows.reduce(
                (sum, row) =>
                    sum + Number(row.absent_count),
                0
            );

            const totalAttendance =
                totalPresent + totalAbsent;

            const attendancePercentage =
                totalAttendance > 0
                    ? Number(
                        (
                            totalPresent /
                            totalAttendance *
                            100
                        ).toFixed(2)
                    )
                    : 0;

            return res.json({
                success: true,
                filters: {
                    startDate,
                    endDate,
                    grade,
                    className
                },
                totalLessons,
                totalPresent,
                totalAbsent,
                attendancePercentage,
                students
            });
        } catch (error) {
            console.error("Weekly report error:", error);

            return sendError(
                res,
                500,
                "حدث خطأ أثناء إنشاء التقرير الأسبوعي."
            );
        }
    }
);

// ========================================
// معالجة المسارات غير الموجودة
// ========================================

app.use((req, res) => {
    return sendError(
        res,
        404,
        "المسار المطلوب غير موجود."
    );
});

// ========================================
// معالجة الأخطاء
// ========================================

app.use((error, req, res, next) => {
    console.error("Server error:", error);

    if (res.headersSent) {
        return next(error);
    }

    return sendError(
        res,
        500,
        "حدث خطأ داخلي في السيرفر."
    );
});

// ========================================
// تشغيل السيرفر
// ========================================

const server = app.listen(PORT, () => {
    console.log("=================================");
    console.log("Attendance Server is running");
    console.log(`http://localhost:${PORT}`);
    console.log("Database connected successfully");
    console.log("=================================");
});

function shutdown() {
    server.close(() => {
        try {
            db.close();
        } finally {
            process.exit(0);
        }
    });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
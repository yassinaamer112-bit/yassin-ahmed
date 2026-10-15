const API_URL = "http://localhost:3000";

const form = document.getElementById("teacherLoginForm");
const passwordInput = document.getElementById("teacherPassword");
const message = document.getElementById("teacherLoginMessage");

form.addEventListener("submit", async (event) => {

    event.preventDefault();

    const password = passwordInput.value.trim();

    message.textContent = "جاري التحقق...";
    message.style.color = "#777";

    try {

        const response = await fetch(`${API_URL}/api/login`, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                role: "teacher",
                password: password
            })
        });

        const data = await response.json();

        if (!data.success) {

            message.textContent = data.message;
            message.style.color = "#d93025";

            return;
        }

        message.textContent = "تم تسجيل الدخول بنجاح";
        message.style.color = "#188038";
// ========================================
// حفظ جلسة المدرس في المتصفح
// ========================================

localStorage.setItem(
    "attendanceToken",
    data.token
);

localStorage.setItem(
    "attendanceRole",
    data.role
);
        setTimeout(() => {
            window.location.href = "teacher.html";
        }, 500);

    } catch (error) {

        console.error(error);

        message.textContent =
            "تعذر الاتصال بالسيرفر.";

        message.style.color = "#d93025";
    }

});
const API_URL = "/api";
let numbersData = [];

function toggleTheme() {
    document.body.classList.toggle("light-mode");
    const light = document.body.classList.contains("light-mode");
    const icon = document.getElementById("themeBtn")?.querySelector("i");
    if (icon) icon.className = light ? "fas fa-sun" : "fas fa-moon";
    localStorage.setItem("theme", light ? "light" : "dark");
}

document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("theme") === "light") {
        document.body.classList.add("light-mode");
        const icon = document.getElementById("themeBtn")?.querySelector("i");
        if (icon) icon.className = "fas fa-sun";
    }

    if (document.getElementById("dataTableBody")) {
        if (!sessionStorage.getItem("alyabotSession")) {
            window.location.href = "/index.html";
            return;
        }
        loadNumbers();
    }
});

function togglePassword() {
    const input = document.getElementById("passwordInput");
    if (input) input.type = input.type === "password" ? "text" : "password";
}

async function handleLogin() {
    const input = document.getElementById("passwordInput");
    const key = input?.value.trim();

    if (!key) {
        alert("Masukkan key login terlebih dahulu!");
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "login", key })
        });

        const data = await response.json();

        if (!response.ok || !data.status) {
            alert(data.message || "Key tidak valid!");
            return;
        }

        sessionStorage.setItem("alyabotSession", data.session);
        window.location.href = "/dashboard.html";
    } catch (error) {
        console.error("Login error:", error);
        alert("Gagal terhubung ke server. Periksa API Vercel.");
    }
}

async function apiPost(payload) {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Alya-Session": sessionStorage.getItem("alyabotSession") || ""
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (response.status === 401) {
        alert("Sesi admin berakhir. Silakan login ulang.");
        sessionStorage.removeItem("alyabotSession");
        window.location.href = "/index.html";
        throw new Error("Sesi admin tidak valid.");
    }

    if (!response.ok) {
        throw new Error(data.message || "Permintaan ke server gagal.");
    }

    return data;
}

function normalizeNumbers(data) {
    let list = [];

    if (Array.isArray(data)) list = data;
    else if (data && Array.isArray(data.numbers)) list = data.numbers;
    else if (data && Array.isArray(data.data)) list = data.data;
    else if (data && Array.isArray(data.database)) list = data.database;

    return list
        .filter(item => item && typeof item === "object" && item.number != null)
        .map(item => ({
            number: String(item.number),
            status: String(item.status || "active")
        }));
}

async function loadNumbers() {
    const tbody = document.getElementById("dataTableBody");
    if (!tbody) return;

    tbody.replaceChildren();

    const loadingRow = document.createElement("tr");
    const loadingCell = document.createElement("td");
    loadingCell.colSpan = 2;
    loadingCell.style.cssText = "padding:30px;color:#94a3b8;font-size:14px";
    loadingCell.textContent = "Memuat database...";
    loadingRow.appendChild(loadingCell);
    tbody.appendChild(loadingRow);

    try {
        const response = await fetch(
            `${API_URL}?action=numbers&_=${Date.now()}`,
            { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok || !data.status) {
            throw new Error(data.message || "Gagal mengambil database.");
        }

        numbersData = normalizeNumbers(data.numbers);
        renderTable(numbersData);
    } catch (error) {
        console.error("Gagal memuat database:", error);

        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 2;
        cell.style.cssText = "padding:30px;color:#ef4444;font-size:14px";
        cell.textContent = "Gagal memuat database. Silakan muat ulang halaman.";
        row.appendChild(cell);
        tbody.replaceChildren(row);
    }
}

function renderTable(data) {
    const tbody = document.getElementById("dataTableBody");
    if (!tbody) return;

    tbody.replaceChildren();

    if (!data || data.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 2;
        cell.style.cssText = "padding:30px;color:#94a3b8;font-size:14px";
        cell.textContent = "Belum ada nomor terdaftar";
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }

    data.forEach(item => {
        const row = document.createElement("tr");
        const numberCell = document.createElement("td");
        const statusCell = document.createElement("td");
        const badge = document.createElement("span");

        numberCell.textContent = item.number;
        badge.className = "status-badge";
        badge.textContent = item.status || "active";
        statusCell.appendChild(badge);
        row.append(numberCell, statusCell);
        tbody.appendChild(row);
    });
}

function searchTable() {
    const query = (document.getElementById("searchInput")?.value || "")
        .trim()
        .toLowerCase();

    renderTable(numbersData.filter(item =>
        item.number.toLowerCase().includes(query) ||
        item.status.toLowerCase().includes(query)
    ));
}

async function addNumber() {
    const input = document.getElementById("phoneInput");
    if (!input) return;

    const number = input.value.trim();

    if (!/^[+0-9][0-9+\-\s()]{7,24}$/.test(number)) {
        alert("Masukkan nomor yang valid!");
        return;
    }

    try {
        const data = await apiPost({ action: "add", number });

        if (!data.status) {
            alert("❌ " + (data.message || "Gagal menambah nomor."));
            return;
        }

        alert("✅ " + (data.message || "Nomor berhasil disimpan."));
        input.value = "";
        await loadNumbers();
    } catch (error) {
        console.error("Gagal menambah nomor:", error);

        if (error.message !== "Sesi admin tidak valid.") {
            alert("Gagal menambah nomor: " + (error.message || "Periksa koneksi API."));
        }
    }
}
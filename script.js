const DATABASE_RAW_URL =
    "https://gitlab.com/doo_id/aloffc-alyabot/-/raw/main/database.json";

async function loadNumbers() {
    const tbody = document.getElementById("dataTableBody");

    if (tbody) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");

        td.colSpan = 2;
        td.textContent = "Memuat database...";
        tr.appendChild(td);
        tbody.replaceChildren(tr);
    }

    try {
        const response = await fetch(
            DATABASE_RAW_URL + "?t=" + Date.now(),
            { cache: "no-store" }
        );

        if (!response.ok) {
            throw new Error("GitLab Raw HTTP " + response.status);
        }

        const rawData = await response.json();
        numbersData = normalizeNumbers(rawData);

        renderTable(numbersData);
    } catch (error) {
        console.error("Gagal membaca GitLab Raw:", error);

        // Fallback: coba ambil data dari API Vercel.
        try {
            const response = await fetch(
                API_URL + "?action=numbers&t=" + Date.now(),
                { cache: "no-store" }
            );

            const data = await response.json();

            if (!response.ok || !data.status) {
                throw new Error(data.message || "API gagal membaca database");
            }

            numbersData = normalizeNumbers(data.numbers ?? data);
            renderTable(numbersData);
        } catch (apiError) {
            console.error("Gagal membaca API:", apiError);
            numbersData = [];

            if (tbody) {
                const tr = document.createElement("tr");
                const td = document.createElement("td");

                td.colSpan = 2;
                td.textContent = "Database gagal dimuat. Coba refresh.";
                tr.appendChild(td);
                tbody.replaceChildren(tr);
            }
        }
    }
}

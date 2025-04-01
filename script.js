document.addEventListener('DOMContentLoaded', () => {
    // --- Data (Simulated Backend) ---
    const employees = {
        'dr': { name: 'Denis', initials: 'DR', color: 'var(--color-denis)' },
        'tg': { name: 'Thomas', initials: 'TG', color: 'var(--color-thomas)' },
        'mk': { name: 'Michael', initials: 'MK', color: 'var(--color-michael)' },
        'sk': { name: 'Sarah', initials: 'SK', color: 'var(--color-sarah)' },
        'unzugewiesen': { name: 'Unzugewiesen', initials: '-', color: 'var(--color-unassigned)' }
    };

    const statuses = {
        'neu': { text: 'Neu', cssClass: 'status-neu' },
        'überfällig': { text: 'Überfällig', cssClass: 'status-überfällig' },
        'termin_vereinbart': { text: 'Termin vereinbart', cssClass: 'status-termin_vereinbart' },
        'angebot_gesendet': { text: 'Angebot gesendet', cssClass: 'status-angebot_gesendet' }
        // Add more statuses here
    };

    const sources = {
        'akquise': 'Akquisekunden',
        'email': 'info@mail.de',
        'telefon': 'Telefonisch',
        'trustlocal': 'Trust Local',
        '11880': '11880'
    };

    // Sample request data
    let requestsData = [
        { id: 1, date: '2024-11-29', days_ago: 3, customer: 'Kölner Gesellschaft', source_key: 'akquise', object_city: 'Köln', object_district: 'Ehrenfeld', description: 'Reinigung von 3 Büroe...', details: '800 qm, Kund. wünscht Termin', status_key: 'überfällig', employee_key: 'tg' },
        { id: 2, date: '2024-12-01', days_ago: 1, customer: 'Schmidt GmbH', source_key: 'trustlocal', object_city: 'Düsseldorf', object_district: 'Hafen', description: 'Grundreinigung Lager', details: '1200 qm, dringend', status_key: 'angebot_gesendet', employee_key: 'dr' },
        { id: 3, date: '2024-12-02', days_ago: 0, customer: 'Müller & Söhne', source_key: 'email', object_city: 'Köln', object_district: 'Innenstadt', description: 'Fensterreinigung', details: '5-stöckiges Gebäude', status_key: 'neu', employee_key: 'unzugewiesen' },
        { id: 4, date: '2024-12-02', days_ago: 0, customer: 'Bäckerei Hoffmann', source_key: '11880', object_city: 'Bonn', object_district: 'Zentrum', description: 'Unterhaltsreinigung', details: '3 Filialen, regelmäßig', status_key: 'termin_vereinbart', employee_key: 'mk' },
        { id: 5, date: '2024-11-28', days_ago: 4, customer: 'Autohaus König', source_key: 'telefon', object_city: 'Köln', object_district: 'Porz', description: 'Reinigung Showroom', details: '600 qm, Glasflächen', status_key: 'überfällig', employee_key: 'sk' },
        // Add more sample data... (e.g., 20 more items for pagination)
        { id: 6, date: '2024-11-27', days_ago: 5, customer: 'Praxis Dr. Meyer', source_key: 'email', object_city: 'Leverkusen', object_district: '', description: 'Praxisreinigung', details: 'Wöchentlich, abends', status_key: 'angebot_gesendet', employee_key: 'dr' },
        { id: 7, date: '2024-11-26', days_ago: 6, customer: 'Restaurant Bella Italia', source_key: 'telefon', object_city: 'Köln', object_district: 'Sülz', description: 'Küchengrundreinigung', details: 'Dringend, vor Wiedereröffnung', status_key: 'neu', employee_key: 'tg' },
         { id: 8, date: '2024-11-25', days_ago: 7, customer: 'Anwaltskanzlei Fischer', source_key: 'akquise', object_city: 'Bonn', object_district: 'Bad Godesberg', description: 'Büroreinigung', details: 'Vertraulichkeit wichtig', status_key: 'termin_vereinbart', employee_key: 'mk' },

    ];

    // --- State Variables ---
    let currentPage = 1;
    const itemsPerPage = 5;
    let filteredRequests = [...requestsData]; // Start with all requests

    // --- DOM Elements ---
    const mainContent = document.getElementById('main-content');
    const sidebarLinks = document.querySelectorAll('.app-sidebar nav li');
    const views = document.querySelectorAll('.view');
    const requestTableBody = document.getElementById('request-table-body');
    const paginationInfo = document.getElementById('pagination-info');
    const currentPageSpan = document.getElementById('current-page');
    const prevPageButton = document.getElementById('prev-page');
    const nextPageButton = document.getElementById('next-page');
    const filterStatusSelect = document.getElementById('filter-status');
    const filterMitarbeiterSelect = document.getElementById('filter-mitarbeiter');
    // Add other filter selects if needed (Quelle, Datum)

    const btnNeueAnfrageFromDash = document.getElementById('btn-neue-anfrage-from-dash');
    const btnNeueAnfrageSidebar = document.querySelector('li[data-view="neue-anfrage"]');
    const btnCancelNeueAnfrage = document.getElementById('btn-cancel-neue-anfrage');
    const formNeueAnfrage = document.getElementById('form-neue-anfrage');
    const anfragedatumInput = document.getElementById('anfragedatum'); // Get date input


    // --- Functions ---

    // Format Date (e.g., DD.MM.YYYY)
    function formatDate(dateString) {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    }

     // Get Date Context (Heute, Gestern, X Tage) - Simplified
    function getDateContext(daysAgo) {
        if (daysAgo === 0) return "Heute";
        if (daysAgo === 1) return "Gestern";
        if (daysAgo > 1) return `(${daysAgo} Tage)`;
        return ""; // Should not happen with valid data
    }


    // Render the table rows
    function renderTable() {
        requestTableBody.innerHTML = ''; // Clear existing rows

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const requestsToDisplay = filteredRequests.slice(startIndex, endIndex);

        if (requestsToDisplay.length === 0 && filteredRequests.length > 0) {
             // Handle case where filtering results in empty page but data exists
             currentPage = 1; // Reset to page 1
             renderTable(); // Re-render
             return; // Exit to avoid rendering empty row
        } else if (requestsToDisplay.length === 0) {
             requestTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">Keine Anfragen gefunden.</td></tr>';
        }


        requestsToDisplay.forEach(req => {
            const employee = employees[req.employee_key] || employees['unzugewiesen'];
            const status = statuses[req.status_key] || { text: req.status_key, cssClass: '' };
            const source = sources[req.source_key] || req.source_key; // Fallback to key if not found
            const dateCtx = getDateContext(req.days_ago);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(req.date)}<span class="sub-text">${dateCtx}</span></td>
                <td>${req.customer}<span class="sub-text">${source}</span></td>
                <td>${req.object_city}<span class="sub-text">${req.object_district || ''}</span></td>
                <td>${req.description}<span class="sub-text">${req.details || ''}</span></td>
                <td><span class="status-badge ${status.cssClass}">${status.text}</span></td>
                <td>
                    <div class="employee-badge">
                        <div class="employee-initials ${req.employee_key}" style="background-color: ${employee.color};">
                            ${employee.initials}
                        </div>
                        <span>${employee.name}</span>
                    </div>
                </td>
                <td class="table-actions">
                    <button class="more-btn" title="Weitere Aktionen">...</button>
                    <!-- Add actual action buttons later if needed
                    <button title="Bearbeiten">&#9998;</button>
                    <button title="Löschen">&#128465;</button>
                    -->
                </td>
            `;
            requestTableBody.appendChild(row);
        });

        updatePagination();
    }

    // Update pagination controls and info
    function updatePagination() {
        const totalItems = filteredRequests.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        currentPageSpan.textContent = currentPage;
        prevPageButton.disabled = currentPage === 1;
        nextPageButton.disabled = currentPage === totalPages || totalPages === 0;

        const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
        const endItem = Math.min(currentPage * itemsPerPage, totalItems);

        paginationInfo.textContent = `Zeige ${startItem}-${endItem} von ${totalItems} Anfragen`;
    }

    // Handle page changes
    function changePage(newPage) {
        const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
        if (newPage >= 1 && newPage <= totalPages) {
            currentPage = newPage;
            renderTable();
        }
    }

    // Apply filters
    function applyFilters() {
        const statusFilter = filterStatusSelect.value;
        const mitarbeiterFilter = filterMitarbeiterSelect.value;
        // Get other filter values...

        filteredRequests = requestsData.filter(req => {
            const statusMatch = statusFilter === 'alle' || req.status_key === statusFilter;
            const mitarbeiterMatch = mitarbeiterFilter === 'alle' || req.employee_key === mitarbeiterFilter;
            // Add other filter conditions...
            return statusMatch && mitarbeiterMatch; // Combine conditions
        });

        currentPage = 1; // Reset to first page after filtering
        renderTable();
    }

     // Switch between views
    function switchView(viewId) {
        views.forEach(view => view.classList.remove('active'));
        sidebarLinks.forEach(link => link.classList.remove('active'));

        const activeView = document.getElementById(`view-${viewId}`);
        const activeLink = document.querySelector(`.app-sidebar nav li[data-view="${viewId}"]`);

        if (activeView) activeView.classList.add('active');
        if (activeLink) activeLink.classList.add('active');

         // Special handling for 'neue-anfrage' form prep
        if (viewId === 'neue-anfrage') {
            formNeueAnfrage.reset(); // Clear the form
             // Set default date to today
            const today = new Date().toISOString().split('T')[0];
            if(anfragedatumInput) anfragedatumInput.value = today;
        }
    }


    // --- Event Listeners ---
    prevPageButton.addEventListener('click', () => changePage(currentPage - 1));
    nextPageButton.addEventListener('click', () => changePage(currentPage + 1));

    filterStatusSelect.addEventListener('change', applyFilters);
    filterMitarbeiterSelect.addEventListener('change', applyFilters);
    // Add event listeners for other filters...

     // Sidebar Navigation
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const viewId = link.getAttribute('data-view');
            if (viewId) {
                switchView(viewId);
            }
        });
    });

     // "Neue Anfrage" button on Dashboard
    btnNeueAnfrageFromDash.addEventListener('click', () => switchView('neue-anfrage'));

    // Cancel button on "Neue Anfrage" form
    btnCancelNeueAnfrage.addEventListener('click', () => switchView('dashboard'));

    // Handle form submission (simulation)
    formNeueAnfrage.addEventListener('submit', (e) => {
        e.preventDefault();
        console.log("Form submitted (simulated)");
        // In a real app: gather form data, send to server, handle response
        const formData = new FormData(formNeueAnfrage);
        const newData = Object.fromEntries(formData.entries());
        console.log("New Request Data:", newData);

        // --- Basic Client-Side Addition (for demo purposes) ---
        // This is NOT robust and lacks proper validation/ID generation
        const newId = requestsData.length > 0 ? Math.max(...requestsData.map(r => r.id)) + 1 : 1;
        const today = new Date();
        const newRequest = {
            id: newId,
            date: today.toISOString().split('T')[0],
            days_ago: 0, // Assuming it's added today
            customer: newData.kundenname,
            source_key: newData.anfragequelle,
            object_city: newData.stadt,
            object_district: newData.stadtteil,
            description: newData['art-reinigung'], // Map form field correctly
            details: newData.beschreibung.substring(0, 30) + '...', // Truncate details for overview
            status_key: 'neu', // Default status
            employee_key: newData['zustaendiger-mitarbeiter'] || 'unzugewiesen'
        };
        requestsData.unshift(newRequest); // Add to the beginning of the main data array
        applyFilters(); // Re-filter and render to show the new item
        // --- End Basic Client-Side Addition ---


        alert('Neue Anfrage gespeichert (simuliert)!');
        switchView('dashboard'); // Go back to dashboard
    });


    // --- Initial Load ---
    applyFilters(); // Initial filter and render
    // switchView('dashboard'); // Ensure dashboard is active initially (redundant if HTML is set up correctly)

});

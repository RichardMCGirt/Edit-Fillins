document.addEventListener('DOMContentLoaded', function () {
    const airtableApiKey = 'patTGK9HVgF4n1zqK.cbc0a103ecf709818f4cd9a37e18ff5f68c7c17f893085497663b12f2c600054';
    const airtableBaseId = 'appeNSp44fJ8QYeY5';
    const airtableTableName = 'tblRp5bukUiw9tX9j';

    async function fetchData(offset = null) {
        let url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}?filterByFormula=Status='Pending'`;
        if (offset) {
            url += `&offset=${offset}`;
        }

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${airtableApiKey}`
            }
        });

        if (!response.ok) {
            console.error('Error fetching data from Airtable:', response.statusText);
            return { records: [] };
        }

        const data = await response.json();
        return data;
    }

  function displayData(records) {
    const container = document.getElementById('airtable-data');
    container.innerHTML = ''; // Clear old content

    records.forEach(record => {
        const fields = record.fields;
        const jobName = fields['Job Name'] || 'N/A';
        const customer = fields['Customer'] || 'N/A';
        const fieldManager = fields['Field-Manager'] || 'N/A';
        const materialsNeeded = fields['Materials Needed'] || 'N/A';
        const branch = fields['VanirOffice'] || 'N/A';

        // Build card UI
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <strong>${jobName}</strong>
            <small><b>Branch:</b> ${branch}</small>
            <small><b>Builder:</b> ${customer}</small>
            <small><b>Field Manager:</b> ${fieldManager}</small>
            <div class="editable" contenteditable="true" 
                 data-id="${record.id}" data-field="Materials Needed">${materialsNeeded}</div>
        `;

        container.appendChild(card);
    });

    // ✅ Handle inline editing with debounce (auto-save)
    function debounce(func, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), delay);
        };
    }

    container.querySelectorAll('.editable').forEach(cell => {
        const recordId = cell.dataset.id;
        const fieldName = cell.dataset.field;

        const saveEdit = debounce(async (el) => {
            const newValue = el.textContent.trim();
            await updateRecord(recordId, { [fieldName]: newValue });
            showToast('Changes saved!');
        }, 1000); // wait 1s after typing stops

        cell.addEventListener('input', () => {
            saveEdit(cell);
        });
    });
}

    async function fetchAllData() {
        document.getElementById('loading-indicator').style.display = 'block';
        document.getElementById('airtable-data').style.display = 'none';
        let allRecords = [];
        let offset = null;

        do {
            const data = await fetchData(offset);
            allRecords = allRecords.concat(data.records);
            offset = data.offset;
        } while (offset);

        // Sort records alphabetically by Branch
        allRecords.sort((a, b) => {
            const branchA = (a.fields['VanirOffice'] || '').toLowerCase();
            const branchB = (b.fields['VanirOffice'] || '').toLowerCase();
            if (branchA < branchB) return -1;
            if (branchA > branchB) return 1;
            return 0;
        });

        displayData(allRecords);
        document.getElementById('loading-indicator').style.display = 'none';
        document.getElementById('airtable-data').style.display = 'table';
    }

    async function updateRecord(id, fields) {
        const url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}/${id}`;
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${airtableApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fields })
        });

        if (!response.ok) {
            console.error('Error updating data in Airtable:', response.statusText);
        }

        return response.json();
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    fetchAllData();
});
// Add after displayData() or inside DOMContentLoaded
document.getElementById('search-input').addEventListener('input', function () {
    const searchTerm = this.value.toLowerCase();
    const cards = document.querySelectorAll('#airtable-data .card');

    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(searchTerm) ? 'block' : 'none';
    });
});


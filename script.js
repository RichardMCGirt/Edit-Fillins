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
        const tbody = document.getElementById('airtable-data').querySelector('tbody');
        records.forEach(record => {
            const fields = record.fields;
            const Customer = fields['Customer'] || 'N/A';
            const fieldManager = fields['FieldManager'] || 'N/A';
            const materialsNeeded = fields['Materials Needed'] || 'N/A';
            const status = fields['Status'] || 'N/A';
            const Branch = fields['VanirOffice'] || 'N/A';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${Customer}</td>
                <td>${fieldManager}</td>
                <td contenteditable="true" data-id="${record.id}" data-field="Materials Needed">${materialsNeeded}</td>
                <td>${status}</td>
                <td>${Branch}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    async function fetchAllData() {
        let allRecords = [];
        let offset = null;

        do {
            const data = await fetchData(offset);
            allRecords = allRecords.concat(data.records);
            offset = data.offset;
        } while (offset);

        displayData(allRecords);
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

    document.getElementById('submit-button').addEventListener('click', async () => {
        const tbody = document.getElementById('airtable-data').querySelector('tbody');
        const rows = tbody.querySelectorAll('tr');
        for (const row of rows) {
            const materialsNeededCell = row.querySelector('[contenteditable="true"]');
            const recordId = materialsNeededCell.dataset.id;
            const newValue = materialsNeededCell.textContent;

            await updateRecord(recordId, { 'Materials Needed': newValue });
        }

        alert('Changes submitted successfully!');
    });

    fetchAllData();
});

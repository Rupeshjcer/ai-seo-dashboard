/**
 * AI SEO Growth Dashboard - Reports JS
 */

document.addEventListener('DOMContentLoaded', () => {
    renderReportsList();
    
    document.getElementById('confirmGenerateBtn').addEventListener('click', function() {
        const btn = this;
        const originalText = btn.innerHTML;
        const name = document.getElementById('newReportName').value;
        
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Generating...';
        
        setTimeout(() => {
            const modal = bootstrap.Modal.getInstance(document.getElementById('reportModal'));
            modal.hide();
            
            btn.disabled = false;
            btn.innerHTML = originalText;
            
            showNotification(`Report "${name}" generated successfully!`, "success");
            
            const reports = JSON.parse(localStorage.getItem('seoReports') || '[]');
            reports.unshift({ name, type: 'Monthly Overview', date: new Date().toLocaleString(), status: 'Ready' });
            localStorage.setItem('seoReports', JSON.stringify(reports));

            // Prepend new report to list
            const tbody = document.getElementById('reportsList');
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><i class="bi bi-file-pdf text-danger me-2"></i> ${name}</td>
                <td>Monthly Overview</td>
                <td>Just now</td>
                <td><span class="badge bg-success">Ready</span></td>
                <td>
                    <button class="btn btn-sm btn-outline"><i class="bi bi-download"></i></button>
                    <button class="btn btn-sm btn-outline"><i class="bi bi-envelope"></i></button>
                </td>
            `;
            tbody.insertBefore(tr, tbody.firstChild);
            
        }, 1500);
    });
});

function renderReportsList() {
    const tbody = document.getElementById('reportsList');
    tbody.innerHTML = '';
    
    const reports = JSON.parse(localStorage.getItem('seoReports') || '[]');
    if (reports.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No reports generated yet. Create one to get started.</td></tr>';
        return;
    }
    
    reports.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><i class="bi bi-file-pdf text-danger me-2"></i> ${r.name}</td>
            <td>${r.type}</td>
            <td class="text-muted">${r.date}</td>
            <td><span class="badge bg-success">${r.status}</span></td>
            <td>
                <button class="btn btn-sm btn-outline" title="Download"><i class="bi bi-download"></i></button>
                <button class="btn btn-sm btn-outline" title="Email"><i class="bi bi-envelope"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

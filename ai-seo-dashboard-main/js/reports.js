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
    
    const reports = [
        { name: "Monthly Report - July", type: "Overview", date: "2 days ago", status: "Ready" },
        { name: "Technical Audit - example.com", type: "Tech SEO", date: "1 week ago", status: "Ready" },
        { name: "Competitor Analysis Q2", type: "Comparison", date: "2 weeks ago", status: "Ready" },
        { name: "Keyword Gap Analysis", type: "Custom", date: "1 month ago", status: "Ready" }
    ];
    
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

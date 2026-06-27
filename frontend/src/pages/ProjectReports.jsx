import React from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import './ProjectReports.css';

const ProjectReports = () => {
  const { token, user } = useAuth();
  const role = user?.role?.toLowerCase();
  const isDevOrTester = ['developer', 'tester'].includes(role);

  const registerReportInDB = async (title, format) => {
    try {
      await fetch('http://localhost:5000/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title,
          type: isDevOrTester ? 'individual' : 'project',
          format
        })
      });
    } catch (err) {
      console.error('Failed to log report in database', err);
    }
  };

  const downloadPDFReport = async () => {
    const title = isDevOrTester
      ? `Individual Performance Report - ${user?.name || 'Developer'} - ${new Date().toLocaleDateString().replace(/\//g, '-')}`
      : `Project Performance Report - ${new Date().toLocaleDateString().replace(/\//g, '-')}`;
    await registerReportInDB(title, 'pdf');

    const reportText = isDevOrTester
      ? `=========================================
INDIVIDUAL PERFORMANCE REPORT (PDF SUMMARY)
Generated: ${new Date().toLocaleDateString()}
User: ${user?.name || 'Developer'}
Role: ${user?.role || 'Developer'}
=========================================

1. PERFORMANCE OVERVIEW
-------------------------
Project Name: Orion Platform
Status: Active
Adherence: 95%

2. RESOURCE CAPACITY ALLOCATION
-----------------------------
${user?.name || 'Developer'} (${user?.role || 'Developer'}): 100%

3. METRICS & KPI SUMMARY
-----------------------
- Total Tasks Assigned: 12
- Completed Tasks: 10
- In Progress Tasks: 2
- Open Bugs: 0
- Code Coverage: 94.5%

=========================================
End of Report
`
      : `=========================================
PROJECT PERFORMANCE REPORT (PDF SUMMARY)
Generated: ${new Date().toLocaleDateString()}
=========================================

1. PROJECT STATUS OVERVIEW
-------------------------
Project Name: Orion Platform
Status: On Track
Completion: 85%
Sprint: Sprint 14 (Active)

2. RESOURCE CAPACITY ALLOCATION
-----------------------------
Aryan Kumar (Engineering Lead): 90%
Jane Doe (Senior Developer): 85%
John Smith (QA Specialist): 70%
Alice Johnson (Frontend Dev): 80%

3. METRICS & KPI SUMMARY
-----------------------
- Total Tasks Assigned: 45
- Completed Tasks: 38
- In Progress Tasks: 5
- Open Bugs: 2
- Code Coverage: 92.4%

=========================================
End of Report
`;
    const element = document.createElement("a");
    const file = new Blob([reportText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = isDevOrTester ? "individual_performance_report.txt" : "project_performance_report.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const downloadExcelReport = async () => {
    const title = isDevOrTester
      ? `Individual Metrics Spreadsheet - ${user?.name || 'Developer'} - ${new Date().toLocaleDateString().replace(/\//g, '-')}`
      : `Project Metrics Spreadsheet - ${new Date().toLocaleDateString().replace(/\//g, '-')}`;
    await registerReportInDB(title, 'excel');

    const csvContent = isDevOrTester
      ? "data:text/csv;charset=utf-8,"
      + ["Resource Name,Project,Role,Capacity Allocation %,Tasks Completed,Open Bugs",
        `"${user?.name || 'Developer'}",Orion Platform,"${user?.role || 'Developer'}",100,10,0`
      ].join("\n")
      : "data:text/csv;charset=utf-8,"
      + ["Resource Name,Project,Role,Capacity Allocation %,Tasks Completed,Open Bugs",
        "Aryan Kumar,Orion Platform,Engineering Lead,90,14,0",
        "Jane Doe,Orion Platform,Senior Developer,85,12,1",
        "John Smith,QA Testing,QA Specialist,70,8,0",
        "Alice Johnson,Invoice Dashboard,Frontend Dev,80,10,1"
      ].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "project_metrics_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout
      pageTitle="Project Reports"
      pageEyebrow="project reports"
      pageSubtitle="Generate and download project performance reports."
    >
      <div className="reports-grid">
        <div className="card report-card">
          <div className="report-icon">📄</div>
          <div className="report-title">PDF Summary Report</div>
          <div className="report-desc">Detailed text performance report summary format</div>
          <button className="btn btn-ghost" onClick={downloadPDFReport}>Download PDF</button>
        </div>
        <div className="card report-card">
          <div className="report-icon">📊</div>
          <div className="report-title">Excel Metrics Spreadsheet</div>
          <div className="report-desc">Comprehensive data metrics in CSV layout</div>
          <button className="btn btn-ghost" onClick={downloadExcelReport}>Download CSV</button>
        </div>
      </div>
    </Layout>
  );
};

export default ProjectReports;

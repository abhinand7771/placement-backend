const store = {
  students: [
    {
      student_id: 1,
      name: "Aarav Sharma",
      email: "aarav@example.com",
      phone: "9876543210",
      branch: "CSE",
      cgpa: "8.40",
      graduation_year: 2026,
    },
    {
      student_id: 2,
      name: "Diya Verma",
      email: "diya@example.com",
      phone: "9988776655",
      branch: "ECE",
      cgpa: "8.90",
      graduation_year: 2025,
    },
  ],
  companies: [
    { company_id: 1, company_name: "TechNova", location: "Bangalore", min_cgpa: "7.50" },
    { company_id: 2, company_name: "DataSphere", location: "Hyderabad", min_cgpa: "8.00" },
  ],
  jobs: [
    { job_id: 1, company_id: 1, role: "SDE Intern", salary_package: "12.00", last_date: "2026-04-10" },
    { job_id: 2, company_id: 2, role: "Data Analyst", salary_package: "9.50", last_date: "2026-04-15" },
  ],
  applications: [
    { application_id: 1, student_id: 1, job_id: 1, status: "Applied", applied_at: new Date().toISOString() },
  ],
  admins: [{ admin_id: 1, username: "admin", password: "admin123" }],
  counters: {
    students: 3,
    companies: 3,
    jobs: 3,
    applications: 2,
    admins: 2,
  },
};

module.exports = store;

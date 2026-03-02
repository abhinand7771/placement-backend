const express = require("express");
const { query, hasConnectionString } = require("../db");
const store = require("../data/fallbackStore");

const router = express.Router();

router.get("/", async (_req, res, next) => {
  try {
    if (!hasConnectionString) {
      return res.json({ ok: true, source: "fallback", data: store.companies });
    }
    const result = await query(
      "SELECT company_id, company_name, location, min_cgpa FROM companies ORDER BY company_id ASC"
    );
    return res.json({ ok: true, source: "database", data: result.rows });
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  const { company_name, location, min_cgpa } = req.body || {};
  if (!company_name || !company_name.trim()) {
    return res.status(400).json({ ok: false, message: "company_name is required" });
  }
  try {
    if (!hasConnectionString) {
      const created = {
        company_id: store.counters.companies++,
        company_name: company_name.trim(),
        location: location || null,
        min_cgpa: min_cgpa || null,
      };
      store.companies.push(created);
      return res.status(201).json({ ok: true, source: "fallback", data: created });
    }
    const result = await query(
      "INSERT INTO companies (company_name, location, min_cgpa) VALUES ($1,$2,$3) RETURNING company_id, company_name, location, min_cgpa",
      [company_name.trim(), location || null, min_cgpa || null]
    );
    return res.status(201).json({ ok: true, source: "database", data: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  const companyId = Number(req.params.id);
  try {
    if (!hasConnectionString) {
      const before = store.companies.length;
      const removedJobIds = store.jobs
        .filter((j) => j.company_id === companyId)
        .map((j) => j.job_id);
      store.companies = store.companies.filter((c) => c.company_id !== companyId);
      store.jobs = store.jobs.filter((j) => j.company_id !== companyId);
      store.applications = store.applications.filter(
        (a) => !removedJobIds.includes(a.job_id)
      );
      if (before === store.companies.length) {
        return res.status(404).json({ ok: false, message: "Company not found" });
      }
      return res.json({ ok: true, source: "fallback" });
    }
    const result = await query(
      "DELETE FROM companies WHERE company_id = $1 RETURNING company_id",
      [companyId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, message: "Company not found" });
    }
    return res.json({ ok: true, source: "database" });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

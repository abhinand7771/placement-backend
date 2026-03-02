const express = require("express");
const { query, hasConnectionString } = require("../db");
const store = require("../data/fallbackStore");

const router = express.Router();

router.get("/", async (_req, res, next) => {
  try {
    if (!hasConnectionString) {
      return res.json({ ok: true, source: "fallback", data: store.jobs });
    }
    const result = await query(
      "SELECT job_id, company_id, role, salary_package, last_date FROM jobs ORDER BY job_id ASC"
    );
    return res.json({ ok: true, source: "database", data: result.rows });
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  const { company_id, role, salary_package, last_date } = req.body || {};
  if (!company_id) {
    return res.status(400).json({ ok: false, message: "company_id is required" });
  }
  try {
    if (!hasConnectionString) {
      const exists = store.companies.some((c) => c.company_id === Number(company_id));
      if (!exists) {
        return res.status(400).json({ ok: false, message: "company_id does not exist" });
      }
      const created = {
        job_id: store.counters.jobs++,
        company_id: Number(company_id),
        role: role || null,
        salary_package: salary_package || null,
        last_date: last_date || null,
      };
      store.jobs.push(created);
      return res.status(201).json({ ok: true, source: "fallback", data: created });
    }
    const result = await query(
      "INSERT INTO jobs (company_id, role, salary_package, last_date) VALUES ($1,$2,$3,$4) RETURNING job_id, company_id, role, salary_package, last_date",
      [Number(company_id), role || null, salary_package || null, last_date || null]
    );
    return res.status(201).json({ ok: true, source: "database", data: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  const jobId = Number(req.params.id);
  try {
    if (!hasConnectionString) {
      const before = store.jobs.length;
      store.jobs = store.jobs.filter((j) => j.job_id !== jobId);
      store.applications = store.applications.filter((a) => a.job_id !== jobId);
      if (before === store.jobs.length) {
        return res.status(404).json({ ok: false, message: "Job not found" });
      }
      return res.json({ ok: true, source: "fallback" });
    }
    const result = await query("DELETE FROM jobs WHERE job_id = $1 RETURNING job_id", [jobId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, message: "Job not found" });
    }
    return res.json({ ok: true, source: "database" });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

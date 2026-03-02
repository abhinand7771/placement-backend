const express = require("express");
const { query, hasConnectionString } = require("../db");
const store = require("../data/fallbackStore");

const router = express.Router();

router.get("/", async (_req, res, next) => {
  try {
    if (!hasConnectionString) {
      return res.json({ ok: true, source: "fallback", data: store.applications });
    }
    const result = await query(
      "SELECT application_id, student_id, job_id, status, applied_at FROM applications ORDER BY application_id ASC"
    );
    return res.json({ ok: true, source: "database", data: result.rows });
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  const { student_id, job_id, status } = req.body || {};
  if (!student_id || !job_id) {
    return res.status(400).json({ ok: false, message: "student_id and job_id are required" });
  }
  try {
    if (!hasConnectionString) {
      const studentExists = store.students.some((s) => s.student_id === Number(student_id));
      const jobExists = store.jobs.some((j) => j.job_id === Number(job_id));
      if (!studentExists || !jobExists) {
        return res.status(400).json({ ok: false, message: "Invalid student_id or job_id" });
      }
      const created = {
        application_id: store.counters.applications++,
        student_id: Number(student_id),
        job_id: Number(job_id),
        status: status || "Applied",
        applied_at: new Date().toISOString(),
      };
      store.applications.push(created);
      return res.status(201).json({ ok: true, source: "fallback", data: created });
    }
    const result = await query(
      "INSERT INTO applications (student_id, job_id, status) VALUES ($1,$2,$3) RETURNING application_id, student_id, job_id, status, applied_at",
      [Number(student_id), Number(job_id), status || "Applied"]
    );
    return res.status(201).json({ ok: true, source: "database", data: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id/status", async (req, res, next) => {
  const applicationId = Number(req.params.id);
  const { status } = req.body || {};
  if (!status || !status.trim()) {
    return res.status(400).json({ ok: false, message: "status is required" });
  }
  try {
    if (!hasConnectionString) {
      const idx = store.applications.findIndex((a) => a.application_id === applicationId);
      if (idx === -1) {
        return res.status(404).json({ ok: false, message: "Application not found" });
      }
      store.applications[idx] = { ...store.applications[idx], status: status.trim() };
      return res.json({ ok: true, source: "fallback", data: store.applications[idx] });
    }
    const result = await query(
      "UPDATE applications SET status = $2 WHERE application_id = $1 RETURNING application_id, student_id, job_id, status, applied_at",
      [applicationId, status.trim()]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, message: "Application not found" });
    }
    return res.json({ ok: true, source: "database", data: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  const applicationId = Number(req.params.id);
  try {
    if (!hasConnectionString) {
      const before = store.applications.length;
      store.applications = store.applications.filter((a) => a.application_id !== applicationId);
      if (before === store.applications.length) {
        return res.status(404).json({ ok: false, message: "Application not found" });
      }
      return res.json({ ok: true, source: "fallback" });
    }
    const result = await query(
      "DELETE FROM applications WHERE application_id = $1 RETURNING application_id",
      [applicationId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, message: "Application not found" });
    }
    return res.json({ ok: true, source: "database" });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

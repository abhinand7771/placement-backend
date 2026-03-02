const express = require("express");
const { query, hasConnectionString } = require("../db");
const store = require("../data/fallbackStore");

const router = express.Router();

router.get("/", async (_req, res, next) => {
  try {
    if (!hasConnectionString) {
      return res.json({ ok: true, source: "fallback", data: store.students });
    }

    const result = await query(
      `
      SELECT student_id, name, email, phone, branch, cgpa, graduation_year
      FROM students
      ORDER BY student_id ASC
      `
    );
    return res.json({ ok: true, source: "database", data: result.rows });
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  const { name, email, phone, branch, cgpa, graduation_year } = req.body || {};

  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ ok: false, message: "Name is required" });
  }

  try {
    if (!hasConnectionString) {
      const created = {
        student_id: store.counters.students++,
        name: name.trim(),
        email: email || null,
        phone: phone || null,
        branch: branch || null,
        cgpa: cgpa || null,
        graduation_year: graduation_year ? Number(graduation_year) : null,
      };

      store.students.push(created);
      return res.status(201).json({ ok: true, source: "fallback", data: created });
    }

    const result = await query(
      `
      INSERT INTO students (name, email, phone, branch, cgpa, graduation_year)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING student_id, name, email, phone, branch, cgpa, graduation_year
      `,
      [
        name.trim(),
        email || null,
        phone || null,
        branch || null,
        cgpa || null,
        graduation_year ? Number(graduation_year) : null,
      ]
    );

    return res.status(201).json({
      ok: true,
      source: "database",
      data: result.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ ok: false, message: "Email already exists" });
    }
    return next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  const studentId = Number(req.params.id);
  const { name, email, phone, branch, cgpa, graduation_year } = req.body || {};

  try {
    if (!hasConnectionString) {
      const idx = store.students.findIndex((s) => s.student_id === studentId);
      if (idx === -1) {
        return res.status(404).json({ ok: false, message: "Student not found" });
      }
      const updated = {
        ...store.students[idx],
        name: name ?? store.students[idx].name,
        email: email ?? store.students[idx].email,
        phone: phone ?? store.students[idx].phone,
        branch: branch ?? store.students[idx].branch,
        cgpa: cgpa ?? store.students[idx].cgpa,
        graduation_year: graduation_year ?? store.students[idx].graduation_year,
      };
      store.students[idx] = updated;
      return res.json({ ok: true, source: "fallback", data: updated });
    }

    const result = await query(
      `
      UPDATE students
      SET
        name = COALESCE($2, name),
        email = COALESCE($3, email),
        phone = COALESCE($4, phone),
        branch = COALESCE($5, branch),
        cgpa = COALESCE($6, cgpa),
        graduation_year = COALESCE($7, graduation_year)
      WHERE student_id = $1
      RETURNING student_id, name, email, phone, branch, cgpa, graduation_year
      `,
      [studentId, name, email, phone, branch, cgpa, graduation_year]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, message: "Student not found" });
    }
    return res.json({ ok: true, source: "database", data: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  const studentId = Number(req.params.id);
  try {
    if (!hasConnectionString) {
      const before = store.students.length;
      store.students = store.students.filter((s) => s.student_id !== studentId);
      store.applications = store.applications.filter(
        (a) => a.student_id !== studentId
      );
      if (store.students.length === before) {
        return res.status(404).json({ ok: false, message: "Student not found" });
      }
      return res.json({ ok: true, source: "fallback" });
    }

    const result = await query(
      "DELETE FROM students WHERE student_id = $1 RETURNING student_id",
      [studentId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, message: "Student not found" });
    }
    return res.json({ ok: true, source: "database" });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

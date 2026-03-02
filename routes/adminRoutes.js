const express = require("express");
const { query, hasConnectionString } = require("../db");
const store = require("../data/fallbackStore");

const router = express.Router();

router.get("/", async (_req, res, next) => {
  try {
    if (!hasConnectionString) {
      return res.json({
        ok: true,
        source: "fallback",
        data: store.admins.map((a) => ({ admin_id: a.admin_id, username: a.username })),
      });
    }
    const result = await query("SELECT admin_id, username FROM admins ORDER BY admin_id ASC");
    return res.json({ ok: true, source: "database", data: result.rows });
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  const { username, password } = req.body || {};
  if (!username || !username.trim() || !password || !password.trim()) {
    return res.status(400).json({ ok: false, message: "username and password are required" });
  }
  try {
    if (!hasConnectionString) {
      if (store.admins.some((a) => a.username === username.trim())) {
        return res.status(409).json({ ok: false, message: "Username already exists" });
      }
      const created = {
        admin_id: store.counters.admins++,
        username: username.trim(),
        password: password.trim(),
      };
      store.admins.push(created);
      return res.status(201).json({
        ok: true,
        source: "fallback",
        data: { admin_id: created.admin_id, username: created.username },
      });
    }
    const result = await query(
      "INSERT INTO admins (username, password) VALUES ($1, $2) RETURNING admin_id, username",
      [username.trim(), password.trim()]
    );
    return res.status(201).json({ ok: true, source: "database", data: result.rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ ok: false, message: "Username already exists" });
    }
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  const adminId = Number(req.params.id);
  try {
    if (!hasConnectionString) {
      const before = store.admins.length;
      store.admins = store.admins.filter((a) => a.admin_id !== adminId);
      if (before === store.admins.length) {
        return res.status(404).json({ ok: false, message: "Admin not found" });
      }
      return res.json({ ok: true, source: "fallback" });
    }
    const result = await query("DELETE FROM admins WHERE admin_id = $1 RETURNING admin_id", [adminId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, message: "Admin not found" });
    }
    return res.json({ ok: true, source: "database" });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

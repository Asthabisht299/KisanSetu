require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 5000;

// -------------------- MIDDLEWARE --------------------

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "kisansetu",
  waitForConnections: true,
  connectionLimit: 10,
});

// -------------------- BASIC ROUTES --------------------

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the KisanSetu API!" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "running", project: "KisanSetu" });
});

app.get("/api/db-status", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ status: "connected", database: "kisansetu" });
  } catch (error) {
    console.error("Database connection error:", error.message);
    res.status(503).json({
      status: "disconnected",
      message: "Check your MySQL service and database configuration.",
    });
  }
});

// -------------------- PROCUREMENT CENTRES --------------------

app.get("/api/centres", async (req, res) => {
  try {
    const [centres] = await db.query(
      `SELECT *
       FROM procurement_centres
       WHERE is_active = TRUE
       ORDER BY name`
    );
    res.json(centres);
  } catch (error) {
    console.error("Error fetching centres:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch procurement centres.",
    });
  }
});

// -------------------- AVAILABLE SLOTS --------------------

app.get("/api/slots", async (req, res) => {
  try {
    const [slots] = await db.execute(
      `SELECT
         ps.id,
         ps.centre_id,
         pc.name AS centre_name,
         pc.district,
         ps.crop_type,
         ps.slot_date,
         ps.start_time,
         ps.end_time,
         ps.capacity_quintals,
         ps.booked_quintals,
         (ps.capacity_quintals - ps.booked_quintals)
           AS available_quintals,
         ps.status
       FROM procurement_slots ps
       JOIN procurement_centres pc
         ON ps.centre_id = pc.id
       WHERE ps.status = 'open'
         AND ps.slot_date >= CURDATE()
         AND pc.is_active = TRUE
       ORDER BY ps.slot_date, ps.start_time`
    );

    res.json({
      success: true,
      count: slots.length,
      slots,
    });
  } catch (error) {
    console.error("Error fetching procurement slots:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch procurement slots.",
    });
  }
});

// -------------------- FARMER REGISTRATION --------------------

app.post("/api/auth/register", async (req, res) => {
  try {
    const { full_name, phone, password } = req.body;

    if (
      typeof full_name !== "string" ||
      typeof phone !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, phone and password are required.",
      });
    }

    const name = full_name.trim();
    const cleanPhone = phone.trim();

    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Name must be between 2 and 100 characters.",
      });
    }

    if (!/^\+?[0-9]{10,15}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid phone number.",
      });
    }

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        success: false,
        message: "Password must be 8–72 characters long.",
      });
    }

    const [existing] = await db.execute(
      "SELECT id FROM farmers WHERE phone = ?",
      [cleanPhone]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "This phone number is already registered.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await db.execute(
      `INSERT INTO farmers (full_name, phone, password_hash)
       VALUES (?, ?, ?)`,
      [name, cleanPhone, passwordHash]
    );

    res.status(201).json({
      success: true,
      message: "Farmer registered successfully.",
      farmer: {
        id: result.insertId,
        full_name: name,
        phone: cleanPhone,
      },
    });
  } catch (error) {
    console.error("Registration error:", error.code || error.message);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "This phone number is already registered.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Unable to register farmer right now.",
    });
  }
});

// -------------------- FARMER LOGIN --------------------

app.post("/api/auth/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (
      typeof phone !== "string" ||
      typeof password !== "string" ||
      !phone.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Phone and password are required.",
      });
    }

    if (phone.length > 16 || password.length > 72) {
      return res.status(400).json({
        success: false,
        message: "Invalid login details.",
      });
    }

    const [farmers] = await db.execute(
      `SELECT id, full_name, phone, password_hash
       FROM farmers
       WHERE phone = ?
       LIMIT 1`,
      [phone.trim()]
    );

    if (farmers.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone number or password.",
      });
    }

    const farmer = farmers[0];
    const passwordMatches = await bcrypt.compare(
      password,
      farmer.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone number or password.",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured.");
    }

    const token = jwt.sign(
      { farmerId: farmer.id, role: "farmer" },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      success: true,
      message: "Login successful.",
      token,
      farmer: {
        id: farmer.id,
        full_name: farmer.full_name,
        phone: farmer.phone,
      },
    });
  } catch (error) {
    console.error("Farmer login error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to log in right now.",
    });
  }
});

// -------------------- STAFF LOGIN --------------------

app.post("/api/staff/auth/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (
      typeof phone !== "string" ||
      typeof password !== "string" ||
      !phone.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Phone and password are required.",
      });
    }

    const [staffMembers] = await db.execute(
      `SELECT
         s.id,
         s.full_name,
         s.phone,
         s.password_hash,
         s.centre_id,
         s.role,
         s.is_active,
         pc.name AS centre_name,
         pc.is_active AS centre_is_active
       FROM staff s
       JOIN procurement_centres pc
         ON s.centre_id = pc.id
       WHERE s.phone = ?
       LIMIT 1`,
      [phone.trim()]
    );

    if (staffMembers.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone number or password.",
      });
    }

    const staff = staffMembers[0];

    if (!staff.is_active || !staff.centre_is_active) {
      return res.status(403).json({
        success: false,
        message: "Staff account or procurement centre is inactive.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      staff.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone number or password.",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured.");
    }

    const token = jwt.sign(
      {
        staffId: staff.id,
        centreId: staff.centre_id,
        role: staff.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      success: true,
      message: "Staff login successful.",
      token,
      staff: {
        id: staff.id,
        full_name: staff.full_name,
        phone: staff.phone,
        centre_id: staff.centre_id,
        centre_name: staff.centre_name,
        role: staff.role,
      },
    });
  } catch (error) {
    console.error("Staff login error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to log in right now.",
    });
  }
});

// -------------------- FARMER AUTHENTICATION --------------------

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Access denied. Please log in.",
    });
  }

  let decoded;

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured.");
    }

    decoded = jwt.verify(
      authHeader.slice("Bearer ".length),
      process.env.JWT_SECRET
    );
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please log in again.",
    });
  }

  if (decoded.role !== "farmer" || !decoded.farmerId) {
    return res.status(403).json({
      success: false,
      message: "Farmer access required.",
    });
  }

  req.farmerId = decoded.farmerId;
  return next();
}

// -------------------- STAFF AUTHENTICATION --------------------

async function authenticateStaffToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Staff login required.",
    });
  }

  let decoded;

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured.");
    }

    decoded = jwt.verify(
      authHeader.slice("Bearer ".length),
      process.env.JWT_SECRET
    );
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired staff token.",
    });
  }

  if (
    !decoded.staffId ||
    !decoded.centreId ||
    !["staff", "manager"].includes(decoded.role)
  ) {
    return res.status(403).json({
      success: false,
      message: "Staff access required.",
    });
  }

  try {
    const [rows] = await db.execute(
      `SELECT
         s.id,
         s.centre_id,
         s.role,
         s.is_active,
         pc.is_active AS centre_is_active
       FROM staff s
       JOIN procurement_centres pc
         ON s.centre_id = pc.id
       WHERE s.id = ?
       LIMIT 1`,
      [decoded.staffId]
    );

    if (
      rows.length === 0 ||
      !rows[0].is_active ||
      !rows[0].centre_is_active ||
      Number(rows[0].centre_id) !== Number(decoded.centreId) ||
      rows[0].role !== decoded.role
    ) {
      return res.status(403).json({
        success: false,
        message: "Staff account is inactive or no longer authorized.",
      });
    }

    req.staffId = rows[0].id;
    req.centreId = rows[0].centre_id;
    req.staffRole = rows[0].role;

    return next();
  } catch (error) {
    console.error("Staff authentication error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to verify staff access right now.",
    });
  }
}


/* -------------------- STAFF CENTRE BOOKINGS -------------------- */

app.get(
  "/api/staff/bookings",
  authenticateStaffToken,
  async (req, res) => {
    try {
      const [bookings] = await db.execute(
        `SELECT
           b.id,
           b.booking_reference,
           b.quantity_quintals,
           b.status,
           b.payment_status,
           b.created_at,
           f.full_name AS farmer_name,
           f.phone AS farmer_phone,
           ps.crop_type,
           ps.slot_date,
           ps.start_time,
           ps.end_time,
           pc.name AS centre_name,
           pc.district
         FROM bookings b
         JOIN farmers f
           ON b.farmer_id = f.id
         JOIN procurement_slots ps
           ON b.slot_id = ps.id
         JOIN procurement_centres pc
           ON ps.centre_id = pc.id
         WHERE ps.centre_id = ?
         ORDER BY ps.slot_date ASC, ps.start_time ASC, b.created_at DESC`,
        [req.centreId]
      );

      res.json({
        success: true,
        count: bookings.length,
        bookings,
      });
    } catch (error) {
      console.error("Staff bookings error:", error.message);

      res.status(500).json({
        success: false,
        message: "Unable to fetch centre bookings.",
      });
    }
  }
);


/* -------------------- UPDATE STAFF BOOKING STATUS -------------------- */

app.patch(
  "/api/staff/bookings/:id/status",
  authenticateStaffToken,
  async (req, res) => {
    let connection;
    let transactionStarted = false;

    try {
      const bookingId = Number(req.params.id);
      const { status: newStatus } = req.body;

      if (!Number.isInteger(bookingId) || bookingId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid booking ID.",
        });
      }

      const allowedStatuses = [
        "confirmed",
        "checked_in",
        "procurement_in_progress",
        "completed",
        "cancelled",
      ];

      if (
        typeof newStatus !== "string" ||
        !allowedStatuses.includes(newStatus)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid booking status.",
        });
      }

      const allowedTransitions = {
        pending: ["confirmed", "cancelled"],
        confirmed: ["checked_in", "cancelled"],
        checked_in: ["procurement_in_progress"],
        procurement_in_progress: ["completed"],
        completed: [],
        cancelled: [],
      };

      connection = await db.getConnection();
      await connection.beginTransaction();
      transactionStarted = true;

      const [rows] = await connection.execute(
        `SELECT
           b.id,
           b.status,
           b.quantity_quintals,
           ps.id AS slot_id
         FROM bookings b
         JOIN procurement_slots ps
           ON b.slot_id = ps.id
         WHERE b.id = ?
           AND ps.centre_id = ?
         FOR UPDATE`,
        [bookingId, req.centreId]
      );

      if (rows.length === 0) {
        await connection.rollback();
        transactionStarted = false;

        return res.status(404).json({
          success: false,
          message: "Booking not found for your centre.",
        });
      }

      const booking = rows[0];
      const currentStatus = booking.status;
      const validNextStatuses =
        allowedTransitions[currentStatus] || [];

      if (!validNextStatuses.includes(newStatus)) {
        await connection.rollback();
        transactionStarted = false;

        return res.status(409).json({
          success: false,
          message:
            `Cannot change booking status from ${currentStatus} to ${newStatus}.`,
        });
      }

      // Release reserved capacity when staff cancel a booking.
      if (newStatus === "cancelled") {
        await connection.execute(
          `UPDATE procurement_slots
           SET booked_quintals = GREATEST(
             0,
             booked_quintals - ?
           )
           WHERE id = ?`,
          [booking.quantity_quintals, booking.slot_id]
        );
      }

      await connection.execute(
        `UPDATE bookings
         SET status = ?
         WHERE id = ?`,
        [newStatus, bookingId]
      );

      await connection.commit();
      transactionStarted = false;

      return res.json({
        success: true,
        message: "Booking status updated successfully.",
        booking: {
          id: bookingId,
          status: newStatus,
        },
      });
    } catch (error) {
      if (connection && transactionStarted) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error(
            "Staff status rollback error:",
            rollbackError.message
          );
        }
      }

      console.error(
        "Staff status update error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message: "Unable to update booking status.",
      });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
);

// -------------------- CREATE A BOOKING --------------------

app.post("/api/bookings", authenticateToken, async (req, res) => {
  let connection;

  try {
    const slotId = Number(req.body.slot_id);
    const quantity = Number(req.body.quantity_quintals);

    if (
      !Number.isInteger(slotId) ||
      slotId <= 0 ||
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid slot and quantity greater than zero.",
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [slots] = await connection.execute(
      `SELECT id, capacity_quintals, booked_quintals, status, slot_date
       FROM procurement_slots
       WHERE id = ?
       FOR UPDATE`,
      [slotId]
    );

    if (slots.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Procurement slot not found.",
      });
    }

    const slot = slots[0];
    const remaining =
      Number(slot.capacity_quintals) - Number(slot.booked_quintals);

    const slotDate = new Date(slot.slot_date)
      .toISOString()
      .slice(0, 10);

    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });

    if (
      slot.status !== "open" ||
      slotDate < today ||
      quantity > remaining
    ) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: "This slot is unavailable or has insufficient capacity.",
      });
    }

    const bookingReference =
      "KS" + Date.now() + Math.floor(Math.random() * 1000);

    const [result] = await connection.execute(
      `INSERT INTO bookings
       (booking_reference, farmer_id, slot_id, quantity_quintals)
       VALUES (?, ?, ?, ?)`,
      [bookingReference, req.farmerId, slotId, quantity]
    );

    await connection.execute(
      `UPDATE procurement_slots
       SET booked_quintals = booked_quintals + ?
       WHERE id = ?`,
      [quantity, slotId]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Booking created successfully.",
      booking: {
        id: result.insertId,
        booking_reference: bookingReference,
        slot_id: slotId,
        quantity_quintals: quantity,
        status: "pending",
      },
    });
  } catch (error) {
    if (connection) await connection.rollback();

    console.error("Booking creation error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to create booking right now.",
    });
  } finally {
    if (connection) connection.release();
  }
});

// -------------------- VIEW MY BOOKINGS --------------------

app.get("/api/bookings", authenticateToken, async (req, res) => {
  try {
    const [bookings] = await db.execute(
      `SELECT
         b.id,
         b.booking_reference,
         b.quantity_quintals,
         b.status,
         b.payment_status,
         b.created_at,
         ps.crop_type,
         ps.slot_date,
         ps.start_time,
         ps.end_time,
         pc.name AS centre_name,
         pc.district
       FROM bookings b
       JOIN procurement_slots ps ON b.slot_id = ps.id
       JOIN procurement_centres pc ON ps.centre_id = pc.id
       WHERE b.farmer_id = ?
       ORDER BY b.created_at DESC`,
      [req.farmerId]
    );

    res.json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Fetch bookings error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch your bookings right now.",
    });
  }
});

// -------------------- CANCEL A BOOKING --------------------

app.patch(
  "/api/bookings/:id/cancel",
  authenticateToken,
  async (req, res) => {
    let connection;

    try {
      const bookingId = Number(req.params.id);

      if (!Number.isInteger(bookingId) || bookingId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid booking ID.",
        });
      }

      connection = await db.getConnection();
      await connection.beginTransaction();

      const [bookings] = await connection.execute(
        `SELECT id, farmer_id, slot_id, quantity_quintals, status
         FROM bookings
         WHERE id = ? AND farmer_id = ?
         FOR UPDATE`,
        [bookingId, req.farmerId]
      );

      if (bookings.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: "Booking not found.",
        });
      }

      const booking = bookings[0];

      if (!["pending", "confirmed"].includes(booking.status)) {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: "Only pending or confirmed bookings can be cancelled.",
        });
      }

      const [slots] = await connection.execute(
        `SELECT id FROM procurement_slots WHERE id = ? FOR UPDATE`,
        [booking.slot_id]
      );

      if (slots.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: "The associated procurement slot was not found.",
        });
      }

      await connection.execute(
        `UPDATE bookings
         SET status = 'cancelled'
         WHERE id = ? AND farmer_id = ?`,
        [bookingId, req.farmerId]
      );

      await connection.execute(
        `UPDATE procurement_slots
         SET booked_quintals = GREATEST(0, booked_quintals - ?)
         WHERE id = ?`,
        [booking.quantity_quintals, booking.slot_id]
      );

      await connection.commit();

      res.json({
        success: true,
        message: "Booking cancelled successfully.",
        booking: { id: booking.id, status: "cancelled" },
      });
    } catch (error) {
      if (connection) await connection.rollback();

      console.error("Booking cancellation error:", error.message);
      res.status(500).json({
        success: false,
        message: "Unable to cancel booking right now.",
      });
    } finally {
      if (connection) connection.release();
    }
  }
);

// -------------------- FARMER PROFILE --------------------

app.get("/api/farmers/me", authenticateToken, async (req, res) => {
  try {
    const [farmers] = await db.execute(
      `SELECT id, full_name, phone, preferred_language, created_at
       FROM farmers
       WHERE id = ?`,
      [req.farmerId]
    );

    if (farmers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Farmer account not found.",
      });
    }

    res.json({
      success: true,
      message: "Farmer profile retrieved successfully.",
      farmer: farmers[0],
    });
  } catch (error) {
    console.error("Profile error:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not retrieve farmer profile.",
    });
  }
});

// -------------------- START SERVER --------------------

app.listen(PORT, () => {
  console.log(`KisanSetu backend running at http://localhost:${PORT}`);
});


/* ---------- MANAGER SLOT MANAGEMENT ---------- */

// List all slots for the manager's assigned centre
app.get(
  "/api/manager/slots",
  authenticateStaffToken,
  async (req, res) => {
    if (req.staffRole !== "manager") {
      return res.status(403).json({
        success: false,
        message: "Manager access required.",
      });
    }

    try {
      const [slots] = await db.execute(
        `SELECT
           id,
           centre_id,
           crop_type,
           slot_date,
           start_time,
           end_time,
           capacity_quintals,
           booked_quintals,
           capacity_quintals - booked_quintals AS available_quintals,
           status
         FROM procurement_slots
         WHERE centre_id = ?
         ORDER BY slot_date DESC, start_time`,
        [req.centreId]
      );

      return res.json({ success: true, slots });
    } catch (error) {
      console.error("Manager slots error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Unable to fetch slots.",
      });
    }
  }
);


// Create a new procurement slot
app.post(
  "/api/manager/slots",
  authenticateStaffToken,
  async (req, res) => {
    if (req.staffRole !== "manager") {
      return res.status(403).json({
        success: false,
        message: "Manager access required.",
      });
    }

    const { crop_type, slot_date, start_time, end_time, capacity_quintals } =
      req.body;

    const crop = typeof crop_type === "string" ? crop_type.trim() : "";
    const capacity = Number(capacity_quintals);
    const timePattern = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

    if (
      !crop ||
      crop.length > 50 ||
      typeof slot_date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(slot_date) ||
      typeof start_time !== "string" ||
      !timePattern.test(start_time) ||
      typeof end_time !== "string" ||
      !timePattern.test(end_time) ||
      start_time >= end_time ||
      !Number.isFinite(capacity) ||
      capacity <= 0 ||
      capacity > 10000000
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter valid crop, date, times and positive capacity.",
      });
    }

    try {
      const [centres] = await db.execute(
        `SELECT id
         FROM procurement_centres
         WHERE id = ? AND is_active = TRUE`,
        [req.centreId]
      );

      if (centres.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Your procurement centre is inactive.",
        });
      }

      // Prevent overlapping slots at the same centre.
      const [overlaps] = await db.execute(
        `SELECT id
         FROM procurement_slots
         WHERE centre_id = ?
           AND slot_date = ?
           AND status <> 'cancelled'
           AND start_time < ?
           AND end_time > ?
         LIMIT 1`,
        [req.centreId, slot_date, end_time, start_time]
      );

      if (overlaps.length > 0) {
        return res.status(409).json({
          success: false,
          message: "This time overlaps another slot at your centre.",
        });
      }

      const [result] = await db.execute(
        `INSERT INTO procurement_slots
          (centre_id, crop_type, slot_date, start_time, end_time,
           capacity_quintals, booked_quintals, status)
         VALUES (?, ?, ?, ?, ?, ?, 0, 'open')`,
        [
          req.centreId,
          crop,
          slot_date,
          start_time,
          end_time,
          capacity,
        ]
      );

      return res.status(201).json({
        success: true,
        message: "Procurement slot created successfully.",
        slotId: result.insertId,
      });
    } catch (error) {
      console.error("Create slot error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Unable to create slot.",
      });
    }
  }
);


// Open or close an existing slot
app.patch(
  "/api/manager/slots/:id/status",
  authenticateStaffToken,
  async (req, res) => {
    if (req.staffRole !== "manager") {
      return res.status(403).json({
        success: false,
        message: "Manager access required.",
      });
    }

    const slotId = Number(req.params.id);
    const { status } = req.body;

    if (
      !Number.isInteger(slotId) ||
      slotId <= 0 ||
      !["open", "closed"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Choose a valid slot and status.",
      });
    }

    try {
      const [result] = await db.execute(
        `UPDATE procurement_slots
         SET status = ?
         WHERE id = ?
           AND centre_id = ?
           AND status IN ('open', 'closed')`,
        [status, slotId, req.centreId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Slot not found or cannot be changed.",
        });
      }

      return res.json({
        success: true,
        message: `Slot ${status} successfully.`,
      });
    } catch (error) {
      console.error("Update slot status error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Unable to update slot status.",
      });
    }
  }
);

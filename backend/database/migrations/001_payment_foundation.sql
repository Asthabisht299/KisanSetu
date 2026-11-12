-- KisanSetu payment foundation
-- Run this migration against the existing `kisansetu` database.
-- This creates payment records separately from bookings. It does not alter
-- bookings.payment_status, so existing booking flows remain unchanged.

CREATE TABLE IF NOT EXISTS payment_transactions (
  id INT NOT NULL AUTO_INCREMENT,
  transaction_reference VARCHAR(40) NOT NULL,
  farmer_id INT NOT NULL,
  booking_id INT NULL,
  transaction_type ENUM('service_payment', 'crop_payout') NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  status ENUM('pending', 'processing', 'successful', 'failed', 'refunded')
    NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(30) NULL,
  provider VARCHAR(40) NOT NULL DEFAULT 'simulation',
  provider_reference VARCHAR(100) NULL,
  idempotency_key VARCHAR(100) NULL,
  description VARCHAR(255) NULL,
  created_by_staff_id INT NULL,
  approved_by_staff_id INT NULL,
  approved_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payment_transaction_reference (transaction_reference),
  UNIQUE KEY uq_payment_provider_reference (provider_reference),
  UNIQUE KEY uq_payment_idempotency_key (idempotency_key),
  KEY idx_payment_farmer_created (farmer_id, created_at),
  KEY idx_payment_booking (booking_id),
  KEY idx_payment_type_status (transaction_type, status),
  CONSTRAINT fk_payment_farmer
    FOREIGN KEY (farmer_id) REFERENCES farmers(id),
  CONSTRAINT fk_payment_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A single global booking-fee setting. Disabled and ₹0 by default.
CREATE TABLE IF NOT EXISTS booking_fee_settings (
  id TINYINT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  fee_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  updated_by_staff_id INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO booking_fee_settings (id, is_enabled, fee_amount)
VALUES (1, FALSE, 0.00);

-- ============================================================================
-- Water Meter Reading Portal - Initial Schema
-- Target: Amazon RDS PostgreSQL (no Supabase RLS)
-- Migration: 001_initial_schema.sql
-- ============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- Extensions
-- --------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- --------------------------------------------------------------------------
-- 1. users
-- --------------------------------------------------------------------------
CREATE TABLE users (
    id            uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         varchar     UNIQUE NOT NULL,
    full_name     varchar,
    phone         varchar,
    role          varchar     NOT NULL CHECK (role IN ('admin', 'manager', 'reader', 'city_contact')),
    cognito_sub   varchar     UNIQUE,
    timezone      varchar     DEFAULT 'America/Los_Angeles',
    preferences   jsonb       DEFAULT '{}',
    created_at    timestamptz DEFAULT now(),
    updated_at    timestamptz DEFAULT now()
);

-- --------------------------------------------------------------------------
-- 2. cities
-- --------------------------------------------------------------------------
CREATE TABLE cities (
    id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            varchar     NOT NULL,
    status          varchar     CHECK (status IN ('complete', 'read_pending', 'active', 'ready_to_download'))
                                DEFAULT 'complete',
    total_meters    int         DEFAULT 0,
    meters_read     int         DEFAULT 0,
    cycle_id        uuid,                     -- FK added after cycles table
    contact_name    varchar,
    contact_phone   varchar,
    contact_email   varchar,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

-- --------------------------------------------------------------------------
-- 3. manager_cities  (join table)
-- --------------------------------------------------------------------------
CREATE TABLE manager_cities (
    manager_id  uuid    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    city_id     uuid    NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    PRIMARY KEY (manager_id, city_id)
);

-- --------------------------------------------------------------------------
-- 4. cycles
-- --------------------------------------------------------------------------
CREATE TABLE cycles (
    id                      uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id                 uuid        NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    cycle_number            int         NOT NULL,
    start_date              date,
    end_date                date,
    status                  varchar     CHECK (status IN ('preparing', 'active', 'complete', 'archived'))
                                        DEFAULT 'preparing',
    previous_custfile_count int         DEFAULT 0,
    current_custfile_count  int         DEFAULT 0,
    difference              int         DEFAULT 0,
    created_at              timestamptz DEFAULT now()
);

-- Now add the deferred FK from cities -> cycles
ALTER TABLE cities
    ADD CONSTRAINT fk_cities_cycle
    FOREIGN KEY (cycle_id) REFERENCES cycles(id) ON DELETE SET NULL;

-- --------------------------------------------------------------------------
-- 5. routes
-- --------------------------------------------------------------------------
CREATE TABLE routes (
    id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id         uuid        NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    name            varchar,
    route_number    varchar     NOT NULL,
    status          varchar     DEFAULT 'pending',
    total_meters    int         DEFAULT 0,
    meters_read     int         DEFAULT 0,
    unread_meters   int         DEFAULT 0,
    rechecks        int         DEFAULT 0,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

-- --------------------------------------------------------------------------
-- 6. meters
-- --------------------------------------------------------------------------
CREATE TABLE meters (
    id                   uuid                  PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id              uuid                  REFERENCES cities(id) ON DELETE CASCADE,
    route_id             uuid                  REFERENCES routes(id) ON DELETE SET NULL,
    meter_number         varchar               NOT NULL,
    account_number       varchar,
    meter_type           varchar,
    address              varchar,
    location             geography(Point,4326),
    status               varchar               DEFAULT 'active',
    always_require_photo boolean               DEFAULT false,
    do_not_read          boolean               DEFAULT false,
    lid_notes            text,
    created_at           timestamptz           DEFAULT now(),
    updated_at           timestamptz           DEFAULT now()
);

-- --------------------------------------------------------------------------
-- 7. readers
-- --------------------------------------------------------------------------
CREATE TABLE readers (
    id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    manager_id  uuid        REFERENCES users(id) ON DELETE SET NULL,
    name        varchar     NOT NULL,
    email       varchar,
    phone       varchar,
    active      boolean     DEFAULT true,
    created_at  timestamptz DEFAULT now(),
    updated_at  timestamptz DEFAULT now()
);

-- --------------------------------------------------------------------------
-- 8. route_assignments
-- --------------------------------------------------------------------------
CREATE TABLE route_assignments (
    id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id        uuid        NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    reader_id       uuid        NOT NULL REFERENCES readers(id) ON DELETE CASCADE,
    manager_id      uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_split        boolean     DEFAULT false,
    split_start     int,
    split_end       int,
    status          varchar     CHECK (status IN ('assigned', 'in_progress', 'completed'))
                                DEFAULT 'assigned',
    started_at      timestamptz,
    completed_at    timestamptz,
    created_at      timestamptz DEFAULT now()
);

-- --------------------------------------------------------------------------
-- 9. readings
-- --------------------------------------------------------------------------
CREATE TABLE readings (
    id                  uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    meter_id            uuid        NOT NULL REFERENCES meters(id) ON DELETE CASCADE,
    reader_id           uuid        REFERENCES readers(id) ON DELETE SET NULL,
    cycle_id            uuid        REFERENCES cycles(id) ON DELETE SET NULL,
    route_id            uuid        REFERENCES routes(id) ON DELETE SET NULL,
    value               numeric,
    previous_value      numeric,
    delta_value         numeric,
    usage               numeric,
    average_usage       numeric,
    percentage          numeric,
    unit                varchar     DEFAULT 'gallons',
    reading_type        varchar,
    photo_url           text,
    gps_lat             numeric,
    gps_lon             numeric,
    note                text,
    note_code           varchar,
    comment             text,
    reader_note         text,
    status              varchar     CHECK (status IN ('pending', 'approved', 'rejected', 'certified'))
                                    DEFAULT 'pending',
    is_exception        boolean     DEFAULT false,
    exception_type      varchar     CHECK (exception_type IN ('high', 'low', 'zero', 'negative', 'double_high')),
    original_value      numeric,
    edited_by           uuid        REFERENCES users(id) ON DELETE SET NULL,
    edited_at           timestamptz,
    needs_reread        boolean     DEFAULT false,
    reread_reason       text,
    verified            boolean     DEFAULT false,
    city_status         varchar,
    reading_timestamp   timestamptz,
    created_at          timestamptz DEFAULT now(),
    updated_at          timestamptz DEFAULT now()
);

-- --------------------------------------------------------------------------
-- 10. custfiles
-- --------------------------------------------------------------------------
CREATE TABLE custfiles (
    id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id         uuid        REFERENCES cities(id) ON DELETE CASCADE,
    cycle_id        uuid        REFERENCES cycles(id) ON DELETE SET NULL,
    filename        varchar,
    s3_key          varchar,
    upload_date     timestamptz DEFAULT now(),
    new_meters      int         DEFAULT 0,
    previous_count  int         DEFAULT 0,
    current_count   int         DEFAULT 0,
    difference      int         DEFAULT 0,
    status          varchar     CHECK (status IN ('uploaded', 'processing', 'complete', 'error'))
                                DEFAULT 'uploaded'
);

-- --------------------------------------------------------------------------
-- 11. certifications
-- --------------------------------------------------------------------------
CREATE TABLE certifications (
    id                  uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    reading_id          uuid        REFERENCES readings(id) ON DELETE CASCADE,
    meter_id            uuid        REFERENCES meters(id) ON DELETE CASCADE,
    city_id             uuid        REFERENCES cities(id) ON DELETE CASCADE,
    cycle_id            uuid        REFERENCES cycles(id) ON DELETE SET NULL,
    certificate_number  varchar     UNIQUE,
    cert_type           varchar,
    certified_by        uuid        REFERENCES users(id) ON DELETE SET NULL,
    certified_at        timestamptz DEFAULT now(),
    data                jsonb
);

-- --------------------------------------------------------------------------
-- 12. reader_timestamps
-- --------------------------------------------------------------------------
CREATE TABLE reader_timestamps (
    id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    reader_id   uuid        REFERENCES readers(id) ON DELETE CASCADE,
    route_id    uuid        REFERENCES routes(id) ON DELETE CASCADE,
    reading_id  uuid        REFERENCES readings(id) ON DELETE SET NULL,
    action_type varchar,
    timestamp   timestamptz NOT NULL,
    gps_lat     numeric,
    gps_lon     numeric
);

-- --------------------------------------------------------------------------
-- 13. audit_log
-- --------------------------------------------------------------------------
CREATE TABLE audit_log (
    id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     uuid        REFERENCES users(id) ON DELETE SET NULL,
    action      varchar     NOT NULL,
    entity_type varchar,
    entity_id   uuid,
    old_value   jsonb,
    new_value   jsonb,
    created_at  timestamptz DEFAULT now()
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- readings
CREATE INDEX idx_readings_meter_cycle       ON readings (meter_id, cycle_id);
CREATE INDEX idx_readings_route_status      ON readings (route_id, status);
CREATE INDEX idx_readings_exception_status  ON readings (is_exception, status);
CREATE INDEX idx_readings_reader_timestamp  ON readings (reader_id, reading_timestamp);
CREATE INDEX idx_readings_cycle_status      ON readings (cycle_id, status);

-- meters
CREATE INDEX idx_meters_city_route          ON meters (city_id, route_id);
CREATE INDEX idx_meters_meter_number        ON meters (meter_number);
CREATE INDEX idx_meters_account_number      ON meters (account_number);
CREATE INDEX idx_meters_address_pattern     ON meters (address text_pattern_ops);

-- reader_timestamps
CREATE INDEX idx_reader_ts_reader_time      ON reader_timestamps (reader_id, timestamp);
CREATE INDEX idx_reader_ts_route_reader     ON reader_timestamps (route_id, reader_id);

-- routes
CREATE INDEX idx_routes_city_number         ON routes (city_id, route_number);

-- certifications
CREATE INDEX idx_certs_city_cycle_type      ON certifications (city_id, cycle_id, cert_type);

-- ============================================================================
-- Trigger: auto-update updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to every table that has an updated_at column
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN
        SELECT table_name
        FROM   information_schema.columns
        WHERE  table_schema = 'public'
          AND  column_name  = 'updated_at'
    LOOP
        EXECUTE format(
            'CREATE TRIGGER set_updated_at
             BEFORE UPDATE ON %I
             FOR EACH ROW
             EXECUTE FUNCTION trigger_set_updated_at();',
            tbl
        );
    END LOOP;
END;
$$;

COMMIT;

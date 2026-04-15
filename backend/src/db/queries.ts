// ---------------------------------------------------------------------------
// Reusable SQL query builders
// ---------------------------------------------------------------------------

/** Build a paginated SELECT wrapper. */
export function paginate(
  baseSql: string,
  page: number,
  pageSize: number
): { sql: string; offset: number; limit: number } {
  const safePage = Math.max(1, page);
  const safeSize = Math.min(Math.max(1, pageSize), 200);
  const offset = (safePage - 1) * safeSize;
  return {
    sql: `${baseSql} LIMIT ${safeSize} OFFSET ${offset}`,
    offset,
    limit: safeSize,
  };
}

/** Build a WHERE clause from a map of column=value conditions. */
export function buildWhere(
  conditions: Record<string, unknown>,
  startIndex = 1
): { clause: string; values: unknown[] } {
  const keys = Object.keys(conditions).filter(
    (k) => conditions[k] !== undefined
  );
  if (keys.length === 0) return { clause: '', values: [] };

  const parts: string[] = [];
  const values: unknown[] = [];
  keys.forEach((key, i) => {
    parts.push(`${key} = $${startIndex + i}`);
    values.push(conditions[key]);
  });

  return { clause: `WHERE ${parts.join(' AND ')}`, values };
}

// -- Cities -----------------------------------------------------------------

export const CITIES_LIST = `
  SELECT c.id, c.name, c.state, c.status, c.created_at,
         COUNT(DISTINCT m.id)::int AS meter_count
  FROM cities c
  JOIN manager_cities mc ON mc.city_id = c.id
  LEFT JOIN meters m ON m.city_id = c.id
  WHERE mc.user_id = $1
  GROUP BY c.id
  ORDER BY c.name
`;

export const CITY_DETAIL = `
  SELECT c.*,
         COUNT(DISTINCT m.id)::int AS meter_count,
         COUNT(DISTINCT rt.id)::int AS route_count
  FROM cities c
  LEFT JOIN meters m ON m.city_id = c.id
  LEFT JOIN routes rt ON rt.city_id = c.id
  WHERE c.id = $1
  GROUP BY c.id
`;

export const CITY_STATS = `
  SELECT
    COUNT(*) FILTER (WHERE r.is_exception = true AND r.status = 'pending')::int AS to_review,
    COUNT(*) FILTER (WHERE r.needs_reread = true AND r.status = 'pending')::int AS to_reread,
    COUNT(*) FILTER (WHERE r.status = 'certified')::int AS total_certified
  FROM readings r
  JOIN meters m ON m.id = r.meter_id
  WHERE m.city_id = $1
`;

// -- Routes -----------------------------------------------------------------

export const ROUTES_BY_CITY = `
  SELECT r.id, r.name, r.code, r.city_id, r.created_at,
         COUNT(DISTINCT m.id)::int AS meter_count
  FROM routes r
  LEFT JOIN meters m ON m.route_id = r.id
  WHERE r.city_id = $1
  GROUP BY r.id
  ORDER BY r.code
`;

export const ROUTE_DETAIL = `
  SELECT r.*,
         COUNT(DISTINCT m.id)::int AS meter_count
  FROM routes r
  LEFT JOIN meters m ON m.route_id = r.id
  WHERE r.id = $1
  GROUP BY r.id
`;

// -- Assignments ------------------------------------------------------------

export const ASSIGNMENTS_BY_CITY = `
  SELECT a.id, a.route_id, a.reader_id, a.cycle_id, a.status,
         a.assigned_at, a.completed_at,
         u.email AS reader_email,
         rt.name AS route_name, rt.code AS route_code
  FROM assignments a
  JOIN routes rt ON rt.id = a.route_id
  JOIN users u ON u.id = a.reader_id
  WHERE rt.city_id = $1
  ORDER BY rt.code, a.assigned_at DESC
`;

export const ASSIGNMENT_DETAIL = `
  SELECT a.*, u.email AS reader_email,
         rt.name AS route_name, rt.code AS route_code
  FROM assignments a
  JOIN routes rt ON rt.id = a.route_id
  JOIN users u ON u.id = a.reader_id
  WHERE a.id = $1
`;

// -- Readers ----------------------------------------------------------------

export const READERS_LIST = `
  SELECT u.id, u.email, u.full_name, u.phone, u.status, u.created_at
  FROM users u
  WHERE u.role = 'reader'
  ORDER BY u.full_name
`;

export const READER_DETAIL = `
  SELECT u.id, u.email, u.full_name, u.phone, u.status, u.created_at
  FROM users u
  WHERE u.id = $1 AND u.role = 'reader'
`;

// -- Meters -----------------------------------------------------------------

export const METERS_BY_CITY = `
  SELECT m.id, m.serial_number, m.address, m.route_id,
         m.latitude, m.longitude, m.status, m.created_at,
         rt.name AS route_name, rt.code AS route_code
  FROM meters m
  LEFT JOIN routes rt ON rt.id = m.route_id
  WHERE m.city_id = $1
  ORDER BY rt.code, m.address
`;

export const METER_DETAIL = `
  SELECT m.*, rt.name AS route_name, rt.code AS route_code
  FROM meters m
  LEFT JOIN routes rt ON rt.id = m.route_id
  WHERE m.id = $1
`;

export const METER_LOOKUP = `
  SELECT m.id, m.serial_number, m.address, m.city_id, m.route_id
  FROM meters m
  WHERE m.serial_number = $1
`;

// -- Readings ---------------------------------------------------------------

export const READINGS_EXCEPTIONS = `
  SELECT r.id, r.meter_id, r.value, r.reading_timestamp, r.status,
         r.is_exception, r.exception_reason, r.photo_url,
         m.address AS meter_address, m.serial_number,
         rt.code AS route_code
  FROM readings r
  JOIN meters m ON m.id = r.meter_id
  LEFT JOIN routes rt ON rt.id = m.route_id
  WHERE m.city_id = $1
    AND r.is_exception = true
    AND r.status = 'pending'
  ORDER BY rt.code, m.address
`;

export const READINGS_REREADS = `
  SELECT r.id, r.meter_id, r.value, r.reading_timestamp, r.status,
         r.needs_reread, r.reread_reason, r.photo_url,
         m.address AS meter_address, m.serial_number,
         rt.code AS route_code
  FROM readings r
  JOIN meters m ON m.id = r.meter_id
  LEFT JOIN routes rt ON rt.id = m.route_id
  WHERE m.city_id = $1
    AND r.needs_reread = true
  ORDER BY rt.code, m.address
`;

export const READING_HISTORY = `
  SELECT r.id, r.value, r.reading_timestamp, r.status,
         r.is_exception, r.needs_reread, r.edited_by, r.edited_at,
         r.photo_url
  FROM readings r
  WHERE r.meter_id = $1
  ORDER BY r.reading_timestamp DESC
  LIMIT 12
`;

export const READING_APPROVE = `
  UPDATE readings
  SET status = 'approved',
      value = COALESCE($2, value),
      original_value = CASE WHEN $2 IS NOT NULL THEN value ELSE original_value END,
      edited_by = CASE WHEN $2 IS NOT NULL THEN $3 ELSE edited_by END,
      edited_at = CASE WHEN $2 IS NOT NULL THEN NOW() ELSE edited_at END,
      updated_at = NOW()
  WHERE id = $1
  RETURNING *
`;

export const READING_REJECT = `
  UPDATE readings
  SET status = 'rejected',
      needs_reread = true,
      reread_reason = $2,
      updated_at = NOW()
  WHERE id = $1
  RETURNING *
`;

// -- Cycles -----------------------------------------------------------------

export const CYCLES_BY_CITY = `
  SELECT cy.id, cy.city_id, cy.name, cy.status,
         cy.start_date, cy.end_date, cy.created_at
  FROM cycles cy
  WHERE cy.city_id = $1
  ORDER BY cy.start_date DESC
`;

export const CYCLE_DETAIL = `
  SELECT cy.*
  FROM cycles cy
  WHERE cy.id = $1
`;

// -- Reports ----------------------------------------------------------------

export const REPORT_READER_TOTALS = `
  SELECT u.full_name AS reader,
         COUNT(r.id)::int AS total_readings,
         COUNT(r.id) FILTER (WHERE r.is_exception = true)::int AS exceptions,
         COUNT(r.id) FILTER (WHERE r.status = 'approved')::int AS approved
  FROM readings r
  JOIN assignments a ON a.id = r.assignment_id
  JOIN users u ON u.id = a.reader_id
  JOIN meters m ON m.id = r.meter_id
  WHERE m.city_id = $1
  GROUP BY u.id, u.full_name
  ORDER BY u.full_name
`;

export const REPORT_ROUTE_COUNT = `
  SELECT rt.code AS route_code, rt.name AS route_name,
         COUNT(DISTINCT m.id)::int AS meter_count,
         COUNT(r.id)::int AS reading_count,
         COUNT(r.id) FILTER (WHERE r.status = 'certified')::int AS certified
  FROM routes rt
  LEFT JOIN meters m ON m.route_id = rt.id
  LEFT JOIN readings r ON r.meter_id = m.id
  WHERE rt.city_id = $1
  GROUP BY rt.id, rt.code, rt.name
  ORDER BY rt.code
`;

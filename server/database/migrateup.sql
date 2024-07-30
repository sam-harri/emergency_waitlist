DO $$ BEGIN
    CREATE TYPE patient_status AS ENUM ('waiting', 'in treatment', 'treated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS Patients (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    code CHAR(3) NOT NULL UNIQUE,
    severity INTEGER NOT NULL CHECK (severity >= 1 AND severity <= 5),
    check_in_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status patient_status NOT NULL DEFAULT 'waiting'
);
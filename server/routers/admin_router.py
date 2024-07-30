import random
import string
from fastapi import APIRouter, Depends, HTTPException, Body
from psycopg2.extensions import cursor
from loguru import logger
from database import get_postgres
from models import Patient, PatientCreate, PatientUpdateStatus, PatientWithWaitTime
from typing import List, Tuple
from datetime import datetime, timedelta

admin_router = APIRouter()

def generate_code() -> str:
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=3))

def tuple_to_dict(patient_tuple):
    return {
        "id": patient_tuple[0],
        "name": patient_tuple[1],
        "code": patient_tuple[2],
        "severity": patient_tuple[3],
        "check_in_time": patient_tuple[4].isoformat(),
        "status": patient_tuple[5]
    }

def calculate_wait_time_and_position(cursor, patient) -> Tuple[int, int]:
    cursor.execute("""
        SELECT id, severity
        FROM Patients
        WHERE status = 'waiting'
        ORDER BY check_in_time;
    """)
    patients_in_queue = cursor.fetchall()

    wait_time = 0
    position_in_line = 0
    for i, p in enumerate(patients_in_queue):
        if p[0] == patient['id']:
            position_in_line = i + 1  # Position in line starts from 1
            break
        wait_time += p[1] * 10  # Example calculation

    return wait_time, position_in_line

@admin_router.post("/add_patient", response_model=Patient)
async def add_patient(patient: PatientCreate, cursor: cursor = Depends(get_postgres)):
    try:
        code = generate_code()
        with cursor as c:
            c.execute("BEGIN;")
            c.execute("""
                INSERT INTO Patients (name, code, severity, check_in_time, status)
                VALUES (%s, %s, %s, CURRENT_TIMESTAMP, 'waiting') RETURNING id, name, code, severity, check_in_time, status;
            """, (patient.name, code, patient.severity))
            new_patient = c.fetchone()
            c.execute("COMMIT;")
            logger.info(f"Patient added successfully: {new_patient}")
            return tuple_to_dict(new_patient)
    except Exception as e:
        c.execute("ROLLBACK;")
        logger.error(f"Failed to add patient: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@admin_router.put("/update_patient_status/{patient_id}", response_model=Patient)
async def update_patient_status(patient_id: int, status_update: PatientUpdateStatus, cursor: cursor = Depends(get_postgres)):
    try:
        with cursor as c:
            c.execute("BEGIN;")
            c.execute("""
                UPDATE Patients
                SET status = %s
                WHERE id = %s RETURNING id, name, code, severity, check_in_time, status;
            """, (status_update.status, patient_id))
            updated_patient = c.fetchone()
            if not updated_patient:
                raise HTTPException(status_code=404, detail="Patient not found")
            c.execute("COMMIT;")
            logger.info(f"Patient status updated successfully: {updated_patient}")
            return tuple_to_dict(updated_patient)
    except Exception as e:
        c.execute("ROLLBACK;")
        logger.error(f"Failed to update patient status: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@admin_router.get("/patients_in_line", response_model=List[PatientWithWaitTime])
async def get_patients_in_line(cursor: cursor = Depends(get_postgres)):
    try:
        with cursor as c:
            c.execute("""
                SELECT id, name, code, severity, check_in_time, status
                FROM Patients
                WHERE status = 'waiting'
                ORDER BY check_in_time;
            """)
            patients = c.fetchall()
            patients_with_wait_time = []
            for patient in patients:
                patient_dict = tuple_to_dict(patient)
                wait_time, position_in_line = calculate_wait_time_and_position(c, patient_dict)
                patients_with_wait_time.append({**patient_dict, "wait_time": wait_time, "position_in_line": position_in_line})
            logger.info("Fetched patients in line successfully")
            return patients_with_wait_time
    except Exception as e:
        logger.error(f"Failed to fetch patients in line: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@admin_router.get("/patients_in_treatment", response_model=List[Patient])
async def get_patients_in_treatment(cursor: cursor = Depends(get_postgres)):
    try:
        with cursor as c:
            c.execute("""
                SELECT id, name, code, severity, check_in_time, status
                FROM Patients
                WHERE status = 'in treatment'
                ORDER BY check_in_time;
            """)
            patients = c.fetchall()
            logger.info("Fetched patients in treatment successfully")
            return [tuple_to_dict(patient) for patient in patients]
    except Exception as e:
        logger.error(f"Failed to fetch patients in treatment: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@admin_router.get("/patients_treated", response_model=List[Patient])
async def get_patients_treated(cursor: cursor = Depends(get_postgres)):
    try:
        with cursor as c:
            c.execute("""
                SELECT id, name, code, severity, check_in_time, status
                FROM Patients
                WHERE status = 'treated'
                ORDER BY check_in_time DESC
                LIMIT 10;
            """)
            patients = c.fetchall()
            logger.info("Fetched treated patients successfully")
            return [tuple_to_dict(patient) for patient in patients]
    except Exception as e:
        logger.error(f"Failed to fetch treated patients: {e}")
        raise HTTPException(status_code=400, detail=str(e))

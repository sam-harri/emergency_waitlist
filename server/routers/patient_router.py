from typing import Tuple
from fastapi import APIRouter, Depends, HTTPException, Path
from psycopg2.extensions import cursor
from loguru import logger
from database import get_postgres
from models import Patient, PatientWithWaitTime
from datetime import datetime

patient_router = APIRouter()

def tuple_to_dict(patient_tuple):
    return {
        "id": patient_tuple[0],
        "name": patient_tuple[1],
        "code": patient_tuple[2],
        "severity": patient_tuple[3],
        "check_in_time": patient_tuple[4].isoformat(),
        "status": patient_tuple[5]
    }

@patient_router.get("/waitlist", response_model=PatientWithWaitTime)
async def get_patient_wait_time(code: str, name: str, cursor: cursor = Depends(get_postgres)):
    try:
        with cursor as c:
            c.execute("""
                SELECT id, name, code, severity, check_in_time, status
                FROM Patients
                WHERE code = %s AND name = %s;
            """, (code, name))
            patient = c.fetchone()
            if not patient:
                raise HTTPException(status_code=404, detail="Patient not found")
            patient_dict = tuple_to_dict(patient)
            wait_time, position_in_line = calculate_wait_time(c, patient_dict)
            logger.info(f"Wait time and position in line calculated for patient {patient_dict['id']}: {wait_time}, {position_in_line}")
            return {**patient_dict, "wait_time": wait_time, "position_in_line": position_in_line}
    except Exception as e:
        logger.error(f"Failed to fetch patient wait time: {e}")
        raise HTTPException(status_code=400, detail=str(e))


def calculate_wait_time(cursor, patient) -> Tuple[int, int]:
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
            return wait_time, position_in_line
        wait_time += p[1] * 10  # Example calculation

    return 0,0
from pydantic import BaseModel
from enum import Enum
from typing import List

class PatientStatus(str, Enum):
    waiting = 'waiting'
    in_treatment = 'in treatment'
    treated = 'treated'

class PatientCreate(BaseModel):
    name: str
    severity: int

class PatientUpdateStatus(BaseModel):
    status: PatientStatus

class Patient(BaseModel):
    id: int
    name: str
    code: str
    severity: int
    check_in_time: str
    status: PatientStatus

class PatientWithWaitTime(Patient):
    wait_time: int
    position_in_line: int
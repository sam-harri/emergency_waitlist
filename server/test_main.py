import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def initialize_database():
    from database import init_postgres
    init_postgres()
    yield

def test_app_lifecycle():
    # Step 1: Add a new patient
    response = client.post("/admin/add_patient", json={"name": "John Doe", "severity": 3})
    assert response.status_code == 200
    new_patient = response.json()
    patient_id = new_patient['id']
    patient_code = new_patient['code']

    # Step 2: Get patients in line
    response = client.get("/admin/patients_in_line")
    assert response.status_code == 200
    patients_in_line = response.json()
    assert any(patient['id'] == patient_id for patient in patients_in_line)

    # Step 3: Check waitlist for the new patient
    response = client.get(f"/patient/waitlist/{patient_code}")
    assert response.status_code == 200
    patient_waitlist_info = response.json()
    assert patient_waitlist_info['id'] == patient_id

    # Step 4: Update patient status to "in treatment"
    response = client.put(f"/admin/update_patient_status/{patient_id}", json={"status": "in treatment"})
    assert response.status_code == 200
    updated_patient = response.json()
    assert updated_patient['status'] == 'in treatment'

    # Step 5: Get patients in treatment
    response = client.get("/admin/patients_in_treatment")
    assert response.status_code == 200
    patients_in_treatment = response.json()
    assert any(patient['id'] == patient_id for patient in patients_in_treatment)

    # Step 6: Update patient status to "treated"
    response = client.put(f"/admin/update_patient_status/{patient_id}", json={"status": "treated"})
    assert response.status_code == 200
    updated_patient = response.json()
    assert updated_patient['status'] == 'treated'

    # Step 7: Get patients treated
    response = client.get("/admin/patients_treated")
    assert response.status_code == 200
    patients_treated = response.json()
    assert any(patient['id'] == patient_id for patient in patients_treated)

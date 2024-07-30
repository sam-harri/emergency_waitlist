"use client";
import React, { useEffect, useState } from 'react';
import axiosInstance from '@/axiosinstance';
import { CiCirclePlus } from "react-icons/ci";
import { IoArrowBackSharp } from "react-icons/io5";
import { FaGithub } from 'react-icons/fa';
import Link from 'next/link';

interface Patient {
    id: number;
    name: string;
    code: string;
    severity: number;
    check_in_time: string;
    status: string;
    wait_time?: number;
    position_in_line?: number;
    wait_duration?: string; // New property for displaying the wait duration
}

const AdminDashboard: React.FC = () => {
    const [patientsInLine, setPatientsInLine] = useState<Patient[]>([]);
    const [patientsInTreatment, setPatientsInTreatment] = useState<Patient[]>([]);
    const [patientsTreated, setPatientsTreated] = useState<Patient[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [newPatientName, setNewPatientName] = useState('');
    const [newPatientSeverity, setNewPatientSeverity] = useState(1);
    const [newPatientCode, setNewPatientCode] = useState<string | null>(null);

    useEffect(() => {
        fetchPatientsInLine();
        fetchPatientsInTreatment();
        fetchPatientsTreated();
    }, []);

    const calculateWaitDuration = (checkInTime: string): string => {
        const checkInDate = new Date(checkInTime);
        const now = new Date();
        const tzOffset = now.getTimezoneOffset() * 60000;
        const diffMs = now.getTime() - checkInDate.getTime() + tzOffset;
        const diffHrs = Math.floor((diffMs % 86400000) / 3600000);
        const diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000);
        return `${diffHrs}h ${diffMins}m`;
    };

    const fetchPatientsInLine = async () => {
        try {
            const response = await axiosInstance.get('/admin/patients_in_line');
            const patients = response.data.map((patient: Patient) => ({
                ...patient,
                wait_duration: calculateWaitDuration(patient.check_in_time)
            }));
            setPatientsInLine(patients);
        } catch (error) {
            console.error('Error fetching patients in line:', error);
        }
    };

    const fetchPatientsInTreatment = async () => {
        try {
            const response = await axiosInstance.get('/admin/patients_in_treatment');
            setPatientsInTreatment(response.data);
        } catch (error) {
            console.error('Error fetching patients in treatment:', error);
        }
    };

    const fetchPatientsTreated = async () => {
        try {
            const response = await axiosInstance.get('/admin/patients_treated');
            setPatientsTreated(response.data);
        } catch (error) {
            console.error('Error fetching patients treated:', error);
        }
    };

    const handleAddPatient = async () => {
        try {
            const response = await axiosInstance.post('/admin/add_patient', {
                name: newPatientName,
                severity: newPatientSeverity,
            });
            if (response.status === 200) {
                setNewPatientCode(response.data.code);
                fetchPatientsInLine();
            }
        } catch (error) {
            console.error('Error adding new patient:', error);
        }
    };

    const moveToTreatment = async (patientId: number) => {
        try {
            await axiosInstance.put(`/admin/update_patient_status/${patientId}`, { status: 'in treatment' });
            fetchPatientsInLine();
            fetchPatientsInTreatment();
        } catch (error) {
            console.error('Error moving patient to treatment:', error);
        }
    };

    const moveToTreated = async (patientId: number) => {
        try {
            await axiosInstance.put(`/admin/update_patient_status/${patientId}`, { status: 'treated' });
            fetchPatientsInTreatment();
            fetchPatientsTreated();
        } catch (error) {
            console.error('Error moving patient to treated:', error);
        }
    };

    return (
        <div className="container mx-auto min-h-screen p-4">
            <header className="flex h-16 w-full items-center justify-center border-b-2 border-b-gray-500 text-black mb-12">
                <div className="absolute left-0 flex items-center justify-center pl-4">
                    <a href="https://github.com/sam-harri/emergency_waitlist">
                        <FaGithub size={24} />
                    </a>
                    <Link href="/" className="text-gray-600 border border-white hover:scale-110 px-4 rounded flex items-center space-x-2 ml-6">
                        <IoArrowBackSharp />Back
                    </Link>
                </div>
                <div className="text-2xl font-bold">Emergency Waitlist - Admin Panel</div>
            </header>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2">
                    <div className="flex justify-start items-center mb-4">
                        <h2 className="text-xl font-bold">Patients in Line</h2>
                        <button
                            onClick={() => setShowModal(true)}
                            className="text-gray-600 border border-white hover:scale-110 px-4 rounded flex items-center space-x-2 ml-6"
                        >
                            <CiCirclePlus size={24} />
                            <span>Add Patient</span>
                        </button>
                    </div>
                    <div className="relative overflow-x-auto sm:rounded-lg shadow-md">
                        <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Name</th>
                                    <th scope="col" className="px-6 py-3">Severity</th>
                                    <th scope="col" className="px-6 py-3">Time Waited</th>
                                    <th scope="col" className="px-6 py-3">Position</th>
                                    <th scope="col" className="px-6 py-3">Code</th>
                                    <th scope="col" className="px-6 py-3"><span className="sr-only">Move to Treatment</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {patientsInLine.map((patient) => (
                                    <tr key={patient.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                        <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{patient.name}</th>
                                        <td className="px-6 py-4">{patient.severity}</td>
                                        <td className="px-6 py-4">{patient.wait_duration}</td>
                                        <td className="px-6 py-4">{patient.position_in_line}</td>
                                        <td className="px-6 py-4">{patient.code}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => moveToTreatment(patient.id)}
                                                className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                                            >
                                                Move to Treatment
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="space-y-4">
                    <h2 className="text-xl font-bold">Patients in Treatment</h2>
                    <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                        <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Name</th>
                                    <th scope="col" className="px-6 py-3">Severity</th>
                                    <th scope="col" className="px-6 py-3"><span className="sr-only">Move to Treated</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {patientsInTreatment.map((patient) => (
                                    <tr key={patient.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                        <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{patient.name}</th>
                                        <td className="px-6 py-4">{patient.severity}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => moveToTreated(patient.id)}
                                                className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                                            >
                                                Move to Treated
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <h2 className="text-xl font-bold mb-4">Patients Treated</h2>
                    <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                        <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Name</th>
                                    <th scope="col" className="px-6 py-3">Severity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {patientsTreated.map((patient) => (
                                    <tr key={patient.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                        <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{patient.name}</th>
                                        <td className="px-6 py-4">{patient.severity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-8 rounded-lg shadow-lg relative">
                        <button
                            onClick={() => { setShowModal(false); setNewPatientCode(null); }}
                            className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
                        >
                            &times;
                        </button>
                        <h2 className="text-2xl mb-4">Add New Patient</h2>
                        <div className="mb-4">
                            <label className="block text-gray-700">Name</label>
                            <input
                                type="text"
                                value={newPatientName}
                                onChange={(e) => setNewPatientName(e.target.value)}
                                className="w-full px-4 py-2 border rounded"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700">Severity</label>
                            <input
                                type="number"
                                value={newPatientSeverity}
                                onChange={(e) => setNewPatientSeverity(Number(e.target.value))}
                                className="w-full px-4 py-2 border rounded"
                                min="1"
                                max="10"
                            />
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={handleAddPatient}
                                className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
                            >
                                Add
                            </button>
                        </div>
                        {newPatientCode && (
                            <div className="mt-4 p-4 bg-gray-100 border border-gray-300 rounded">
                                <p>New Patient Code: <strong>{newPatientCode}</strong></p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;

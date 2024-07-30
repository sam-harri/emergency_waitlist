"use client";
import React, { useState } from 'react';
import axiosInstance from '@/axiosinstance';

const PatientCheck: React.FC = () => {
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [waitTime, setWaitTime] = useState<number | null>(null);
    const [position, setPosition] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const checkWaitTime = async () => {
        try {
            const response = await axiosInstance.get('/patient/waitlist', {
                params: { code, name }
            });
            const data = response.data;
            if (data.position_in_line === 0 && data.wait_time === 0) {
                setError('Patient has been seen already.');
                setWaitTime(null);
                setPosition(null);
                return;
            }
            setWaitTime(data.wait_time);
            setPosition(data.position_in_line);
            setError(null);
        } catch (error) {
            console.error('Error fetching patient wait time:', error);
            setError('Patient not found. Please check your code and name.');
            setWaitTime(null);
            setPosition(null);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Check Your Wait Time</h2>
                <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">3-Letter Code</label>
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                    />
                </div>
                <button
                    onClick={checkWaitTime}
                    className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                    Check Wait Time
                </button>
                {error && <div className="mt-4 text-red-500 text-center">{error}</div>}
                {waitTime !== null && position !== null && (
                    <div className="mt-6 p-4 bg-gray-50 border-l-4 border-gray-400 rounded-lg">
                        <p className="text-lg text-gray-800">Estimated Wait Time: <strong>{waitTime} minutes</strong></p>
                        <p className="text-lg text-gray-800">Your Position in Line: <strong>{position}</strong></p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientCheck;

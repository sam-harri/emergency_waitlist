'use client';
import Head from "next/head";
import { FaGithub } from "react-icons/fa";
import Image from 'next/image';

export default function Home() {
  return (
    <div className="flex h-screen w-full flex-col bg-gray-100">
      <Head>
        <title> Game Hub</title>
        <meta name="description" content="Play Online Games" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <header className="flex h-16 w-full items-center justify-center border-b-2 border-b-gray-500 text-black">
        <div className="absolute left-0 flex items-center justify-center pl-4">
          <a href="https://github.com/sam-harri/emergency_waitlist">
            <FaGithub size={24} />
          </a>
        </div>
        <div className="text-2xl font-bold">Emergency Waitlist</div>
      </header>
      <main className="flex grow items-center justify-center p-4 space-x-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4">
              <Image src="/admindashboard.png" alt="Admin" width={400} height={200} className="w-full h-48 object-cover rounded-lg" />
            </div>
            <div className="px-4 pb-4">
              <h2 className="text-xl font-bold mb-2">Admin Panel</h2>
              <p className="text-gray-700 mb-4">Have a look at what an admin at the hospital would see! Add patients, move them along, and more; All in real time thanks to WebSockets! </p>
              <a href="/admin" className="block text-center bg-gray-800 text-white py-2 rounded-lg">Admin Panel</a>
            </div>
          </div>
        </div>
        <div className="w-full max-w-md">
          <div className="flex flex-col bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4">
              <Image src="/docspatient.png" alt="Patient" width={400} height={200} className="w-full h-48 object-cover rounded-lg" />
            </div>
            <div className="px-4 pb-4">
              <h2 className="text-xl font-bold mb-2">Patient Panel</h2>
              <p className="text-gray-700 mb-4">Pretend to be a patient and log in for a wait time estimate using only the 3 letter code given from the admin!</p>
              <a href="/patient" className="block text-center bg-gray-800 text-white py-2 rounded-lg">Patient Panel</a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
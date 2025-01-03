import React from 'react';
import { Helmet } from 'react-helmet';
import background from '../media/background.jpg';

function PrivacyStatement() {

    return (
        <div className="min-h-screen relative text-neutral-900 dark:text-white bg-neutral-200 dark:bg-neutral-900 transition duration-200">
            <Helmet>
                <title>Privacy Statement</title>
                <meta name="description" description="ClipSesh! is a site for Beat Saber players by Beat Saber players. On this site you will be able to view all submitted clips
                    from the Cube Community highlights channel. You can rate them, leave comments and discuss with fellow players!"
                />
            </Helmet>
            <div className="flex h-96 justify-center items-center" style={{ backgroundImage: `url(${background})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <div className="flex bg-gradient-to-b from-neutral-900 to-bg-black/20 backdrop-blur-lg justify-center items-center w-full h-full">
                    <div className="flex flex-col justify-center items-center">
                        <h1 className="text-4xl font-bold mb-4 text-center">Privacy</h1>
                        <h1 className="text-2xl mb-4 text-center">Your privacy matters to me (sorta)</h1>
                    </div>
                </div>
            </div>
            <div className="container grid mx-auto justify-items-center text-neutral-900 dark:text-white p-4 pt-8 bg-neutral-200 dark:bg-neutral-900 transition duration-200 justify-center items-center">
                <div className="container mx-auto">
                    <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
                    <p className="mb-4">Effective Date: 9 July, 2024</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">1. Introduction</h2>
                    <p className="mb-4">
                        Welcome to ClipSesh! Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your personal information when you use our website.
                    </p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">2. Information We Collect</h2>
                    <p className="mb-4">
                        We collect the following types of information:
                    </p>
                    <ul className="list-disc list-inside mb-4">
                        <li>IP Address: We collect your IP address to ensure the integrity of our voting system and prevent multiple votes from the same user.</li>
                    </ul>

                    <h2 className="text-2xl font-bold mt-8 mb-4">3. How We Use Your Information</h2>
                    <p className="mb-4">
                        We use the information we collect in the following ways:
                    </p>
                    <ul className="list-disc list-inside mb-4">
                        <li>Voting Integrity: To prevent multiple votes from the same IP address and ensure fair voting.</li>
                        <li>Service Improvement: To understand how our service is used and to improve its functionality and performance.</li>
                    </ul>

                    <h2 className="text-2xl font-bold mt-8 mb-4">4. How We Protect Your Information</h2>
                    <p className="mb-4">
                        We implement a variety of security measures to maintain the safety of your personal information when you use our service. This includes:
                    </p>
                    <ul className="list-disc list-inside mb-4">
                        <li>Secure servers and databases.</li>
                        <li>Encryption of local data so even authorized personnel can't read your data.</li>
                        <li>Access controls to limit access to your information to authorized personnel only.</li>
                    </ul>
                </div>
                <div className="container mx-auto">
                    <h2 className="text-2xl font-bold mt-8 mb-4">5. Data Retention</h2>
                    <p className="mb-4">
                        We will retain your IP address for as long as it is necessary to ensure voting integrity and comply with our legal obligations.
                    </p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">6. Third-Party Disclosure</h2>
                    <p className="mb-4">
                        We do not sell, trade, or otherwise transfer your IP address to outside parties in any way. All data is and will only be used and stored on the ClipSesh! servers.
                    </p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">7. Your Rights</h2>
                    <p className="mb-4">
                        Depending on your location, you may have the following rights regarding your personal information:
                    </p>
                    <ul className="list-disc list-inside mb-4">
                        <li>Access: The right to access the personal information we hold about you.</li>
                        <li>Correction: The right to correct any inaccurate personal information we have about you.</li>
                        <li>Deletion: The right to request the deletion of your personal information.</li>
                    </ul>
                    <p className="mb-4">
                        To exercise these rights, please contact us via the official <a href='https://discord.gg/dwe8mbC' className='underline text-blue-500'>Cube Community Discord Server</a>.
                    </p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">8. Changes to This Privacy Policy</h2>
                    <p className="mb-4">
                        We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the effective date at the top.
                    </p>
                </div>
            </div>
        </div>

    );
}

export default PrivacyStatement;
import background from '../media/background.jpg';
import { motion } from 'framer-motion';
import { FaShieldAlt, FaUserShield, FaDatabase, FaServer, FaLock, FaTrash, FaFileContract } from 'react-icons/fa';
import PageLayout from './components/layouts/PageLayout';

function PrivacyStatement() {
    const contentSections = [
        {
            id: 'introduction',
            title: '1. Introduction',
            icon: <FaFileContract />,
            content: 'Welcome to ClipSesh! Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your personal information when you use our website.'
        },
        {
            id: 'collected-info',
            title: '2. Information We Collect',
            icon: <FaDatabase />,
            content: 'We collect the following types of information:',
            list: [
                'IP Address: We collect your IP address to ensure the integrity of our voting system and prevent multiple votes from the same user.'
            ]
        },
        {
            id: 'info-usage',
            title: '3. How We Use Your Information',
            icon: <FaUserShield />,
            content: 'We use the information we collect in the following ways:',
            list: [
                'Voting Integrity: To prevent multiple votes from the same IP address and ensure fair voting.',
                'Service Improvement: To understand how our service is used and to improve its functionality and performance.'
            ]
        },
        {
            id: 'protection',
            title: '4. How We Protect Your Information',
            icon: <FaLock />,
            content: 'We implement a variety of security measures to maintain the safety of your personal information when you use our service. This includes:',
            list: [
                'Secure servers and databases.',
                'Encryption of local data so even authorized personnel can\'t read your data.',
                'Access controls to limit access to your information to authorized personnel only.'
            ]
        },
        {
            id: 'retention',
            title: '5. Data Retention',
            icon: <FaServer />,
            content: 'We will retain your IP address for as long as it is necessary to ensure voting integrity and comply with our legal obligations.'
        },
        {
            id: 'third-party',
            title: '6. Third-Party Disclosure',
            icon: <FaShieldAlt />,
            content: 'We do not sell, trade, or otherwise transfer your IP address to outside parties in any way. All data is and will only be used and stored on the ClipSesh! servers.'
        },
        {
            id: 'rights',
            title: '7. Your Rights',
            icon: <FaUserShield />,
            content: 'Depending on your location, you may have the following rights regarding your personal information:',
            list: [
                'Access: The right to access the personal information we hold about you.',
                'Correction: The right to correct any inaccurate personal information we have about you.',
                'Deletion: The right to request the deletion of your personal information.'
            ],
            extraContent: 'To exercise these rights, please contact us via the official Cube Community Discord Server.'
        },
        {
            id: 'changes',
            title: '8. Changes to This Privacy Policy',
            icon: <FaTrash />,
            content: 'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the effective date at the top.'
        }
    ];

    return (
      <PageLayout
        title="Privacy Statement"
        subtitle="Your privacy matters to us"
        backgroundImage={background}
        metaDescription="ClipSesh privacy statement - Learn how we protect your data and maintain your privacy while using our service."
      >
        <motion.div 
          className="max-w-4xl mx-auto bg-neutral-300 dark:bg-neutral-800 p-6 md:p-8 rounded-xl shadow-lg text-neutral-900 dark:text-white"
        >
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-4 flex items-center">
              <FaShieldAlt className="mr-3 text-blue-500" /> 
              Privacy Policy
            </h1>
            <p className="text-neutral-700 dark:text-neutral-300 font-medium">
              Effective Date: July 9, 2024
            </p>
          </header>
          
          <div className="space-y-10">
            {contentSections.map((section, index) => (
              <motion.section 
                key={section.id}
                id={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + (index * 0.1) }}
                className="pb-6 border-b border-neutral-400 dark:border-neutral-700 last:border-0"
              >
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <span className="mr-3 text-blue-500 dark:text-blue-400">
                    {section.icon}
                  </span>
                  {section.title}
                </h2>
                
                <p className="mb-4 text-neutral-800 dark:text-neutral-200 leading-relaxed">
                  {section.content}
                </p>
                
                {section.list && (
                  <ul className="list-disc ml-5 mb-4 space-y-2">
                    {section.list.map((item, i) => (
                      <li key={i} className="text-neutral-800 dark:text-neutral-200">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
                
                {section.extraContent && (
                  <p className="mt-4 text-neutral-800 dark:text-neutral-200 leading-relaxed">
                    {section.extraContent}
                    {section.id === 'rights' && (
                        <a 
                            href='https://discord.gg/dwe8mbC' 
                            className='ml-1 text-blue-600 dark:text-blue-400 hover:underline font-medium inline-flex items-center'
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Cube Community Discord Server
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    )}
                  </p>
                )}
              </motion.section>
            ))}
          </div>
          
          <div className="mt-10 p-4 bg-neutral-200 dark:bg-neutral-700 rounded-lg text-center">
            <p className="text-neutral-700 dark:text-neutral-300">
              If you have any questions about this Privacy Policy, please contact us via the 
              <a 
                href='https://discord.gg/dwe8mbC' 
                className='mx-1 text-blue-600 dark:text-blue-400 hover:underline font-medium'
                target="_blank"
                rel="noopener noreferrer"
              >
                Cube Community Discord
              </a>
              server.
            </p>
          </div>
        </motion.div>
      </PageLayout>
    );
}

export default PrivacyStatement;
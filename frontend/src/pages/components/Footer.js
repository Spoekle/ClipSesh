import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaDiscord, FaGithub, FaYoutube, FaSun, FaMoon, FaSnowflake } from 'react-icons/fa';
import { SnowOverlay } from 'react-snow-overlay';

function Footer() {

    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme !== 'light';
    });
    const [seasonInfo, setSeasonInfo] = useState({ season: '' });
    const [snow, setSnow] = useState(() => {
        const savedSnow = localStorage.getItem('snow');
        return savedSnow !== 'false';
    });

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }

        getSeason();

        if (snow) {
            localStorage.setItem('snow', 'true');
        } else {
            localStorage.setItem('snow', 'false');
        }
    }, [isDarkMode]);

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
    };

    const toggleSnow = () => {
        setSnow(!snow);
        localStorage.setItem('snow', !snow);
    }; 

    const getSeason = () => {
        const currentDate = new Date().toLocaleDateString();
        let season = '';
    
        if (currentDate >= '12-21' || currentDate <= '03-19') {
          season = 'Winter';
        } else if (currentDate >= '03-20' && currentDate <= '06-20') {
          season = 'Spring';
        } else if (currentDate >= '06-21' && currentDate <= '09-21') {
          season = 'Summer';
        } else {
          season = 'Fall';
        }
    
        setSeasonInfo(prevSeasonInfo => ({
          ...prevSeasonInfo,
          season
        }));
      };

    return (
        <footer className="flex bg-neutral-900 w-full justify-between text-white py-6 text-center">
            <div className="container grid md:flex mx-auto justify-center px-4 md:justify-between items-center">
                <p className="flex text-md">
                    © {new Date().getFullYear()} Spoekle. All rights reserved.
                    <Link to="/privacystatement" className='ml-2 underline hover:text-blue-500 transition duration-200'>
                        Privacy Statement
                    </Link>
                    { seasonInfo.season === 'Winter' && snow && <SnowOverlay /> }
                </p>
                <div className="flex justify-center mt-2 md:mt-0">
                    { seasonInfo.season === 'Winter' &&  
                        <button 
                            onClick={toggleSnow} 
                            className={`mx-2 hover:scale-110 ${snow ? "text-white" : "text-neutral-400"} hover:text-blue-400 transition duration-200 cursor-pointer`}
                            title='Toggle Snow'
                        >
                            <FaSnowflake className="text-4xl" />
                        </button>
                    }
                    <a
                        href="https://discord.gg/dwe8mbC"
                        target="_blank"
                        rel="noreferrer"
                        className="mx-2 hover:scale-110 hover:text-blurple transition duration-200 cursor-pointer"
                    >
                        <FaDiscord className="text-4xl" />
                    </a>
                    <a
                        href="https://www.youtube.com/@CubeCommunity"
                        target="_blank"
                        rel="noreferrer"
                        className="mx-2 hover:scale-110 hover:text-red-600 transition duration-200 cursor-pointer"
                    >
                        <FaYoutube className="text-4xl" />
                    </a>
                    <a
                        href="https://github.com/Spoekle/clipsesh-frontend"
                        target="_blank"
                        rel="noreferrer"
                        className="mx-2 hover:scale-110 transition duration-200 cursor-pointer"
                    >
                        <FaGithub className="text-4xl" />
                    </a>
                    <button onClick={toggleDarkMode} className="mx-2 hover:scale-110 transition duration-200 cursor-pointer">
                        {isDarkMode ? <FaSun className="text-4xl hover:text-yellow-300 transition duration-200" /> : <FaMoon className="text-4xl hover:text-blue-800 transition duration-200" />}
                    </button>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
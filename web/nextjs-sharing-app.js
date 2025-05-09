// File structure for a Next.js app with sharing functionality
// 
// /pages
// ├── _app.js
// ├── index.js
// /components
// ├── TeamCard.js
// ├── ShareButton.js
// /styles
// ├── globals.css
// ├── TeamCard.module.css
// ├── ShareButton.module.css

// --------------------------------------
// /pages/_app.js
// --------------------------------------
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;

// --------------------------------------
// /pages/index.js
// --------------------------------------
import { useEffect, useState } from 'react';
import Head from 'next/head';
import TeamCard from '../components/TeamCard';
import ShareButton from '../components/ShareButton';

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  
  // This ensures html2canvas only runs on client-side
  useEffect(() => {
    setIsClient(true);
    
    // Dynamically import html2canvas
    const loadHtml2Canvas = async () => {
      if (typeof window !== 'undefined') {
        window.html2canvas = (await import('html2canvas')).default;
      }
    };
    
    loadHtml2Canvas();
  }, []);

  return (
    <div className="container">
      <Head>
        <title>Team Pass | Hackathon</title>
        <meta name="description" content="Share your hackathon team pass" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <div id="teamCardContainer">
          <TeamCard teamNumber="24" event="48 HRS NON-STOP" />
        </div>
        
        <button className="generateBtn">Generate</button>
        
        {isClient && <ShareButton targetElementId="teamCardContainer" />}
        
        <div className="viewPass">View your Team Pass.</div>
      </main>

      <nav className="bottomNav">
        <div className="navItem">🏠</div>
        <div className="navItem">🔖</div>
        <div className="navItem">🔍</div>
        <div className="navItem">❓</div>
      </nav>
    </div>
  );
}

// --------------------------------------
// /components/TeamCard.js
// --------------------------------------
import styles from '../styles/TeamCard.module.css';

const TeamCard = ({ teamNumber, event }) => {
  // Helper function to render dots for a number
  const renderNumberDots = (number) => {
    // For simplicity, let's just render dots for "24"
    return (
      <div className={styles.numberContainer}>
        <div className={styles.digit}>
          <div className={styles.dotRow}>
            <span className={styles.dot}></span>
            <span className={styles.dot}></span>
            <span className={styles.dot}></span>
          </div>
          <div className={styles.dotRow}>
            <span className={styles.dot}></span>
          </div>
          <div className={styles.dotRow}>
            <span className={styles.dot}></span>
          </div>
          <div className={styles.dotRow}>
            <span className={styles.dot}></span>
          </div>
          <div className={styles.dotRow}>
            <span className={styles.dot}></span>
            <span className={styles.dot}></span>
          </div>
        </div>
        <div className={styles.digit}>
          <div className={styles.dotRow}>
            <span className={styles.dot}></span>
          </div>
          <div className={styles.dotRow}>
            <span className={styles.dot}></span>
            <span className={styles.dot}></span>
          </div>
          <div className={styles.dotRow}>
            <span className={styles.dot}></span>
          </div>
          <div className={styles.dotRow}>
            <span className={styles.dot}></span>
          </div>
          <div className={styles.dotRow}>
            <span className={styles.dot}></span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.teamCard}>
      <div className={styles.gridBg}></div>
      <div className={styles.header}>TEAM NO.</div>
      <div className={styles.teamNumber}>
        {renderNumberDots(teamNumber)}
      </div>
      <div className={styles.eventInfo}>{event}</div>
      <div className={styles.buttonRow}>
        <button className={styles.tagButton}>TAG UR TEAM!</button>
        <button className={styles.tagButton}>TAG US!</button>
      </div>
      <a href="https://intania.tech/hackathon" className={styles.websiteLink}>
        INTANIA.TECH/HACKATHON
      </a>
    </div>
  );
};

export default TeamCard;

// --------------------------------------
// /components/ShareButton.js
// --------------------------------------
import { useState, useEffect } from 'react';
import styles from '../styles/ShareButton.module.css';

const ShareButton = ({ targetElementId }) => {
  const [webShareSupported, setWebShareSupported] = useState(false);
  
  useEffect(() => {
    // Check if Web Share API is supported
    setWebShareSupported(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  const handleShare = async () => {
    try {
      const element = document.getElementById(targetElementId);
      
      if (!element) {
        throw new Error('Target element not found');
      }
      
      // Make sure html2canvas is loaded
      if (!window.html2canvas) {
        throw new Error('html2canvas not loaded');
      }
      
      // Capture the element as an image
      const canvas = await window.html2canvas(element);
      
      // Convert canvas to blob
      const blobPromise = new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png');
      });
      
      const blob = await blobPromise;
      const file = new File([blob], 'team-pass.png', { type: 'image/png' });
      
      // Prepare share data
      const shareData = {
        title: 'My Team Pass',
        text: 'Check out my team pass for the hackathon!',
        url: window.location.href,
      };
      
      // Add file if browser supports file sharing
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        shareData.files = [file];
      }
      
      // Share using Web Share API
      await navigator.share(shareData);
    } catch (error) {
      console.error('Error sharing:', error);
      
      // Use fallback method if sharing fails
      fallbackShare();
    }
  };

  const fallbackShare = () => {
    // Create a fallback sharing method
    const url = window.location.href;
    const text = 'Check out my team pass for the hackathon! ' + url;
    
    // Copy to clipboard
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('Link copied to clipboard! You can paste it in your preferred app.');
      })
      .catch(() => {
        alert('Unable to copy to clipboard. The link is: ' + url);
      });
  };

  return (
    <button onClick={handleShare} className={styles.shareBtn}>
      Share
    </button>
  );
};

export default ShareButton;

// --------------------------------------
// /styles/globals.css
// --------------------------------------
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  background-color: #000;
  color: white;
}

.container {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  position: relative;
  padding-bottom: 70px; /* Space for bottom nav */
}

main {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.generateBtn {
  background-color: #333;
  color: white;
  border: 2px solid white;
  padding: 15px 60px;
  font-size: 18px;
  border-radius: 50px;
  margin: 20px 0;
  cursor: pointer;
  transition: all 0.3s;
}

.generateBtn:hover {
  background-color: #444;
}

.viewPass {
  color: white;
  text-decoration: underline;
  font-size: 18px;
  margin: 20px 0;
  cursor: pointer;
}

.bottomNav {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: #111;
  display: flex;
  justify-content: space-around;
  padding: 15px 0;
  border-top: 1px solid #333;
}

.navItem {
  text-align: center;
  color: white;
  font-size: 24px;
}

#teamCardContainer {
  width: 100%;
  margin-bottom: 20px;
}

// --------------------------------------
// /styles/TeamCard.module.css
// --------------------------------------
.teamCard {
  background-color: #111;
  border-radius: 15px;
  padding: 25px;
  text-align: center;
  position: relative;
  box-shadow: 0 4px 8px rgba(255, 255, 255, 0.1);
  overflow: hidden;
  width: 100%;
}

.gridBg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
      linear-gradient(rgba(50, 50, 50, 0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(50, 50, 50, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
  z-index: 0;
}

.header {
  font-size: 12px;
  color: #aaa;
  margin-bottom: 10px;
  position: relative;
  z-index: 1;
}

.teamNumber {
  margin: 20px 0;
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
}

.numberContainer {
  display: flex;
  justify-content: center;
  gap: 15px;
}

.digit {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.dotRow {
  display: flex;
  margin: 2px 0;
}

.dot {
  width: 15px;
  height: 15px;
  background-color: white;
  border-radius: 50%;
  display: inline-block;
  margin: 0 2px;
}

.eventInfo {
  color: #ff3b30;
  font-size: 20px;
  margin: 20px 0;
  position: relative;
  z-index: 1;
}

.buttonRow {
  display: flex;
  justify-content: space-between;
  margin: 20px 0;
  position: relative;
  z-index: 1;
}

.tagButton {
  background-color: rgba(50, 50, 50, 0.5);
  border: none;
  color: white;
  padding: 15px;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  flex: 1;
  margin: 0 5px;
}

.websiteLink {
  font-size: 12px;
  color: white;
  text-decoration: none;
  display: inline-block;
  padding: 8px 15px;
  border-radius: 20px;
  background-color: rgba(50, 50, 50, 0.5);
  margin: 10px 0;
  position: relative;
  z-index: 1;
}

// --------------------------------------
// /styles/ShareButton.module.css
// --------------------------------------
.shareBtn {
  background-color: #ff3b30;
  color: white;
  border: none;
  padding: 15px 80px;
  font-size: 20px;
  border-radius: 50px;
  margin: 20px 0;
  cursor: pointer;
  transition: all 0.3s;
  width: 80%;
  max-width: 300px;
}

.shareBtn:hover {
  background-color: #e6352c;
}

// --------------------------------------
// package.json (dependencies section)
// --------------------------------------
{
  "dependencies": {
    "next": "^13.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "html2canvas": "^1.4.1"
  }
}
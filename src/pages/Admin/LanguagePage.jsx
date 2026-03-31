import React from 'react';
import GoogleTranslate from '../../components/LanguageSelector'; // Adjust the import path as needed
import './language.css';
const Guest = () => {
  // Your existing component logic here

  return (
    <div>
      {/* Add the GoogleTranslate component here */}
      <GoogleTranslate />

      <h1>Welcome, Guest!</h1>
      <p>This is the guest page where you can select your language.</p>
      {/* The rest of your guest page content */}
    </div>
  );
};


export default Guest;
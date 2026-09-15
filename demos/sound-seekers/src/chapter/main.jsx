import React from 'react';
import { createRoot } from 'react-dom/client';
import Chapter from './Chapter.jsx';
import '../style.css';
import '../standalone.css';
import './chapter.css';

createRoot(document.getElementById('root')).render(<React.StrictMode><Chapter/></React.StrictMode>);

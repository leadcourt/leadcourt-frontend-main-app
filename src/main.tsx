// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import 'primeicons/primeicons.css';

// import 'primereact/resources/primereact.min.css'; // Import PrimeReact CSS
// import 'primereact/resources/themes/lara-light-indigo/theme.css';  // Import theme

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
        <App />
  // </StrictMode>,
)

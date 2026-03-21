import './App.css'
import { RouterProvider } from 'react-router-dom';
import router from './router/Router';
import { ToastContainer } from 'react-toastify';
import { RecoilRoot } from 'recoil';
import Interceptor from './Interceptor';
import { Analytics } from '@vercel/analytics/react';


const IS_MAINTENANCE_MODE = true;

function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full text-center space-y-6 p-10 bg-white rounded-2xl shadow-xl border border-slate-100">
        <div className="flex justify-center">
          {/* Simple Maintenance Icon */}
          <div className="bg-amber-100 p-4 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="Length12 15V3m0 0L8 7m4-4l4 4M5 8h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V10a2 2 0 012-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15h2m-1 3v.01" />
            </svg>
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Leadcourt
          </h1>
          <p className="text-lg font-medium text-amber-600">
            Under Maintenance
          </p>
        </div>

        <p className="text-slate-500 leading-relaxed">
          We are currently upgrading our systems to serve you better. 
          Leadcourt will be back online shortly. We appreciate your patience!
        </p>

        <div className="pt-4">
          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 w-2/3 animate-pulse"></div>
          </div>
          <p className="text-xs text-slate-400 mt-2 uppercase tracking-widest">Improvements in progress</p>
        </div>
      </div>
    </div>
  );
}

function App() {
  // 2. Conditional Rendering Logic
  if (IS_MAINTENANCE_MODE) {
    return <MaintenancePage />;
  }

  return (
    <RecoilRoot>
      <ToastContainer position="top-right" />
      <Interceptor />
      <RouterProvider router={router} />
      <Analytics />
    </RecoilRoot>
  )
}

export default App

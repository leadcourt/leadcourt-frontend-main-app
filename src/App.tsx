import './App.css'
import { RouterProvider } from 'react-router-dom';
import router from './router/Router';
import { ToastContainer } from 'react-toastify';
import { RecoilRoot } from 'recoil';
import Interceptor from './Interceptor';

function App() {

  return (
      <RecoilRoot>

        <ToastContainer 
        
        position="top-right"
        />
      <Interceptor />

        <RouterProvider router={router} />
      </RecoilRoot>

  )
}

export default App

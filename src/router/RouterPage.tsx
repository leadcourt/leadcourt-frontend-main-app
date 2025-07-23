import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Register from '../pages/auth/Register'
import Login from '../pages/auth/Login'
import LoginTwo from '../pages/auth/LoginTwo';  
import AuthFrame from '../component/auth/AuthFrame'
import ForgotPassword from '../pages/auth/ForgotPassword'
import Dashboard from '../pages/main/Dashboard'

export default function RouterPage() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
            <Route path='/' element={<Dashboard />}/>
            <Route path='/auth' element={<AuthFrame />}>
                <Route path='register' element={<Register />} />
                <Route path='login' element={<Login />} />
                <Route path='login2' element={<LoginTwo />} />
                <Route path='forgotpassword' element={<ForgotPassword />} />
            </Route>
        </Routes>
      </BrowserRouter>
    </div>
  )
}

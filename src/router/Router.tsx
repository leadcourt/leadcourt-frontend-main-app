import { createBrowserRouter } from 'react-router-dom';
import DefaultLayout from './layouts/DefaultLayout';
import ErrorPage from '../pages/response/ErrorPage'; 
import Register from '../pages/auth/Register';
import Login from '../pages/auth/Login';
import Dashboard from '../pages/main/Dashboard';
import ForgotPassword from '../pages/auth/ForgotPassword';
import UserLayout from './layouts/UserLayout';
import LoginTwo from '../pages/auth/LoginTwo';
import DataTablePage from '../pages/main/DataTablePage';
import AddnewListPage from '../pages/main/AddNewListPage';
import ListPage from '../pages/main/ListPage';
import ListDetailPage from '../pages/main/ListDetailPage';
import SettingsPage from '../pages/main/SettingPage';
import ResetPassword from '../pages/auth/ResetPassword';
import BuyCredit from '../pages/main/BuyCredit';
import CreditBalance from '../pages/main/CreditBalance';
import Integrations from '../pages/main/Integrations';
import IntegrationCallback from '../pages/main/IntegrationCallback';
import CollaboratorManager from '../pages/main/CollaboratorManager';
import CollaboratorDashboard from '../pages/main/CollaboratorDashboard';
import CollaboratorLayout from './layouts/CollaboratorLayout';
import Collab_DataTablePage from '../pages/collaboratorMain/DataTablePage';
import Collab_AddnewListPage from '../pages/collaboratorMain/AddNewListPage';
import Collab_ListPage from '../pages/collaboratorMain/ListPage';
import Collab_ListDetailPage from '../pages/collaboratorMain/ListDetailPage';
import Collab_Integrations from '../pages/collaboratorMain/Integrations';
import Collab_IntegrationCallback from '../pages/collaboratorMain/IntegrationCallback';
import VerifyEmail from '../pages/auth/VerifyEmail';
import AuthLayout from './layouts/AuthLayout';
import IntegrationZohoCallback from '../pages/main/IntegrationZohoCallback';
import LinkedIn from '../pages/main/LinkedIn';
const router = createBrowserRouter([
  {
    path: '/',
    element: <DefaultLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '/',
        element: <LoginTwo />
      },
      {
        path: 'auth/register',
        element: <Register />
      },
      {
        path: 'auth/login',
        element: <LoginTwo />
      },
      {
        path: 'auth/user-login',
        element: <Login />
      },
      {
        path: 'auth/forgotpassword',
        element: <ForgotPassword />
      },
      {
        path: 'auth/reset-password',
        element: <ResetPassword />
      }, 
      
    ]
  },
  
  {
    path: '/',
    element: <AuthLayout />,
    children: [ 
      {
        path: '/auth/verify',
        element: <VerifyEmail />
      }, 

    ]
  },
  {
    path: '/',
    element: <UserLayout />,
    children: [ 
      {
        path: '/',
        element: <Dashboard />
      },
      {
        path: 'dashboard',
        element: <DataTablePage />
      },
      {
        path: 'list/new-list',
        element: <AddnewListPage />
      },
      {
        path: 'list',
        element: <ListPage />
      },
      {
        path: 'list/:listName/details',
        element: <ListDetailPage />
      },
      {
        path: '/subscription',
        element: <BuyCredit />
      }, 
      {
        path: '/subscription/balance',
        element: <CreditBalance />
      }, 
      {
        path: '/integrations',
        element: <Integrations />
      }, 
      {
        path: '/integrations/hubspot/callback',
        element: <IntegrationCallback />
      }, 
      {
        path: '/integrations/zoho/callback',
        element: <IntegrationZohoCallback />
      }, 
      {
        path: '/user/setting',
        element: <SettingsPage />
      },
      {
        path: '/teams',
        element: <CollaboratorDashboard />
      }, 
      {
        path: '/collaborators',
        element: <CollaboratorManager />
      },
      {
        path: '/linkedin',
        element: <LinkedIn />
      },
    ]
  },
  {
    path: '/collaboration/:collaborationId',
    element: <CollaboratorLayout />,
    children: [ 
      {
        path: '',
        element: <Dashboard />
      },
      {
        path: 'dashboard',
        element: <Collab_DataTablePage />
      },
      {
        path: 'list/new-list',
        element: <Collab_AddnewListPage />
      },
      {
        path: 'list',
        element: <Collab_ListPage />
      },
      {
        path: 'list/:listName/details',
        element: <Collab_ListDetailPage />
      },  
      {
        path: 'integrations',
        element: <Collab_Integrations />
      }, 
      {
        path: 'integrations/hubspot/callback',
        element: <Collab_IntegrationCallback />
      },
    ]
  }
]);

export default router;
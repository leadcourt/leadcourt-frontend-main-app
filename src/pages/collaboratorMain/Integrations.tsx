import React, { useEffect, useState } from 'react';
import { checkHubspotConnection, connectionHubspotCRM } from '../../utils/api/crmIntegrations';
import { Link, useNavigate } from 'react-router-dom';
import { Tooltip } from 'primereact/tooltip';
import hubspotLogo from "../../assets/integrations/hubspot/HubSpot.png";

interface IntegrationDataStructure {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  connection: boolean | 'checking';
  connectionLink: string | null;
}

const Collab_Integrations = () => {

  const [connections, setConnections] = useState<any>({});

  const navigate = useNavigate();

  const integrations: IntegrationDataStructure[] = [
    {
      id: 'hubspot',
      name: 'Hubspot',
      description: 'Sync contact and activity data between App and Hubspot',
      icon: (
        <div className="w-8 h-8 p-1 bg-orange-500 rounded-lg flex items-center justify-center">
          <img src={hubspotLogo} className='w-full h-full bg-white rounded p-1' alt="" />
        </div>
      ),
      color: 'orange',
      connection: connections['Hubspot']?.connected || false,
      connectionLink: connectionHubspotCRM,

    },
    {
      id: 'Zoho',
      name: 'Zoho',
      description: 'Sync contact and activity data between App and Zoho',
      icon: (
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
      ),
      color: 'blue',
      connection: connections['Zoho']?.connected || false,
      connectionLink: null,

    },
    // {
    //   id: 'gong',
    //   name: 'Gong',
    //   description: 'Send call recordings from App to your Gong workspace',
    //   icon: (
    //     <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
    //       <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
    //         <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    //       </svg>
    //     </div>
    //   ),
    //   color: 'purple',
    //   connection: connections['Gong']?.connected || false,
    //   connectionLink: null,

    // },
    // {
    //   id: 'slack',
    //   name: 'Slack',
    //   description: 'Send call and message logs to your Slack workspace',
    //   icon: (
    //     <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center relative">
    //       <div className="absolute inset-1 bg-white rounded-sm"></div>
    //       <div className="absolute inset-2 flex items-center justify-center">
    //         <div className="w-1 h-1 bg-green-600 rounded-full"></div>
    //       </div>
    //     </div>
    //   ),
    //   color: 'green',
    //   connection: connections['Slack']?.connected || false,
    //   connectionLink: null,

    // }
  ];

  // const handleConnect = (integrationId: string) => {
  //   console.log(`Connecting to ${integrationId}`);
  //   // Handle connection logic here
  // };

  const hubspotConnection = async () => {
    setConnections({...connections, 'Hubspot': 'checking' })
    console.log('Checking Hubspot connection...');
    
    await checkHubspotConnection().then((response) => {
      const updatedConnection = {...connections, 'Hubspot': response.data }
      console.log('Hubspot connection status:', response.data);
      setConnections(updatedConnection);

      // Handle the response as needed
    }).catch(( ) => {
      // Handle the error as needed
    })
  }

  useEffect(() => {
    hubspotConnection()
  }, []);
  return (
    <div className="min-h-screen  py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Integrations</h1>
          <p className="text-gray-600">Connect your Workspace with integrations.</p>
        </div>
        

        <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {integrations.map((integration) => (
              <div key={integration.id} className="p-6 hover:bg-gray-50 transition-colors duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {integration.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {integration.name}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {integration.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-6">
                    {integration.connection === true ? (
                      <div className="flex items-center gap-3">
                        <Tooltip target={`.${integration.id}`}
                        // className='!bg-gray-500 text-red-400'
                        style={{ fontSize: '12px', cursor: 'pointer', paddingLeft: '10px' }}>
                          <p data-pr-tooltip="Open" className='p-2  rounded-sm bg-gray-400 text-black'>Open</p>
                        </Tooltip>
                         

                        <span className={` items-center px-3 py-1 text-sm font-medium text-green-800 bg-green-100 rounded-full`}>
                          Connected
                        </span>
                        <i
                        data-pr-position="right"
                        data-pr-at="right+5 top"
                        data-pr-my="left center-2"
                        onClick={()=>navigate(`/integrations/${integration.id}/callback`, { state: {status: 'success'}})}
                         className={` ${integration.id} pi pi-ellipsis-v items-center px-2 py-3 text-sm font-medium text-blue-800 bg-blue-100 rounded-full`}></i>
                      </div>
                    ) :
                    integration.connection === 'checking' ? (

                    <div
                      className=" px-6 py-2 button_hover text-sm font-medium rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                    >
                      <i className='pi pi-spinner pi-spin'></i>
                    </div>
                    ) :
                    (
                    <Link
                    target="_blank"
                    to={integration.connectionLink || '#'}
                      className=" px-6 py-2 button_hover text-sm font-medium rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                    >
                      Connect
                    </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            More integrations coming soon. Have a request?{' '}
            <a href="#" className="text-[#F35114] hover:text-[#F35114] font-medium">
              Let us know
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Collab_Integrations;
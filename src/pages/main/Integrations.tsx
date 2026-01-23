import React, { useEffect, useMemo, useState } from "react";
import { checkHubspotConnection, connectionHubspotCRM } from "../../utils/api/crmIntegrations";
import { checkBrevoConnection, connectBrevo, removeBrevoConnection } from "../../utils/api/brevoIntegrations";
import { Link, useNavigate } from "react-router-dom";
import { Tooltip } from "primereact/tooltip";
import { Dialog } from "primereact/dialog";
import hubspotLogo from "../../assets/integrations/hubspot/HubSpot.png";
import brevoLogo from "../../assets/integrations/Brevo.png";
import { toast } from "react-toastify";
import { Button } from "primereact/button";

interface IntegrationDataStructure {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  connection: boolean | "checking";
  connectionLink: string | null;
}

const Integrations = () => {
  const [connections, setConnections] = useState<any>({});
  const [brevoDialog, setBrevoDialog] = useState(false);
  const [brevoApiKey, setBrevoApiKey] = useState("");
  const [brevoSaving, setBrevoSaving] = useState(false);

  const navigate = useNavigate();

  const integrations: IntegrationDataStructure[] = useMemo(
    () => [
      {
        id: "hubspot",
        name: "Hubspot",
        description: "Sync contact and activity data between App and Hubspot",
        icon: (
          <div className="w-8 h-8 p-1 bg-orange-500 rounded-lg flex items-center justify-center">
            <img src={hubspotLogo} className="w-full h-full bg-white rounded p-1" alt="" />
          </div>
        ),
        enabled: true,
        connection: connections?.hubspot?.connected === true ? true : connections?.hubspot === "checking" ? "checking" : false,
        connectionLink: connectionHubspotCRM,
      },
      {
        id: "brevo",
        name: "Brevo",
        description: "Export your LeadCourt lists to Brevo contact lists",
        icon: (
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <img src={brevoLogo} className="w-full h-full bg-white rounded p-1" alt="" />
          </div>
        ),
        enabled: true,
        connection: connections?.brevo?.connected === true ? true : connections?.brevo === "checking" ? "checking" : false,
        connectionLink: null,
      },
      {
        id: "zoho",
        name: "Zoho",
        description: "Coming Soon",
        icon: (
          <div className="w-8 h-8 bg-gray-400 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
        ),
        enabled: false,
        connection: false,
        connectionLink: null,
      },
    ],
    [connections]
  );

  const hubspotConnection = async () => {
    setConnections((prev: any) => ({ ...prev, hubspot: "checking" }));
    await checkHubspotConnection()
      .then((response) => {
        setConnections((prev: any) => ({ ...prev, hubspot: response.data }));
      })
      .catch(() => {
        setConnections((prev: any) => ({ ...prev, hubspot: { connected: false } }));
      });
  };

  const brevoConnection = async () => {
    setConnections((prev: any) => ({ ...prev, brevo: "checking" }));
    await checkBrevoConnection(false)
      .then((response) => {
        setConnections((prev: any) => ({ ...prev, brevo: response.data }));
      })
      .catch(() => {
        setConnections((prev: any) => ({ ...prev, brevo: { connected: false } }));
      });
  };

  useEffect(() => {
    hubspotConnection();
    brevoConnection();
  }, []);

  const openBrevoDialog = () => {
    setBrevoApiKey("");
    setBrevoDialog(true);
  };

  const handleBrevoConnect = async () => {
    const key = brevoApiKey.trim();
    if (!key) {
      toast.error("Enter your Brevo API key");
      return;
    }

    setBrevoSaving(true);
    await connectBrevo({ apiKey: key })
      .then((res) => {
        if (res?.data?.connected) {
          toast.success("Brevo connected");
          setBrevoDialog(false);
          brevoConnection();
        } else {
          toast.error("Failed to connect Brevo");
        }
      })
      .catch(() => {
        toast.error("Failed to connect Brevo");
      });

    setBrevoSaving(false);
  };

  const handleBrevoDisconnect = async () => {
    setBrevoSaving(true);
    await removeBrevoConnection()
      .then((res) => {
        if (res?.data?.success) {
          toast.info("Brevo disconnected");
          setBrevoDialog(false);
          brevoConnection();
        } else {
          toast.error("Failed to disconnect Brevo");
        }
      })
      .catch(() => {
        toast.error("Failed to disconnect Brevo");
      });

    setBrevoSaving(false);
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <Dialog
        header={`Brevo`}
        visible={brevoDialog}
        className="p-2 bg-white w-fit max-w-[520px] lg:w-1/2"
        onHide={() => {
          if (!brevoDialog) return;
          setBrevoDialog(false);
        }}
        draggable={false}
        resizable={false}
      >
        <div className="w-full">
          {connections?.brevo?.connected ? (
            <div className="flex flex-col gap-4 p-2">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Connected</div>
                    <div className="text-xs text-gray-600">
                      Key: ****{connections?.brevo?.last4 || ""}
                    </div>
                  </div>
                  <span className="items-center px-3 py-1 text-sm font-medium text-green-800 bg-green-100 rounded-full">
                    Active
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setBrevoDialog(false)}
                  className="bg-gray-500 cursor-pointer text-white text-md rounded-full px-6 py-2"
                >
                  Close
                </button>

                <button
                  onClick={handleBrevoDisconnect}
                  className="bg-[#F35114] flex items-center gap-2 cursor-pointer text-white text-md rounded-full px-6 py-2"
                >
                  {brevoSaving ? <i className="pi pi-spinner pi-spin"></i> : ""}
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 p-2">
              <div className="text-sm text-gray-700">
                Paste your Brevo API key to connect your account.
              </div>

              <input
                value={brevoApiKey}
                onChange={(e) => setBrevoApiKey(e.target.value)}
                type="password"
                placeholder="Brevo API Key"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500"
              />

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setBrevoDialog(false)}
                  className="bg-gray-500 cursor-pointer text-white text-md rounded-full px-6 py-2"
                >
                  Cancel
                </button>

                <button
                  onClick={handleBrevoConnect}
                  className="bg-[#F35114] flex items-center gap-2 cursor-pointer text-white text-md rounded-full px-6 py-2"
                >
                  {brevoSaving ? <i className="pi pi-spinner pi-spin"></i> : ""}
                  Connect
                </button>
              </div>
            </div>
          )}
        </div>
      </Dialog>

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
                    <div className="flex-shrink-0">{integration.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{integration.name}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{integration.description}</p>
                    </div>
                  </div>

                  <div className="flex-shrink-0 ml-6">
                    {integration.connection === true ? (
                      <div className="flex items-center gap-3">
                        <Tooltip
                          target={`.${integration.id}`}
                          style={{ fontSize: "12px", cursor: "pointer", paddingLeft: "10px" }}
                        >
                          <p data-pr-tooltip="Open" className="p-2 rounded-sm bg-gray-400 text-black">
                            Open
                          </p>
                        </Tooltip>

                        <span className="items-center px-3 py-1 text-sm font-medium text-green-800 bg-green-100 rounded-full">
                          Connected
                        </span>

                        <i
                          data-pr-position="right"
                          data-pr-at="right+5 top"
                          data-pr-my="left center-2"
                          onClick={() => {
                            if (integration.id === "hubspot") {
                              navigate(`/integrations/${integration.id}/callback`, { state: { status: "success" } });
                              return;
                            }
                            if (integration.id === "brevo") {
                              openBrevoDialog();
                              return;
                            }
                          }}
                          className={`${integration.id} pi pi-ellipsis-v items-center px-2 py-3 text-sm font-medium text-blue-800 bg-blue-100 rounded-full cursor-pointer`}
                        ></i>
                      </div>
                    ) : integration.connection === "checking" ? (
                      <div className="px-6 py-2 button_hover text-sm font-medium rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2">
                        <i className="pi pi-spinner pi-spin"></i>
                      </div>
                    ) : integration.enabled ? (
                      integration.id === "brevo" ? (
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            icon="pi pi-info-circle"
                            className="p-button-rounded p-button-text p-0 text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                            style={{
                              width: 34,
                              height: 34,
                              border: "none",
                              background: "transparent",
                            }}
                            tooltip={
                              "To get your Brevo API key:\n" +
                              "1) Settings → SMTP & API\n" +
                              "2) API keys & MCP\n" +
                              "3) Generate a new API key\n" +
                              "4) Copy the API key when it appears"
                            }
                            tooltipOptions={{
                              position: "left",
                              showDelay: 150,
                              className: "brevo-tooltip",
                              style: { maxWidth: 280, whiteSpace: "pre-line" },
                            }}
                          />

                          <button
                            onClick={openBrevoDialog}
                            className="px-6 py-2 button_hover text-sm font-medium rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                          >
                            Connect
                          </button>
                        </div>
                      ) : (
                        <Link
                          target="_blank"
                          to={integration.connectionLink || "#"}
                          className="px-6 py-2 button_hover text-sm font-medium rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                        >
                          Connect
                        </Link>
                      )
                    ) : (
                      <div className="px-6 py-2 bg-gray-300 text-gray-500 cursor-not-allowed text-sm font-medium rounded-lg transition-colors duration-150">
                        Coming Soon
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            More integrations coming soon. Have a request?{" "}
            <Link target="_blank" to="https://www.leadcourt.com/contact.html" className="text-[#F35114] hover:text-[#F35114] font-medium">
              Let us know
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Integrations;
import React, { useState } from "react";
 
import SettingsOption from "../../component/settings/SettingsOption";
import PersonalInformationPage from "../../component/settings/Personal";
import { Dialog } from "primereact/dialog";
import MarketingPreferencesPage from "../../component/settings/MarketingPreferencesPage";
import SupportPage from "../../component/settings/SupportPage";
import AddCollaborators from "../../component/settings/AddCollaborators";

interface SectionTitleProps {
  title: string;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ title }) => {
  return <h3 className="text-gray-500 font-medium text-sm py-4">{title}</h3>;
};

const SettingsPage: React.FC = () => { 

  const [options, setOptions] = useState("");
  const [visible, setVisible] = useState(false);

  const displayDialog = (info: string) => {
    setOptions(info);
    setVisible(true);
  };
  return (
    <div className="p-6 lg:max-w-[90%] mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* <PromotionalBanner /> */}

      {options === "Personal information" ? (

        <Dialog
          header="Personal information"
          visible={visible && options === "Personal information"}
          style={{ width: "500px", padding:'1.5rem', backgroundColor: 'white' }}
          onHide={() => {
            if (!visible) return;
            setVisible(false);
          }}
        > 
       <PersonalInformationPage />
        </Dialog>
      ) : options === "Marketing preferences" ? (

        <Dialog
          header="Marketing preferences"
          visible={visible && options === "Marketing preferences"}
          style={{ width: "400px", padding:'1.5rem', backgroundColor: 'white' }}
          onHide={() => {
            if (!visible) return;
            setVisible(false);
          }}
        > 
       <MarketingPreferencesPage changeVisibility={setVisible} />
        </Dialog>
      ) : options === "Support" ? (

        <Dialog
          header="Support"
          visible={visible && options === "Support"}
          style={{ width: "400px", padding:'1.5rem', backgroundColor: 'white' }}
          onHide={() => {
            if (!visible) return;
            setVisible(false);
          }}
        > 
       <SupportPage faq={true} />
        </Dialog>
      ) :options === "Add Collaborator" ? (

        <Dialog
          header="Add Collaborator"
          visible={visible && options === "Add Collaborator"}
          style={{ width: "400px", padding:'1.5rem', backgroundColor: 'white' }}
          onHide={() => {
            if (!visible) return;
            setVisible(false);
          }}
        > 
       <AddCollaborators />
        </Dialog>
      ) : ( 
        ""
      )}

      <div className="bgwhite roundedlg shadowsm p6">
        <div className="mt-5">
          <SectionTitle title="General" />
        </div>

        <div className="border-t border-gray-100">
          <SettingsOption
            icon={"pi pi-user text-blue-700 font-bold "}
            title="Personal information"
            onClick={displayDialog}
          />
        </div>

        <div className="border-t border-gray-100">
          <SettingsOption
            icon={"pi pi-envelope text-yellow-500 font-bold "}
            title="Marketing preferences"
            onClick={displayDialog}
          />
        </div>
{/* 
        <div className="mt-5">
          <SectionTitle title="Payments" />
        </div>

        <div className="border-t border-gray-100">
          <SettingsOption
            icon={"pi pi-money-bill text-blue-700 font-bold "}
            title="Payment methods"
          />
        </div>

        <div className="border-t border-gray-100">
          <SettingsOption
            icon={"pi pi-credit-card text-red-500 font-bold "}
            title="My cards"
          />
        </div> */}

        <div className="mt-5">
          <SectionTitle title="Other" />
        </div>

        <div className="border-t border-gray-100">
          <SettingsOption
            icon={"pi pi-question-circle text-blue-700 font-bold "}
            title="Support"
            onClick={displayDialog}
          />
        </div>

        <div className="border-t border-gray-100">
          <SettingsOption
            icon={"pi pi-user-plus text-red-500 font-bold "}
            title="Add Collaborator"
            onClick={displayDialog}
          />
        </div>

        <div className="border-t border-gray-100">
          <SettingsOption
            icon={"pi pi-percentage text-gray-400 font-bold "}
            title="Referral Program"
          />
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

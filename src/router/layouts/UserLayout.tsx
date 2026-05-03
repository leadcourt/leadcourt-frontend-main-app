import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useRecoilValue, useRecoilState } from "recoil";
import {
  accessTokenState,
  refreshTokenState,
  userState,
  creditState, // <-- ADDED: Importing creditState to check the tour flag
} from "../../utils/atom/authAtom";
import { useEffect, useState } from "react";
import Sidebar from "../../component/Sidebar";
import Topbar from "../../component/Topbar";
import ScrollButtons from "../../component/ScrollButtons";
import VerifyEmail from "../../pages/auth/VerifyEmail";
import { sidebarOpenState } from "../../utils/atom/layoutAtom";
// FIXED: Removed CallBackProps from import
import { Joyride, STATUS } from "react-joyride";
import axios from "axios"; // <-- FIXED: Uncommented axios!

export default function UserLayout() {
  const accessToken = useRecoilValue(accessTokenState);
  const refreshToken = useRecoilValue(refreshTokenState);
  const user: any = useRecoilValue(userState);
  const creditInfoValue: any = useRecoilValue(creditState); // <-- ADDED: Grabbing credit info

  const [displaySide, setDisplaySide] = useRecoilState(sidebarOpenState);
  const [runTour, setRunTour] = useState(false);

  const location = useLocation();
  const hideTopbarOnPaths = ["/subscription"];
  const hideTopbar = hideTopbarOnPaths.includes(location.pathname);

  const auth = {
    access: accessToken,
    token: refreshToken,
  };

  const handleSideBar = () => {
    setDisplaySide((prev) => !prev);
  };

  // --- TOUR CONFIGURATION ---
  useEffect(() => {
    // Show only if user hasn't seen it and hasn't locally dismissed it
    const localDismissed = localStorage.getItem(`tour_seen_${user?.id}`);

    // FIXED: Checking creditInfoValue?.hasSeenTour instead of user
    if (user && creditInfoValue && !creditInfoValue.hasSeenTour && !localDismissed) {
      setTimeout(() => setRunTour(true), 800); // Small delay to let data load
    }
  }, [user, creditInfoValue]); // <-- ADDED creditInfoValue to dependencies

  // FIXED: Changed Step[] to any[] to fix the disableBeacon TS error
  const steps: any[] = [
    {
      target: "#tour-filters",
      title: "Step 1 of 8: 👉 Find High-Quality Leads",
      content:
        "Use these filters to narrow down 14M+ leads. Select countries, specific titles, or company sizes to find your exact ideal customer.",
      disableBeacon: true,
    },
    {
      target: "#tour-bulk-add-btn",
      title: "Step 2 of 8: ⚡ Bulk Add Leads in Seconds",
      content:
        "Skip the manual work. Click here to select multiple pages of results and save hundreds of leads to your lists instantly.",
    },
    {
      target: "#tour-page-range",
      title: "Step 3 of 8: 📄 Select Page Range",
      content:
        "Each page holds 25 leads. Enter a start and end page (e.g., Pages 1–20 = 500 leads) to grab huge batches at once.",
    },
    {
      target: "#tour-proceed-btn",
      title: "Step 4 of 8: ✅ Confirm Selection",
      content:
        "Once you’ve selected your page range, click proceed to securely save these leads.",
    },
    {
      target: "#tour-list-selection",
      title: "Step 5 of 8: 📂 Save to a List",
      content:
        "Choose where to store them. Select an existing list from the dropdown, or toggle to create a brand new one.",
    },
    {
      target: "#tour-credits",
      title: "Step 6 of 8: 💳 Your Credits",
      content:
        "Keep an eye on this! Credits are only deducted when you reveal verified contact details like emails or direct phone numbers.",
    },
    {
      target: "#tour-navigation",
      title: "Step 7 of 8: 📌 Explore Your Dashboard",
      content:
        "Access your Saved Lists, Team Members, API Integrations, and Billing settings right here.",
      placement: "right",
    },
    {
      target: "#tour-support",
      title: "Step 8 of 8: 🤝 Need Help?",
      content:
        "If you ever get stuck, reach out to our support team. We're here to make sure you get the most out of the platform!",
      placement: "center",
    },
  ];

  // FIXED: Changed 'data: CallBackProps' to 'data: any'
  const handleJoyrideCallback = async (data: any) => {
    const { status, index, type } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setRunTour(false);
      localStorage.setItem(`tour_seen_${user?.id}`, "true");
      window.dispatchEvent(new Event("tour:close-modals"));

      try {
        // Ensure VITE_BE_URL and the path combined matches your backend properly.
        // If VITE_BE_URL already includes "/api", use "/list/mark-tour".
        // If VITE_BE_URL does NOT include "/api", use "/api/list/mark-tour".
        await axios.post(
          `${import.meta.env.VITE_BE_URL}/api/list/mark-tour`, 
          {},
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
      } catch (err) {
        console.error("Failed to mark tour as seen", err);
      }
      return;
    }

    // --- PROGRAMMATIC MODAL CONTROL ---
    if (type === "step:before") {
      if (index === 2) {
        // Going to Step 3: Open the Bulk Config Modal
        window.dispatchEvent(new Event("tour:open-bulk"));
      } else if (index === 4) {
        // Going to Step 5: Close Bulk, Open Add-to-List Modal
        window.dispatchEvent(new Event("tour:open-add"));
      } else if (index === 5 || index === 1) {
        // Going to Credits OR backing up to Step 2: Ensure modals are closed
        window.dispatchEvent(new Event("tour:close-modals"));
      }
    }
  };

  if (auth?.access && !!user?.email && user?.verify) {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-50">
        {/* --- JOYRIDE COMPONENT --- */}
        <Joyride
          steps={steps}
          run={runTour}
          continuous={true}
          showSkipButton={true}
          callback={handleJoyrideCallback}
          styles={{
            options: {
              primaryColor: "#F35114",
              zIndex: 10000, // Very high so it stays above PrimeReact Modals
            },
            tooltipContainer: { textAlign: "left" },
            buttonNext: { borderRadius: "8px", outline: "none" },
            buttonBack: { marginRight: "8px" },
          }}
        />

        <div className="fixed z-50 bottom-5 right-5">
          <ScrollButtons />
        </div>

        <div className="hidden lg:block h-screen shrink-0">
          <Sidebar />
        </div>

        {displaySide ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/30"
              onClick={handleSideBar}
            />
            <div className="absolute left-0 top-0 h-full">
              <Sidebar forceExpanded onRequestClose={handleSideBar} />
            </div>
          </div>
        ) : null}

        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {!hideTopbar ? (
            <div className="shrink-0 bg-white border-b-gray-100 border-b-2">
              <Topbar
                onToggleSidebar={handleSideBar}
                mobileSidebarOpen={displaySide}
              />
            </div>
          ) : null}

          {/* ADDED #tour-support ID to center stage */}
          <div
            id="tour-support"
            className={`flex-1 min-w-0 min-h-0 ${displaySide ? "overflow-hidden" : "overflow-y-auto"}`}
          >
            <Outlet />
          </div>
        </div>
      </div>
    );
  }

  if (auth?.access && !!user?.email && !user?.verify) {
    return <VerifyEmail />;
  }

  return <Navigate to="/" />;
}
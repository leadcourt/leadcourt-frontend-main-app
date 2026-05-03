import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useRecoilValue, useRecoilState } from "recoil";
import {
  accessTokenState,
  userState,
  creditState,
} from "../../utils/atom/authAtom";
import { useEffect, useState } from "react";
import Sidebar from "../../component/Sidebar";
import Topbar from "../../component/Topbar";
import VerifyEmail from "../../pages/auth/VerifyEmail";
import { sidebarOpenState } from "../../utils/atom/layoutAtom";
import { Joyride, STATUS } from "react-joyride";
import axios from "axios";

export default function UserLayout() {
  const accessToken = useRecoilValue(accessTokenState);
  const user: any = useRecoilValue(userState);
  const creditInfoValue: any = useRecoilValue(creditState);

  const [displaySide, setDisplaySide] = useRecoilState(sidebarOpenState);
  const [runTour, setRunTour] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const location = useLocation();
  const hideTopbarOnPaths = ["/subscription"];
  const hideTopbar = hideTopbarOnPaths.includes(location.pathname);

  const handleSideBar = () => setDisplaySide((prev) => !prev);

  useEffect(() => {
    const localDismissed = localStorage.getItem(`tour_seen_${user?.id}`);
    if (
      user &&
      creditInfoValue &&
      !creditInfoValue.hasSeenTour &&
      !localDismissed
    ) {
      setTimeout(() => {
        setStepIndex(0);
        setRunTour(true);
      }, 1500);
    }
  }, [user, creditInfoValue]);

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
        "Each page holds 25 leads. Enter a start and end page to grab huge batches at once.",
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

  const waitForElement = (selector: string, callback: () => void) => {
    let attempts = 0;
    const check = () => {
      if (document.querySelector(selector)) {
        callback();
      } else if (attempts < 60) {
        attempts++;
        setTimeout(check, 50);
      } else {
        callback();
      }
    };
    check();
  };

  const handleJoyrideCallback = async (data: any) => {
    const { action, index, status, type } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setRunTour(false);
      setStepIndex(0);
      localStorage.setItem(`tour_seen_${user?.id}`, "true");
      window.dispatchEvent(new Event("tour:close-modals"));
      try {
        await axios.post(
          `${import.meta.env.VITE_BE_URL}/api/list/mark-tour`,
          {},
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
      } catch (err) {
        console.error(err);
      }
      return;
    }

    if (type === "step:after" && action === "next") {
      if (index === 0) {
        waitForElement("#tour-bulk-add-btn", () => setStepIndex(index + 1));
      } else if (index === 1) {
        window.dispatchEvent(new Event("tour:open-bulk"));
        waitForElement("#tour-page-range", () => setStepIndex(index + 1));
      } else if (index === 3) {
        window.dispatchEvent(new Event("tour:open-add"));
        waitForElement("#tour-list-selection", () => setStepIndex(index + 1));
      } else if (index === 4) {
        window.dispatchEvent(new Event("tour:close-modals"));
        waitForElement("#tour-credits", () => setStepIndex(index + 1));
      } else if (index === 5) {
        waitForElement("#tour-navigation", () => setStepIndex(index + 1));
      } else {
        setStepIndex(index + 1);
      }
    } else if (type === "step:after" && action === "prev") {
      setStepIndex(index - 1);
    }
  };

  if (accessToken && !!user?.email && user?.verify) {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Joyride
          steps={steps}
          run={runTour}
          stepIndex={stepIndex}
          continuous={true}
          // @ts-ignore
          showSkipButton={true}
          callback={handleJoyrideCallback}
          disableScrolling={true}
          disableScrollParentFix={true}
          spotlightClicks={true}
          styles={
            {
              options: { primaryColor: "#F35114", zIndex: 10000 },
              tooltipContainer: { textAlign: "left" },
              buttonNext: { borderRadius: "8px", outline: "none" },
              buttonBack: { marginRight: "8px" },
            } as any
          }
        />

        <div className="hidden lg:block h-screen shrink-0">
          <Sidebar />
        </div>

        {displaySide && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/30"
              onClick={handleSideBar}
            />
            <div className="absolute left-0 top-0 h-full">
              <Sidebar forceExpanded onRequestClose={handleSideBar} />
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {!hideTopbar && (
            <div className="shrink-0 bg-white border-b-gray-100 border-b-2">
              <Topbar
                onToggleSidebar={handleSideBar}
                mobileSidebarOpen={displaySide}
              />
            </div>
          )}

          <div
            id="tour-support"
            className="flex-1 min-w-0 min-h-0 overflow-y-auto"
          >
            <Outlet />
          </div>
        </div>
      </div>
    );
  }

  return user?.verify === false ? <VerifyEmail /> : <Navigate to="/" />;
}

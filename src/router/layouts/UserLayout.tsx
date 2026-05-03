import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useRecoilValue, useRecoilState } from "recoil";
import {
  accessTokenState,
  userState,
  creditState,
} from "../../utils/atom/authAtom";
import { useEffect, useState, useCallback } from "react";
import Sidebar from "../../component/Sidebar";
import Topbar from "../../component/Topbar";
import VerifyEmail from "../../pages/auth/VerifyEmail";
import { sidebarOpenState } from "../../utils/atom/layoutAtom";
import { Joyride, STATUS, ACTIONS, EVENTS, LIFECYCLE } from "react-joyride";
import axios from "axios";

export default function UserLayout() {
  const accessToken = useRecoilValue(accessTokenState);
  const user: any = useRecoilValue(userState);
  const creditInfoValue: any = useRecoilValue(creditState);

  const [displaySide, setDisplaySide] = useRecoilState(sidebarOpenState);
  const [runTour, setRunTour] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const location = useLocation();
  const hideTopbar = ["/subscription"].includes(location.pathname);

  const handleSideBar = () => setDisplaySide((prev) => !prev);

  useEffect(() => {
    const localDismissed = localStorage.getItem(`tour_seen_${user?.id}`);
    if (
      user &&
      creditInfoValue &&
      !creditInfoValue.hasSeenTour &&
      !localDismissed
    ) {
      const timer = setTimeout(() => {
        setStepIndex(0);
        setRunTour(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, creditInfoValue]);

  const steps: any[] = [
    {
      target: "#tour-filters",
      title: "Step 1 of 8: 👉 Find High-Quality Leads",
      content:
        "Use these filters to narrow down 14M+ leads. Select countries, specific titles, or company sizes.",
      disableBeacon: true,
    },
    {
      target: "#tour-bulk-add-btn",
      title: "Step 2 of 8: ⚡ Bulk Add Leads",
      content:
        "Click here to select multiple pages and save hundreds of leads instantly.",
      placement: "bottom" as const,
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
        "Choose where to store them. Select an existing list or create a new one.",
    },
    {
      target: "#tour-credits",
      title: "Step 6 of 8: 💳 Your Credits",
      content:
        "Credits are only deducted when you reveal verified contact details.",
    },
    {
      target: "#tour-navigation",
      title: "Step 7 of 8: 📌 Explore Your Dashboard",
      content:
        "Access your Saved Lists, Team Members, and API Integrations here.",
      placement: "right" as const,
    },
    {
      target: "#tour-support",
      title: "Step 8 of 8: 🤝 Need Help?",
      content: "If you ever get stuck, reach out to our support team!",
      placement: "center" as const,
    },
  ];

  const waitForElement = useCallback(
    (selector: string, callback: () => void) => {
      let attempts = 0;
      const check = () => {
        const el = document.querySelector(selector);
        if (el) {
          // Use requestAnimationFrame to ensure the DOM update is painted
          requestAnimationFrame(() => callback());
        } else if (attempts < 80) {
          attempts++;
          setTimeout(check, 50);
        } else {
          callback();
        }
      };
      check();
    },
    [],
  );

  const handleJoyrideCallback = async (data: any) => {
    const { action, index, status, type, lifecycle } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunTour(false);
      localStorage.setItem(`tour_seen_${user?.id}`, "true");
      window.dispatchEvent(new Event("tour:close-modals"));
      try {
        await axios.post(
          `${import.meta.env.VITE_BE_URL}/api/list/mark-tour`,
          {},
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
      } catch (err) {
        console.error(err);
      }
      return;
    }

    // Use LIFECYCLE.COMPLETE to ensure the step has fully finished rendering
    // before we try to transition state, preventing calculation loops.
    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      if (action === ACTIONS.NEXT) {
        if (index === 0) {
          waitForElement("#tour-bulk-add-btn", () => setStepIndex(1));
        } else if (index === 1) {
          window.dispatchEvent(new Event("tour:open-bulk"));
          waitForElement("#tour-page-range", () => setStepIndex(2));
        } else if (index === 3) {
          window.dispatchEvent(new Event("tour:open-add"));
          waitForElement("#tour-list-selection", () => setStepIndex(4));
        } else if (index === 4) {
          window.dispatchEvent(new Event("tour:close-modals"));
          setStepIndex(5);
        } else {
          setStepIndex(index + 1);
        }
      } else if (action === ACTIONS.PREV) {
        setStepIndex(index - 1);
      }
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
          // NO-FREEZE CONFIGURATION
          disableScrolling={true}
          disableScrollParentFix={true}
          spotlightClicks={true}
          disableOverlayClose={true}
          floaterProps={{
            disableAnimation: true, // Crucial: prevents floater recalculation loops
          }}
          styles={
            {
              options: {
                primaryColor: "#F35114",
                zIndex: 10000,
              },
              tooltipContainer: { textAlign: "left" },
              buttonNext: { borderRadius: "8px", outline: "none" },
              buttonBack: { marginRight: "8px" },
              // Add pointerEvents auto to the spotlight specifically
              spotlight: { pointerEvents: "auto" },
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

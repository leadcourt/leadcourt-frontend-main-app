import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useRecoilValue, useRecoilState } from "recoil";
import {
  accessTokenState,
  userState,
  creditState,
} from "../../utils/atom/authAtom";
import { useEffect, useState, useCallback, useRef } from "react";
import Sidebar from "../../component/Sidebar";
import Topbar from "../../component/Topbar";
import VerifyEmail from "../../pages/auth/VerifyEmail";
import { sidebarOpenState } from "../../utils/atom/layoutAtom";
import { Joyride, STATUS, ACTIONS, EVENTS } from "react-joyride";
import axios from "axios";

export default function UserLayout() {
  const accessToken = useRecoilValue(accessTokenState);
  const user: any = useRecoilValue(userState);
  const creditInfoValue: any = useRecoilValue(creditState);

  const [displaySide, setDisplaySide] = useRecoilState(sidebarOpenState);
  const [runTour, setRunTour] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Prevent the "User Load" from restarting the tour multiple times
  const tourStartedRef = useRef(false);

  const location = useLocation();
  const hideTopbar = ["/subscription"].includes(location.pathname);

  const handleSideBar = () => setDisplaySide((prev) => !prev);

  useEffect(() => {
    // Disable smooth scrolling via JS to prevent Joyride calculation loops
    document.documentElement.style.scrollBehavior = "auto";

    const localDismissed = localStorage.getItem(`tour_seen_${user?.id}`);

    // Only start if we haven't already attempted to start in this session
    if (
      user?.id &&
      creditInfoValue &&
      !creditInfoValue.hasSeenTour &&
      !localDismissed &&
      !tourStartedRef.current
    ) {
      tourStartedRef.current = true;
      console.log("[TOUR] Triggering Start Sequence...");
      setTimeout(() => {
        setStepIndex(0);
        setRunTour(true);
      }, 1500);
    }
  }, [user?.id, creditInfoValue]);

  const steps: any[] = [
    {
      target: "#tour-filters",
      title: "Step 1 of 8: 👉 Find Leads",
      content: "Use filters to find your ideal leads.",
      disableBeacon: true,
    },
    {
      target: "#tour-bulk-add-btn",
      title: "Step 2 of 8: ⚡ Bulk Add",
      content: "Save hundreds of leads at once.",
      placement: "bottom" as const,
    },
    {
      target: "#tour-page-range",
      title: "Step 3 of 8: 📄 Page Range",
      content: "Select your page range.",
    },
    {
      target: "#tour-proceed-btn",
      title: "Step 4 of 8: ✅ Confirm",
      content: "Click proceed to save.",
    },
    {
      target: "#tour-list-selection",
      title: "Step 5 of 8: 📂 Save to List",
      content: "Choose your list.",
    },
    {
      target: "#tour-credits",
      title: "Step 6 of 8: 💳 Credits",
      content: "Credits are only deducted for revealed details.",
    },
    {
      target: "#tour-navigation",
      title: "Step 7 of 8: 📌 Dashboard",
      content: "Explore your lists and settings.",
      placement: "right" as const,
    },
    {
      target: "#tour-support",
      title: "Step 8 of 8: 🤝 Help",
      content: "Need help? Contact us!",
      placement: "center" as const,
    },
  ];

  const handleJoyrideCallback = async (data: any) => {
    const { action, index, status, type } = data;

    // CRITICAL: Look for these logs in your browser console!
    console.log(
      `[TOUR EVENT] Type: ${type} | Index: ${index} | Action: ${action}`,
    );

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

    if (type === EVENTS.STEP_AFTER) {
      if (action === ACTIONS.NEXT) {
        if (index === 0) {
          setStepIndex(1); // Move immediately to Step 2
        } else if (index === 1) {
          window.dispatchEvent(new Event("tour:open-bulk"));
          // Small delay to let React render the modal
          setTimeout(() => setStepIndex(2), 100);
        } else if (index === 3) {
          window.dispatchEvent(new Event("tour:open-add"));
          setTimeout(() => setStepIndex(4), 100);
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
          disableScrolling={true}
          disableScrollParentFix={true}
          spotlightClicks={true}
          floaterProps={{ disableAnimation: true }}
          styles={
            {
              options: { primaryColor: "#F35114", zIndex: 10000 },
              tooltipContainer: { textAlign: "left" },
              spotlight: { pointerEvents: "auto" },
            } as any
          }
        />
        {/* ... Rest of your layout JSX (Sidebar, Topbar, etc.) */}
        <div className="hidden lg:block h-screen shrink-0">
          <Sidebar />
        </div>
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {!hideTopbar && (
            <div className="shrink-0 bg-white border-b-2">
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

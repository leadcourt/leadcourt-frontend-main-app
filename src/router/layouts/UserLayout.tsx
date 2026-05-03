import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useRecoilValue, useRecoilState } from "recoil";
import {
  accessTokenState,
  userState,
  creditState,
} from "../../utils/atom/authAtom";
import { useEffect, useState, useRef } from "react";
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

  const tourStartedRef = useRef(false);
  const location = useLocation();
  const hideTopbar = ["/subscription"].includes(location.pathname);

  const handleSideBar = () => setDisplaySide((prev) => !prev);

  useEffect(() => {
    // Kill smooth scrolling globally during the session to stop calculation loops
    document.documentElement.style.scrollBehavior = "auto";

    const localDismissed = localStorage.getItem(`tour_seen_${user?.id}`);

    if (
      user?.id &&
      creditInfoValue &&
      !creditInfoValue.hasSeenTour &&
      !localDismissed &&
      !tourStartedRef.current
    ) {
      tourStartedRef.current = true;
      console.log("[TOUR] Triggering Start Sequence...");
      const timer = setTimeout(() => {
        setStepIndex(0);
        setRunTour(true);
      }, 2000); // Increased delay to 2s to ensure table data is fully painted
      return () => clearTimeout(timer);
    }
  }, [user?.id, creditInfoValue]);

  const steps: any[] = [
    {
      target: "#tour-filters",
      title: "Step 1 of 8: 👉 Find Leads",
      content: "Use these filters to narrow down 14M+ leads.",
      disableBeacon: true,
      placement: "bottom" as const,
    },
    {
      target: "#tour-bulk-add-btn",
      title: "Step 2 of 8: ⚡ Bulk Add Leads",
      content: "Click here to save hundreds of leads to your lists instantly.",
      placement: "bottom" as const,
    },
    {
      target: "#tour-page-range",
      title: "Step 3 of 8: 📄 Select Page Range",
      content: "Enter a start and end page to grab huge batches at once.",
    },
    {
      target: "#tour-proceed-btn",
      title: "Step 4 of 8: ✅ Confirm Selection",
      content: "Once you’ve selected your page range, click proceed.",
    },
    {
      target: "#tour-list-selection",
      title: "Step 5 of 8: 📂 Save to a List",
      content: "Choose where to store them or create a new list.",
    },
    {
      target: "#tour-credits",
      title: "Step 6 of 8: 💳 Your Credits",
      content: "Credits are only deducted when you reveal contact details.",
    },
    {
      target: "#tour-navigation",
      title: "Step 7 of 8: 📌 Explore Dashboard",
      content: "Access your lists and settings right here.",
      placement: "right" as const,
    },
    {
      target: "#tour-support",
      title: "Step 8 of 8: 🤝 Need Help?",
      content: "Reach out to our support team anytime!",
      placement: "center" as const,
    },
  ];

  const handleJoyrideCallback = async (data: any) => {
    const { action, index, status, type } = data;

    // This will print detailed info in your console to help us debug
    if (type !== "tooltip") {
      console.log(
        `[TOUR EVENT] Type: ${type} | Index: ${index} | Action: ${action} | Status: ${status}`,
      );
    }

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

    // Handle "Next" clicks OR if Joyride can't find the element (to prevent freezing)
    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      if (action === ACTIONS.NEXT) {
        if (index === 0) {
          setStepIndex(1);
        } else if (index === 1) {
          window.dispatchEvent(new Event("tour:open-bulk"));
          setTimeout(() => setStepIndex(2), 200);
        } else if (index === 3) {
          window.dispatchEvent(new Event("tour:open-add"));
          setTimeout(() => setStepIndex(4), 200);
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
          debug={true} // <--- ENABLE THIS: Detailed logs in console
          // @ts-ignore
          showSkipButton={true}
          callback={handleJoyrideCallback}
          disableScrolling={true}
          disableScrollParentFix={true}
          spotlightClicks={true}
          disableOverlayClose={true}
          floaterProps={{ disableAnimation: true }}
          styles={
            {
              options: { primaryColor: "#F35114", zIndex: 10000 },
              tooltipContainer: { textAlign: "left" },
              spotlight: { pointerEvents: "auto", borderRadius: 12 },
            } as any
          }
        />

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

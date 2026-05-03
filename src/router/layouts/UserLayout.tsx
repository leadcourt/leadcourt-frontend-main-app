import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useRecoilValue, useRecoilState } from "recoil";
import {
  accessTokenState,
  userState,
  creditState,
  tourStepIndexState,
  tourRunningState,
  tourHasStartedState,
} from "../../utils/atom/authAtom";
import { useEffect, useMemo } from "react";
import Sidebar from "../../component/Sidebar";
import Topbar from "../../component/Topbar";
import VerifyEmail from "../../pages/auth/VerifyEmail";
import { sidebarOpenState } from "../../utils/atom/layoutAtom";
import { Joyride, STATUS, ACTIONS, EVENTS, Step } from "react-joyride";
import axios from "axios";

export default function UserLayout() {
  const accessToken = useRecoilValue(accessTokenState);
  const user: any = useRecoilValue(userState);
  const creditInfoValue: any = useRecoilValue(creditState);
  const [displaySide, setDisplaySide] = useRecoilState(sidebarOpenState);

  // Persistent Tour State via Recoil
  const [stepIndex, setStepIndex] = useRecoilState(tourStepIndexState);
  const [runTour, setRunTour] = useRecoilState(tourRunningState);
  const [tourHasStarted, setTourHasStarted] =
    useRecoilState(tourHasStartedState);

  const location = useLocation();
  const hideTopbar = ["/subscription"].includes(location.pathname);
  const handleSideBar = () => setDisplaySide((prev) => !prev);

  // Memoize steps to ensure Joyride doesn't re-calculate on every state change
  const steps: Step[] = useMemo(
    () => [
      {
        target: "#tour-filters",
        title: "Step 1 of 8: 👉 Find Leads",
        content: "Use these filters to narrow down 14M+ leads.",
        disableBeacon: true,
        placement: "bottom",
      },
      {
        target: "#tour-bulk-add-btn",
        title: "Step 2 of 8: ⚡ Bulk Add Leads",
        content: "Click here to save hundreds of leads at once.",
        placement: "bottom",
      },
      {
        target: "#tour-page-range",
        title: "Step 3 of 8: 📄 Page Range",
        content: "Enter a start and end page to grab batches.",
      },
      {
        target: "#tour-proceed-btn",
        title: "Step 4 of 8: ✅ Confirm Selection",
        content: "Click proceed to securely save leads.",
      },
      {
        target: "#tour-list-selection",
        title: "Step 5 of 8: 📂 Save to a List",
        content: "Choose where to store them.",
      },
      {
        target: "#tour-credits",
        title: "Step 6 of 8: 💳 Your Credits",
        content: "Credits are only deducted for revealed contact details.",
      },
      {
        target: "#tour-navigation",
        title: "Step 7 of 8: 📌 Dashboard",
        content: "Access your lists and settings here.",
        placement: "right",
      },
      {
        target: "#tour-support",
        title: "Step 8 of 8: 🤝 Need Help?",
        content: "Reach out to our support team anytime!",
        placement: "center",
      },
    ],
    [],
  );

  useEffect(() => {
    // 1. Disable global smooth scrolling to prevent Joyride calculation loops
    document.documentElement.style.scrollBehavior = "auto";

    if (!user?.id || !creditInfoValue) return;

    const localDismissed = localStorage.getItem(`tour_seen_${user?.id}`);

    // 2. Trigger Logic: Only start if not seen, not dismissed, and not already started in this session
    if (!creditInfoValue.hasSeenTour && !localDismissed && !tourHasStarted) {
      const timer = setTimeout(() => {
        const target = document.querySelector("#tour-filters");
        if (target) {
          setTourHasStarted(true); // LOCK initialization to prevent Step 0 loops
          setStepIndex(0);
          setRunTour(true);
        }
      }, 3000); // 3s delay ensures table and PrimeReact styles are fully painted
      return () => clearTimeout(timer);
    }
  }, [
    user?.id,
    creditInfoValue,
    tourHasStarted,
    setTourHasStarted,
    setStepIndex,
    setRunTour,
  ]);

  const handleJoyrideCallback = async (data: any) => {
    const { action, index, status, type } = data;

    // Log events for debugging transitions
    if (type !== "tooltip") {
      console.log(`[TOUR] ${type} | Index: ${index} | Action: ${action}`);
    }

    // Handle Closing/Completion
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setRunTour(false);
      setStepIndex(0);
      setTourHasStarted(false);
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

    // 3. Forced Progression: If an ID is missing (like a modal not opening fast enough), don't freeze
    if (type === EVENTS.TARGET_NOT_FOUND) {
      setStepIndex(index + 1);
      return;
    }

    // 4. Manual Navigation Logic for Modals
    if (type === EVENTS.STEP_AFTER) {
      if (action === ACTIONS.NEXT) {
        if (index === 0) {
          setStepIndex(1);
        } else if (index === 1) {
          window.dispatchEvent(new Event("tour:open-bulk"));
          setTimeout(() => setStepIndex(2), 600);
        } else if (index === 3) {
          window.dispatchEvent(new Event("tour:open-add"));
          setTimeout(() => setStepIndex(4), 600);
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
          continuous
          debug={true}
          // @ts-ignore
          showSkipButton
          callback={handleJoyrideCallback}
          // THE ANTI-FREEZE PROPS
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

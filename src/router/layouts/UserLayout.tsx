import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useRecoilValue, useRecoilState } from "recoil";
import {
  accessTokenState,
  userState,
  creditState,
  tourStepIndexState,
  tourRunningState,
} from "../../utils/atom/authAtom";
import { useEffect, useRef, useMemo } from "react";
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

  // Use Recoil for Tour State to survive Layout Remounts
  const [stepIndex, setStepIndex] = useRecoilState(tourStepIndexState);
  const [runTour, setRunTour] = useRecoilState(tourRunningState);

  const tourStartedRef = useRef(false);
  const location = useLocation();
  const hideTopbar = ["/subscription"].includes(location.pathname);

  const handleSideBar = () => setDisplaySide((prev) => !prev);

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
    document.documentElement.style.scrollBehavior = "auto";
    const localDismissed = localStorage.getItem(`tour_seen_${user?.id}`);

    const startTourSequence = () => {
      const target = document.querySelector("#tour-filters");
      if (target && !tourStartedRef.current && !localDismissed) {
        tourStartedRef.current = true;
        setStepIndex(0);
        setRunTour(true);
      }
    };

    if (
      user?.id &&
      creditInfoValue &&
      !creditInfoValue.hasSeenTour &&
      !localDismissed &&
      !runTour
    ) {
      const timer = setTimeout(startTourSequence, 2000);
      return () => clearTimeout(timer);
    }
  }, [user?.id, creditInfoValue, runTour, setRunTour, setStepIndex]);

  const handleJoyrideCallback = async (data: any) => {
    const { action, index, status, type } = data;

    console.log(
      `[RECOIL TOUR] Type: ${type} | Index: ${index} | Action: ${action} | Status: ${status}`,
    );

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
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

    // 1. FORCED PROGRESSION: If a target is missing, jump to the next step
    if (type === EVENTS.TARGET_NOT_FOUND) {
      console.warn(
        `[TOUR] Target #${steps[index]?.target} not found. Forcing next step.`,
      );
      setStepIndex(index + 1);
      return;
    }

    // 2. LOGIC FOR STEP TRANSITIONS
    if (type === EVENTS.STEP_AFTER) {
      if (action === ACTIONS.NEXT) {
        if (index === 0) {
          // Moving from Filters to Bulk Add Button
          setStepIndex(1);
        } else if (index === 1) {
          // Open Bulk Modal and move to Page Range
          window.dispatchEvent(new Event("tour:open-bulk"));
          setTimeout(() => setStepIndex(2), 500);
        } else if (index === 3) {
          // Open List Selection Modal
          window.dispatchEvent(new Event("tour:open-add"));
          setTimeout(() => setStepIndex(4), 500);
        } else if (index === 4) {
          // Close Modals and move to Credits in Topbar
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
          disableScrolling
          disableScrollParentFix
          spotlightClicks
          disableOverlayClose
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

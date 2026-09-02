import React, { useState, useEffect } from "react";
import {
  Filter,
  Search,
  Eye,
  Sparkles,
  X,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import axios from "axios";

interface GuidedTourProps {
  onClose: () => void;
}

interface TourStep {
  targetId: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  position: "bottom" | "top" | "left" | "right" | "center";
}

const baseUrl = import.meta.env.VITE_BE_URL || "http://localhost:5000/api";

export default function GuidedTour({ onClose }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const steps: TourStep[] = [
    {
      targetId: "tour-filter-bar",
      title: "1. Target Your Ideal Leads",
      description:
        "Filter across 140M+ verified contacts by Location, Job Title, Industry, and Company Size.",
      icon: <Filter className="w-5 h-5 text-orange-600" />,
      position: "bottom",
    },
    {
      targetId: "tour-leads-table",
      title: "2. Instant Contact Discovery",
      description:
        "Preview verified names, job designations, organizations, and locations in real time.",
      icon: <Search className="w-5 h-5 text-orange-600" />,
      position: "top",
    },
    {
      targetId: "tour-reveal-action",
      title: "3. Reveal Contact Details",
      description: "You can click here to reveal their email.",
      icon: <Eye className="w-5 h-5 text-orange-600" />,
      position: "bottom",
    },
    {
      targetId: "tour-credit-wallet",
      title: "4. Your Credit Balance",
      description:
        "Keep track of your available search and reveal credits here anytime.",
      icon: <Sparkles className="w-5 h-5 text-orange-600" />,
      position: "bottom",
    },
  ];

  const updateTargetRect = () => {
    const step = steps[currentStep];
    if (!step) return;

    if (step.targetId === "center") {
      setTargetRect(null);
      return;
    }

    const el = document.getElementById(step.targetId);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  };

  useEffect(() => {
    updateTargetRect();
    window.addEventListener("resize", updateTargetRect);
    window.addEventListener("scroll", updateTargetRect);
    return () => {
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect);
    };
  }, [currentStep]);

  const markTourSeen = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${baseUrl}/list2/mark-tour`,
        {},
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true,
        },
      );
    } catch (_) {}
  };

  const handleFinish = async () => {
    localStorage.setItem("hasSeenTour", "true");
    await markTourSeen();
    onClose();
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-auto">
      {/* Dark overlay backdrop */}
      <div
        className="fixed inset-0 bg-black/60 transition-opacity duration-300"
        onClick={handleFinish}
      />

      {/* Spotlight highlight border around target element */}
      {targetRect && (
        <div
          className="fixed rounded-xl ring-4 ring-orange-500 ring-offset-2 pointer-events-none transition-all duration-300 z-[10000]"
          style={{
            top: `${Math.max(0, targetRect.top - 4)}px`,
            left: `${Math.max(0, targetRect.left - 4)}px`,
            width: `${targetRect.width + 8}px`,
            height: `${targetRect.height + 8}px`,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.55)",
          }}
        />
      )}

      {/* Floating Card Modal */}
      <div
        className="fixed z-[10001] w-[90vw] max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 transition-all duration-300"
        style={{
          top: targetRect
            ? step.position === "top"
              ? `${Math.max(20, targetRect.top - 220)}px`
              : `${Math.min(window.innerHeight - 240, targetRect.bottom + 16)}px`
            : "50%",
          left: targetRect
            ? `${Math.max(20, Math.min(window.innerWidth - 440, targetRect.left + targetRect.width / 2 - 220))}px`
            : "50%",
          transform: targetRect ? "none" : "translate(-50%, -50%)",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
              {step.icon}
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-base leading-tight">
                {step.title}
              </h4>
              <div className="text-xs font-semibold text-orange-600 mt-0.5">
                Step {currentStep + 1} of {steps.length}
              </div>
            </div>
          </div>
          <button
            onClick={handleFinish}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            title="Skip Tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <p className="text-sm text-gray-600 leading-relaxed mb-6">
          {step.description}
        </p>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <button
            onClick={handleFinish}
            className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            Skip tour
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="px-4 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="px-4 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Got it!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

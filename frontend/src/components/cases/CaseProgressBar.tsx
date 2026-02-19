import { Fragment } from "react";

interface StepConfig {
  key: "bundle" | "claim" | "legal" | "facts";
  label: string;
  sublabel?: string;
  completed: boolean;
}

interface CaseProgressBarProps {
  steps: StepConfig[];
  activeStep: StepConfig["key"];
  onStepClick: (key: StepConfig["key"]) => void;
}

export function CaseProgressBar({ steps, activeStep, onStepClick }: CaseProgressBarProps) {
  return (
    <div className="flex items-start max-w-2xl mx-auto mb-8">
      {steps.map((step, index) => {
        const isActive = step.key === activeStep;
        const isCompleted = step.completed;
        const prevCompleted = index > 0 && steps[index - 1].completed;

        const circleClass = isCompleted
          ? "bg-indigo-700 text-white"
          : isActive
          ? "bg-indigo-600 text-white"
          : "bg-gray-300 text-gray-500";

        const lineClass = prevCompleted ? "bg-indigo-600" : "bg-gray-200";

        return (
          <Fragment key={step.key}>
            {index > 0 && (
              <div className={`flex-1 h-0.5 mt-[18px] ${lineClass}`} />
            )}
            <div className="flex flex-col items-center shrink-0">
              <button
                onClick={() => onStepClick(step.key)}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors cursor-pointer z-10 ${circleClass}`}
                aria-label={`Step ${index + 1}: ${step.label}`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </button>
              <span
                className={`mt-2 text-xs font-medium whitespace-nowrap ${
                  isActive ? "text-indigo-600" : isCompleted ? "text-indigo-700" : "text-gray-500"
                }`}
              >
                {step.label}
              </span>
              {step.sublabel && (
                <span className="text-xs text-gray-400 whitespace-nowrap">{step.sublabel}</span>
              )}
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

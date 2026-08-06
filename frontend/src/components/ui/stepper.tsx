import * as React from "react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

export interface StepperStep {
  id: string
  title: string
}

interface StepperProps {
  steps: StepperStep[]
  currentIndex: number
  className?: string
}

// Extracted from what used to be inline in InvestmentProcessModal.tsx —
// a persistent progress bar + step labels, generic enough for any
// multi-step wizard (pledge flow, and reusable elsewhere later).
export const Stepper: React.FC<StepperProps> = ({ steps, currentIndex, className }) => {
  const progressPercentage = ((currentIndex + 1) / steps.length) * 100

  return (
    <div className={cn("space-y-2", className)}>
      <Progress value={progressPercentage} className="w-full" />
      <div className="flex justify-between text-xs text-muted-foreground">
        {steps.map((step, index) => (
          <span key={step.id} className={index <= currentIndex ? "text-primary font-medium" : ""}>
            {step.title}
          </span>
        ))}
      </div>
    </div>
  )
}

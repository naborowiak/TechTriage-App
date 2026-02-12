import { useState, useEffect } from "react";
import type { CaseProgressStep } from "../types";

interface CaseProgressResult {
  steps: CaseProgressStep[];
  isLoading: boolean;
}

interface MessageWithGuidedAction {
  role: string;
  text: string;
  guidedAction?: {
    type: string;
    stepNumber?: number;
    title?: string;
    instruction?: string;
    question?: string;
    selectedAnswer?: string;
  };
}

export function useCaseProgress(caseId: string | null): CaseProgressResult {
  const [steps, setSteps] = useState<CaseProgressStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!caseId) {
      setSteps([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    fetch(`/api/cases/${caseId}/messages`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data: { messages: MessageWithGuidedAction[] }) => {
        if (cancelled) return;

        const messages = data.messages || [];
        const showSteps: { stepNumber: number; title: string }[] = [];
        const confirmedSteps = new Set<number>();

        // Extract showStep and confirmResult actions
        for (let i = 0; i < messages.length; i++) {
          const msg = messages[i];
          if (!msg.guidedAction) continue;

          if (msg.guidedAction.type === "showStep" && msg.guidedAction.title) {
            showSteps.push({
              stepNumber: msg.guidedAction.stepNumber ?? showSteps.length + 1,
              title: msg.guidedAction.title,
            });
          } else if (
            msg.guidedAction.type === "confirmResult" &&
            msg.guidedAction.selectedAnswer === "yes" &&
            showSteps.length > 0
          ) {
            // Mark the most recent step before this confirm as completed
            confirmedSteps.add(showSteps[showSteps.length - 1].stepNumber);
          }
        }

        if (showSteps.length > 0) {
          const derived: CaseProgressStep[] = showSteps.map((s, idx) => {
            if (confirmedSteps.has(s.stepNumber)) {
              return { label: s.title, status: "completed", stepNumber: s.stepNumber };
            }
            if (idx === showSteps.length - 1) {
              return { label: s.title, status: "in-progress", stepNumber: s.stepNumber };
            }
            return { label: s.title, status: "suggested", stepNumber: s.stepNumber };
          });
          setSteps(derived);
        } else {
          setSteps([]);
        }
      })
      .catch(() => {
        if (!cancelled) setSteps([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [caseId]);

  return { steps, isLoading };
}

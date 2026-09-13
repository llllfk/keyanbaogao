import Link from 'next/link';

import {
  getWizardSteps,
  type WizardStepKey,
} from '@/lib/project/constants';
import { cn } from '@/lib/utils';

type WizardStepsProps = {
  projectId: string;
  current: WizardStepKey;
  doFinancialAnalysis?: boolean;
};

export function WizardSteps({
  projectId,
  current,
  doFinancialAnalysis = false,
}: WizardStepsProps) {
  const steps = getWizardSteps(doFinancialAnalysis);
  const currentIndex = steps.findIndex(step => step.key === current);

  return (
    <ol className="mb-8 flex flex-wrap gap-2 border-b border-[var(--app-line)] pb-4">
      {steps.map((step, index) => {
        const active = step.key === current;
        const done = index < currentIndex;
        const href =
          step.key === 'basic'
            ? `/projects/${projectId}/basic`
            : `/projects/${projectId}/${step.href}`;

        return (
          <li key={step.key}>
            <Link
              href={href}
              aria-current={active ? 'step' : undefined}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors',
                active &&
                  'bg-[var(--app-accent)] text-white shadow-sm shadow-[var(--app-accent)]/20',
                !active &&
                  done &&
                  'bg-[var(--app-tint)] text-[var(--app-ink)]',
                !active &&
                  !done &&
                  'text-[var(--app-muted)] hover:bg-[var(--app-tint)]',
              )}
            >
              <span className="font-mono text-xs opacity-80">
                {String(index + 1).padStart(2, '0')}
              </span>
              {step.label}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

import { ReactNode } from 'react';
import { ClassNameValue } from 'tailwind-merge';

import { cn } from '@/lib/utils';

export const PanelSection = ({
  className,
  title,
  children,
}: {
  className?: ClassNameValue;
  title?: string;
  children: ReactNode;
}) => (
  <div className={cn('flex flex-col gap-3 border-b p-3 pt-0', className)}>
    {title ? <span className="text-sm font-semibold">{title}</span> : null}
    {children}
  </div>
);

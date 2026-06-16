interface P {
  size?: number;
  className?: string;
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const HeartIcon = ({ size = 24, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M20.8 8.6c0 4.5-7.4 9.2-8.8 9.9-1.4-.7-8.8-5.4-8.8-9.9A4.6 4.6 0 0 1 12 6.4a4.6 4.6 0 0 1 8.8 2.2Z" />
  </svg>
);

export const CheckIcon = ({ size = 24, className }: P) => (
  <svg {...base(size)} className={className} strokeWidth={2.4}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const HomeIcon = ({ size = 24, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20h14V9.5" />
  </svg>
);

export const CalendarIcon = ({ size = 24, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="3.5" y="5" width="17" height="16" rx="3" />
    <path d="M3.5 9.5h17M8 3v4M16 3v4" />
  </svg>
);

export const SparkIcon = ({ size = 24, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3v4M12 17v4M5 12H3M21 12h-2M6 6l1.5 1.5M16.5 16.5 18 18M18 6l-1.5 1.5M7.5 16.5 6 18" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const GearIcon = ({ size = 24, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2l-.4-2.6h-4l-.4 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z" />
  </svg>
);

export const PlusIcon = ({ size = 24, className }: P) => (
  <svg {...base(size)} className={className} strokeWidth={2.2}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const BackIcon = ({ size = 24, className }: P) => (
  <svg {...base(size)} className={className} strokeWidth={2.2}>
    <path d="m15 18-6-6 6-6" />
  </svg>
);

export const TrashIcon = ({ size = 24, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
  </svg>
);

export const EditIcon = ({ size = 24, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

export const FlameIcon = ({ size = 24, className }: P) => (
  <svg {...base(size)} className={className} fill="currentColor" stroke="none">
    <path d="M12 2c1 3-2 4-2 7a2 2 0 1 0 4 0c2 1.5 3 3.5 3 6a5 5 0 1 1-10 0c0-3 2-4 2-7 0-1 .5-2 3-6Z" />
  </svg>
);

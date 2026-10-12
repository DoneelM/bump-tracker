export type IconName = 'home' | 'weeks' | 'tools' | 'journal' | 'more' | 'baby' | 'help';

const PATHS: Record<IconName, string> = {
  home: 'M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4.5v-5.5h-5V21H5a1 1 0 0 1-1-1z',
  weeks: 'M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM4 10.5h16M8.5 3.5v4M15.5 3.5v4',
  tools: 'M5 5h5.5v5.5H5zM13.5 5H19v5.5h-5.5zM5 13.5h5.5V19H5zM13.5 13.5H19V19h-5.5z',
  journal: 'M6.5 4H18a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6.5A1.5 1.5 0 0 1 5 18.5v-13A1.5 1.5 0 0 1 6.5 4zM9 8.5h6M9 12h6',
  more: 'M6 12h.01M12 12h.01M18 12h.01',
  baby: 'M10 3.5h4M9.5 6.5h5l1 2.5v10a1.5 1.5 0 0 1-1.5 1.5h-4A1.5 1.5 0 0 1 8.5 19V9zM8.5 12.5h7',
  help: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM12 8v8M8 12h8',
};

/** Simple outlined line icons (decorative; always pair with visible text). */
export function Icon({ name }: { name: IconName }) {
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth={name === 'more' ? 3.2 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

import {
  Code2,
  Handshake,
  LifeBuoy,
  LineChart,
  Megaphone,
  PanelsTopLeft,
  Rocket,
  UsersRound,
  Workflow,
} from "lucide-react";

const icons = {
  Code2,
  Handshake,
  LifeBuoy,
  LineChart,
  Megaphone,
  PanelsTopLeft,
  Rocket,
  UsersRound,
  Workflow,
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name as keyof typeof icons] ?? PanelsTopLeft;
  return <Icon className={className ?? "h-5 w-5"} aria-hidden="true" />;
}


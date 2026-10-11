import {
  Activity,
  ArrowRight,
  Beef,
  Boxes,
  CalendarClock,
  ClipboardCheck,
  Clock,
  DoorOpen,
  FileCheck,
  Fish,
  Fingerprint,
  Forklift,
  Gauge,
  Layers,
  Leaf,
  MapPin,
  PackageCheck,
  Pill,
  RadioTower,
  Route,
  Scale,
  ScanLine,
  ShieldCheck,
  Snowflake,
  ThermometerSnowflake,
  Truck,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

import type { IconName } from "@/lib/catalog";
import { cn } from "@/lib/utilities/cn";

/**
 * Single resolution point between the serializable `IconName` used in
 * `lib/catalog` and the actual lucide components.
 *
 * Storing icon *names* in the content catalog keeps that module importable from
 * server components and serializable across the RSC boundary; this map is the
 * only place that touches React components. `optimizePackageImports` keeps the
 * unused lucide barrel out of the bundle.
 */
const ICONS: Record<IconName, LucideIcon> = {
  truck: Truck,
  "clipboard-check": ClipboardCheck,
  "thermometer-snowflake": ThermometerSnowflake,
  warehouse: Warehouse,
  activity: Activity,
  "package-check": PackageCheck,
  leaf: Leaf,
  beef: Beef,
  fish: Fish,
  pill: Pill,
  "shield-check": ShieldCheck,
  "scan-line": ScanLine,
  route: Route,
  boxes: Boxes,
  "door-open": DoorOpen,
  snowflake: Snowflake,
  gauge: Gauge,
  camera: ShieldCheck,
  fingerprint: Fingerprint,
  clock: Clock,
  layers: Layers,
  "file-check": FileCheck,
  "map-pin": MapPin,
  "radio-tower": RadioTower,
  forklift: Forklift,
  "calendar-clock": CalendarClock,
  scale: Scale,
  "arrow-right": ArrowRight,
};

interface CatalogIconProps {
  name: IconName;
  className?: string;
  /** Pixel size. Defaults to 20. */
  size?: number;
  strokeWidth?: number;
  /** Decorative by default — icons must not be announced twice. */
  label?: string;
}

export function CatalogIcon({
  name,
  className,
  size = 20,
  strokeWidth = 1.5,
  label,
}: CatalogIconProps) {
  const Icon = ICONS[name] ?? Boxes;
  return (
    <Icon
      size={size}
      strokeWidth={strokeWidth}
      className={cn("shrink-0", className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      focusable="false"
    />
  );
}

export type { IconName };

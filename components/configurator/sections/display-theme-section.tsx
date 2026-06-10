"use client";

import { Label } from "@/components/ui/label";

export interface DisplayThemeValue {
  colorScheme: "light" | "dark" | "auto";
  radius: "none" | "small" | "medium" | "large" | "pill";
  density: "compact" | "normal" | "spacious";
  color: {
    accent: string;
    surface: string;
    text: string;
    subText: string;
    border: string;
  };
}

interface Props {
  value: DisplayThemeValue;
  onChange: (next: DisplayThemeValue) => void;
}

const COLOR_SCHEME_OPTIONS: { value: DisplayThemeValue["colorScheme"]; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "auto", label: "Auto" },
];

const RADIUS_OPTIONS: { value: DisplayThemeValue["radius"]; label: string }[] = [
  { value: "none", label: "None" },
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
  { value: "pill", label: "Pill" },
];

const DENSITY_OPTIONS: { value: DisplayThemeValue["density"]; label: string }[] = [
  { value: "compact", label: "Compact" },
  { value: "normal", label: "Normal" },
  { value: "spacious", label: "Spacious" },
];

const COLOR_FIELDS: { key: keyof DisplayThemeValue["color"]; label: string }[] = [
  { key: "accent", label: "Accent" },
  { key: "surface", label: "Surface" },
  { key: "text", label: "Text" },
  { key: "subText", label: "Sub-text" },
  { key: "border", label: "Border" },
];

export function DisplayThemeSection({ value, onChange }: Props) {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold">Theme</h3>

      {/* Color Scheme */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Color Scheme</Label>
        <div className="flex gap-2">
          {COLOR_SCHEME_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="colorScheme"
                value={opt.value}
                checked={value.colorScheme === opt.value}
                onChange={() => onChange({ ...value, colorScheme: opt.value })}
                className="accent-primary"
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Radius */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Corner Radius</Label>
        <div className="flex flex-wrap gap-2">
          {RADIUS_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="radius"
                value={opt.value}
                checked={value.radius === opt.value}
                onChange={() => onChange({ ...value, radius: opt.value })}
                className="accent-primary"
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Density */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Density</Label>
        <div className="flex gap-2">
          {DENSITY_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="density"
                value={opt.value}
                checked={value.density === opt.value}
                onChange={() => onChange({ ...value, density: opt.value })}
                className="accent-primary"
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Color Pickers */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Colors</Label>
        <div className="grid grid-cols-2 gap-3">
          {COLOR_FIELDS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <input
                type="color"
                id={`color-${key}`}
                value={value.color[key]}
                onChange={(e) =>
                  onChange({ ...value, color: { ...value.color, [key]: e.target.value } })
                }
                className="h-8 w-8 cursor-pointer rounded border border-input p-0.5"
              />
              <Label htmlFor={`color-${key}`} className="text-sm cursor-pointer">
                {label}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

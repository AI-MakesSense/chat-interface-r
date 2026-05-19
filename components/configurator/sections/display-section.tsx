"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export interface DisplaySectionValue {
  position: "right" | "left";
  defaultOpen: boolean;
  header: { title: string; showCount: boolean };
  emptyMessage: string;
}

interface Props {
  value: DisplaySectionValue;
  onChange: (next: DisplaySectionValue) => void;
}

export function DisplaySection({ value, onChange }: Props) {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold">Display</h3>

      {/* Header Title */}
      <div className="space-y-1.5">
        <Label htmlFor="display-title" className="text-xs text-muted-foreground">
          Title
        </Label>
        <Input
          id="display-title"
          type="text"
          placeholder="Required documents"
          value={value.header.title}
          onChange={(e) =>
            onChange({ ...value, header: { ...value.header, title: e.target.value } })
          }
        />
      </div>

      {/* Position */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Position</Label>
        <div className="flex gap-4">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="display-position"
              value="right"
              checked={value.position === "right"}
              onChange={() => onChange({ ...value, position: "right" })}
              className="accent-primary"
              aria-label="Right"
            />
            <span className="text-sm">Right</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="display-position"
              value="left"
              checked={value.position === "left"}
              onChange={() => onChange({ ...value, position: "left" })}
              className="accent-primary"
              aria-label="Left"
            />
            <span className="text-sm">Left</span>
          </label>
        </div>
      </div>

      {/* Default Open */}
      <div className="flex items-center justify-between">
        <Label htmlFor="display-default-open" className="text-sm cursor-pointer">
          Open by default
        </Label>
        <Switch
          id="display-default-open"
          checked={value.defaultOpen}
          onCheckedChange={(checked) => onChange({ ...value, defaultOpen: checked })}
        />
      </div>

      {/* Show Count */}
      <div className="flex items-center justify-between">
        <Label htmlFor="display-show-count" className="text-sm cursor-pointer">
          Show document count
        </Label>
        <Switch
          id="display-show-count"
          checked={value.header.showCount}
          onCheckedChange={(checked) =>
            onChange({ ...value, header: { ...value.header, showCount: checked } })
          }
        />
      </div>

      {/* Empty Message */}
      <div className="space-y-1.5">
        <Label htmlFor="display-empty-message" className="text-xs text-muted-foreground">
          Empty Message
        </Label>
        <Input
          id="display-empty-message"
          type="text"
          placeholder="No documents available."
          value={value.emptyMessage}
          onChange={(e) => onChange({ ...value, emptyMessage: e.target.value })}
        />
      </div>
    </section>
  );
}

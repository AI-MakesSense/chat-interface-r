"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export interface DisplayBrandingValue {
  companyName: string;
  logoUrl: string | null;
  brandingEnabled: boolean;
}

interface Props {
  value: DisplayBrandingValue;
  onChange: (next: DisplayBrandingValue) => void;
  brandingToggleDisabled?: boolean;
  brandingToggleDisabledReason?: string;
}

export function DisplayBrandingSection({
  value,
  onChange,
  brandingToggleDisabled,
  brandingToggleDisabledReason,
}: Props) {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold">Branding</h3>

      {/* Company Name */}
      <div className="space-y-1.5">
        <Label htmlFor="branding-company-name" className="text-xs text-muted-foreground">
          Company Name
        </Label>
        <Input
          id="branding-company-name"
          type="text"
          placeholder="Your company name"
          value={value.companyName}
          onChange={(e) => onChange({ ...value, companyName: e.target.value })}
        />
      </div>

      {/* Logo URL */}
      <div className="space-y-1.5">
        <Label htmlFor="branding-logo-url" className="text-xs text-muted-foreground">
          Logo URL
        </Label>
        <Input
          id="branding-logo-url"
          type="url"
          placeholder="https://example.com/logo.png"
          value={value.logoUrl ?? ""}
          onChange={(e) => {
            const raw = e.target.value;
            onChange({ ...value, logoUrl: raw.length > 0 ? raw : null });
          }}
        />
      </div>

      {/* Branding Enabled */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="branding-enabled"
            className={`text-sm cursor-pointer ${brandingToggleDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Show Branding
          </Label>
          <Switch
            id="branding-enabled"
            checked={value.brandingEnabled}
            onCheckedChange={(checked) => onChange({ ...value, brandingEnabled: checked })}
            disabled={brandingToggleDisabled}
          />
        </div>
        {brandingToggleDisabled && brandingToggleDisabledReason && (
          <p className="text-xs text-muted-foreground">{brandingToggleDisabledReason}</p>
        )}
      </div>
    </section>
  );
}

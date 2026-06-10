/**
 * Tests for the registry-driven configurator form (Phase 6, Task 22).
 *
 * ConfigSection renders the CHAT_FIELD_REGISTRY fields for one section, applies
 * showIf, locks pro-gated fields below the pro tier, and bubbles edits up via
 * onChange(path, value).
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfigSection } from '@/components/configurator/config-form/section';
import { chatWidgetConfigSchema } from '@/lib/widget-config/schema';

const baseConfig = chatWidgetConfigSchema.parse({});

describe('ConfigSection (branding)', () => {
  it('renders company name + branding toggle, hides custom-icon URL when launcher icon is not custom', () => {
    render(
      <ConfigSection sectionId="branding" config={baseConfig} tier="pro" onChange={() => {}} />,
    );

    expect(screen.getByText('Company name')).toBeInTheDocument();
    expect(screen.getByText(/Powered by/i)).toBeInTheDocument();
    // launcherIcon defaults to 'chat', so the custom-icon URL field is hidden.
    expect(screen.queryByText('Custom icon URL')).not.toBeInTheDocument();
  });

  it('shows the custom-icon URL field when launcher icon is "custom"', () => {
    const custom = chatWidgetConfigSchema.parse({
      branding: { launcherIcon: 'custom', customLauncherIconUrl: 'https://example.com/i.png' },
    });
    render(
      <ConfigSection sectionId="branding" config={custom} tier="pro" onChange={() => {}} />,
    );
    expect(screen.getByText('Custom icon URL')).toBeInTheDocument();
  });

  it('disables the pro-gated branding toggle for a basic-tier user', () => {
    render(
      <ConfigSection sectionId="branding" config={baseConfig} tier="basic" onChange={() => {}} />,
    );
    const toggle = screen.getByRole('switch', { name: /Powered by/i });
    expect(toggle).toBeDisabled();
  });

  it('enables the pro-gated branding toggle for a pro-tier user', () => {
    render(
      <ConfigSection sectionId="branding" config={baseConfig} tier="pro" onChange={() => {}} />,
    );
    const toggle = screen.getByRole('switch', { name: /Powered by/i });
    expect(toggle).not.toBeDisabled();
  });

  it('calls onChange("branding.companyName", value) when the company name changes', () => {
    const onChange = jest.fn();
    render(
      <ConfigSection sectionId="branding" config={baseConfig} tier="pro" onChange={onChange} />,
    );
    const input = screen.getByDisplayValue(baseConfig.branding.companyName);
    fireEvent.change(input, { target: { value: 'Acme Corp' } });
    expect(onChange).toHaveBeenCalledWith('branding.companyName', 'Acme Corp');
  });
});

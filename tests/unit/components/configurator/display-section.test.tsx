import { render, screen, fireEvent } from "@testing-library/react";
import { DisplaySection } from "@/components/configurator/sections/display-section";

const initial = {
  position: "right" as const,
  defaultOpen: true,
  header: { title: "Required documents", showCount: true },
  emptyMessage: "No documents available.",
};

describe("DisplaySection", () => {
  it("renders all fields with initial values", () => {
    render(<DisplaySection value={initial} onChange={() => {}} />);
    expect(screen.getByLabelText(/title/i)).toHaveValue("Required documents");
    expect(screen.getByLabelText(/empty message/i)).toHaveValue("No documents available.");
  });

  it("calls onChange when title changes", () => {
    const onChange = jest.fn();
    render(<DisplaySection value={initial} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: "New title" } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        header: expect.objectContaining({ title: "New title" }),
      })
    );
  });

  it("toggles position to left when the left option is selected", () => {
    const onChange = jest.fn();
    render(<DisplaySection value={initial} onChange={onChange} />);
    const leftRadio = screen.getByLabelText(/left/i);
    fireEvent.click(leftRadio);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ position: "left" }));
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PhotoField from "@/components/contacts/PhotoField";
import { MAX_PHOTO_BYTES } from "@/lib/contacts/schema";

describe("PhotoField", () => {
  it("preserves an existing photo and lets the user remove it", async () => {
    const photo = "data:image/png;base64,iVBORw0KGgo=";
    const { container } = render(<PhotoField initialPhoto={photo} />);

    expect(container.querySelector('input[name="photo"]')).toHaveValue(photo);
    await userEvent.click(screen.getByRole("button", { name: /remove photo/i }));
    expect(container.querySelector('input[name="photo"]')).toHaveValue("");
  });

  it("rejects unsupported image formats before reading them", async () => {
    const { container } = render(<PhotoField initialPhoto={null} />);
    const input = screen.getByLabelText(/choose contact photo/i);

    await userEvent.upload(
      input,
      new File(["<svg />"], "avatar.svg", { type: "image/svg+xml" }),
      { applyAccept: false },
    );

    expect(screen.getByRole("alert")).toHaveTextContent(/jpeg, png, or webp/i);
    expect(container.querySelector('input[name="photo"]')).toHaveValue("");
  });

  it("rejects photos larger than two megabytes", async () => {
    render(<PhotoField initialPhoto={null} />);
    const input = screen.getByLabelText(/choose contact photo/i);
    const file = new File([new Uint8Array(MAX_PHOTO_BYTES + 1)], "large.png", {
      type: "image/png",
    });

    await userEvent.upload(input, file);

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/2 mb or smaller/i),
    );
  });
});

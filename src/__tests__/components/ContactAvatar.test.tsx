import { render, screen } from "@testing-library/react";
import ContactAvatar from "@/components/contacts/ContactAvatar";
import { makeContact } from "../mocks/handlers";

describe("ContactAvatar", () => {
  it("shows initials when the contact has no photo", () => {
    render(<ContactAvatar contact={makeContact()} />);

    expect(screen.getByText("AL")).toBeInTheDocument();
  });

  it("shows a circular photo instead of initials", () => {
    const { container } = render(
      <ContactAvatar
        contact={makeContact({ photo: "data:image/png;base64,iVBORw0KGgo=" })}
      />,
    );

    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "data:image/png;base64,iVBORw0KGgo=",
    );
    expect(screen.queryByText("AL")).not.toBeInTheDocument();
  });
});

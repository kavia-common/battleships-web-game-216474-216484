import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders Battleships title", () => {
  render(<App />);
  expect(screen.getByText(/Battleships/i)).toBeInTheDocument();
});

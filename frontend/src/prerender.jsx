import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import PublicApp from "./PublicApp";
export function renderHome() {
  return renderToString(<MemoryRouter initialEntries={["/"]}><PublicApp /></MemoryRouter>);
}

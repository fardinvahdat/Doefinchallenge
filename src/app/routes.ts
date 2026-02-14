import { createBrowserRouter } from "react-router";
import Root from "./Root";
import Home from "./pages/Home";
import CreateCondition from "./pages/CreateCondition";
import CreateMarket from "./pages/CreateMarket";
import Markets from "./pages/Markets";
import Architecture from "./pages/Architecture";
import NotFound from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "create-condition", Component: CreateCondition },
      { path: "create-market", Component: CreateMarket },
      { path: "markets", Component: Markets },
      { path: "architecture", Component: Architecture },
      { path: "*", Component: NotFound },
    ],
  },
]);
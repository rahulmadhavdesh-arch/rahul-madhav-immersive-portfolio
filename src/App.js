import "@/App.css";
import Portfolio from "./pages/Portfolio";
import NotFound from "./pages/NotFound";

/** One page, one route. A router would only add weight here. */
export default function App() {
  const isHome = window.location.pathname === "/" || window.location.pathname === "/index.html";
  return (
    <div className="App">
      <a className="skip-link" href="#main-content">Skip to content</a>
      {isHome ? <Portfolio /> : <NotFound />}
    </div>
  );
}

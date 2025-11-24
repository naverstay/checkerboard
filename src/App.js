import {BrowserRouter as Router, Routes, Route, NavLink, useLocation} from "react-router-dom";
import {useEffect} from "react";
import Home from "./pages/Home";
import Chess from "./pages/Chess";
import Diamond from "./pages/Diamond";
import './App.css';

function BodyClassController() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/") {
      document.body.classList.add("home-page");
    } else {
      document.body.classList.remove("home-page");
    }
  }, [location.pathname]);

  return null;
}

function App() {
  return (
    <Router>
      <BodyClassController/>

      <nav className="nav">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/chess">Chess</NavLink>
        <NavLink to="/diamond">Diamond</NavLink>
      </nav>

      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/chess" element={<Chess/>}/>
        <Route path="/diamond" element={<Diamond/>}/>
      </Routes>
    </Router>
  );
}

export default App;

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Analyzer from "@/pages/Analyzer";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Analyzer />} />
        <Route
          path="/other"
          element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center text-xl text-spectrum-muted">
                Other Page - Coming Soon
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

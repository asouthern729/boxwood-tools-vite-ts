import { BrowserRouter as Router, Routes, Route } from "react-router"
import { QueryClientProvider, QueryClient } from "@tanstack/react-query"
import { useHandleVisibilityChange } from "./utils"

const queryClient = new QueryClient()

// Components
import Layout from "@components/layout/Layout"
import Login from "@pages/Login"
import Home from "@pages/Home"
import Commercial from "@pages/Commercial"
import Personal from "@pages/Personal"
import Tool from "@pages/Tool"
import TeamContainer from "@components/team/containers/TeamContainer"

function App() {
  useHandleVisibilityChange(queryClient)

  return (
    <QueryClientProvider client={queryClient}>
      <Router basename={import.meta.env.VITE_APP_BASE}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route element={<Layout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/commercial" element={<Commercial />}>
              <Route index element={<TeamContainer />} />
              <Route path="renewal-premium-summary" element={<Tool />} />
              <Route path="pre-renewal-risk-profile" element={<Tool />} />
              <Route path="renewal-summary" element={<Tool />} />
            </Route>
            <Route path="/personal" element={<Personal />}>
              <Route index element={<TeamContainer />} />
              <Route path="download-change-report" element={<Tool />} />
              <Route path="premium-change-tool" element={<Tool />} />
              <Route path="renewal-summary" element={<Tool />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App

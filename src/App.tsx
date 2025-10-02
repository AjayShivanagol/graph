import { Routes, Route } from "react-router-dom";
import { ConfigProvider, App as AntApp, theme } from "antd";
import { useEffect } from "react";
import { useAppDispatch } from "./store/hooks";
import { removeDuplicates } from "./store/slices/promptsSlice";
import VoiceflowWorkspace from "./pages/VoiceflowWorkspace";
import "./App.css";
import "./styles/voiceflow-theme.css";

function App() {
  const dispatch = useAppDispatch();

  // Clean up duplicate prompts when app initializes
  useEffect(() => {
    dispatch(removeDuplicates());
  }, [dispatch]);

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#1890ff",
          borderRadius: 6,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
        },
      }}
    >
      <AntApp>
        <div className="vf-app">
          <Routes>
            <Route
              path="/"
              element={<VoiceflowWorkspace defaultView="workflow" />}
            />
            <Route
              path="/workflow"
              element={<VoiceflowWorkspace defaultView="workflow" />}
            />
            <Route
              path="/knowledge-base"
              element={<VoiceflowWorkspace defaultView="knowledge" />}
            />
          </Routes>
        </div>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;

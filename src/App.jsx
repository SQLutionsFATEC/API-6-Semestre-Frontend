import { useState } from "react";
import Layout from "./components/Layout/Layout";
import Home from "./pages/Home/Home";

import "./App.css";

function App() {
  const [documentsRefreshKey, setDocumentsRefreshKey] = useState(0);

  return (
    <Layout onDocumentCreated={() => setDocumentsRefreshKey((key) => key + 1)}>
      <Home documentsRefreshKey={documentsRefreshKey} />
    </Layout>
  );
}

export default App;
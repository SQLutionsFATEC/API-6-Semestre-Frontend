import { useState } from "react";
import Layout from "./components/Layout/Layout";
import Home from "./pages/Home/Home";
import AccessRequests from "./pages/AccessRequests/AccessRequests";
import UserManagement from "./pages/UserManagement/UserManagement";
import { keycloak } from "./services/keycloak";

import "./App.css";

function App() {
  const [documentsRefreshKey, setDocumentsRefreshKey] = useState(0);
  const [activePage, setActivePage] = useState("documents");
  const roleNames = [
    ...(keycloak.tokenParsed?.realm_access?.roles ?? []),
    ...Object.values(keycloak.tokenParsed?.resource_access ?? {}).flatMap(
      (client) => client.roles ?? []
    ),
  ];
  const isOperator = roleNames.some((role) =>
    ["operador", "operator"].includes(
      String(role).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    )
  );

  const currentPage =
    activePage === "users" && isOperator ? (
      <UserManagement />
    ) : activePage === "requests" && isOperator ? (
      <AccessRequests />
    ) : (
      <Home documentsRefreshKey={documentsRefreshKey} />
    );

  return (
    <Layout
      isOperator={isOperator}
      activePage={activePage}
      onNavigate={(page) => {
        if (!["requests", "users"].includes(page) || isOperator) {
          setActivePage(page);
        }
      }}
      onDocumentCreated={() => setDocumentsRefreshKey((key) => key + 1)}
    >
      {currentPage}
    </Layout>
  );
}

export default App;
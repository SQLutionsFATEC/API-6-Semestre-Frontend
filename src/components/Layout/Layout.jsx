import Sidebar from "../Sidebar/Sidebar";

import "./Layout.css";

function Layout({
  children,
  onDocumentCreated,
  isOperator = false,
  activePage = "documents",
  onNavigate,
}) {
  return (
    <div className="layout">
      <Sidebar
        onDocumentCreated={onDocumentCreated}
        isOperator={isOperator}
        activePage={activePage}
        onNavigate={onNavigate}
      />

      <main className="layout-content">
        {children}
      </main>
    </div>
  );
}

export default Layout;
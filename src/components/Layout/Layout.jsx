import Sidebar from "../Sidebar/Sidebar";

import "./Layout.css";

function Layout({ children, onDocumentCreated }) {
  return (
    <div className="layout">
      <Sidebar onDocumentCreated={onDocumentCreated} />

      <main className="layout-content">
        {children}
      </main>
    </div>
  );
}

export default Layout;
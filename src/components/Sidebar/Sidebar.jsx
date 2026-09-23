import { FiFileText, FiLogOut } from "react-icons/fi";
import "./Sidebar.css";

function Sidebar() {
  return (
    <aside className="sidebar">
      <nav className="sidebar-menu">
        <button className="sidebar-item active">
          <FiFileText size={20} />
          Documentos
        </button>
      </nav>

      <button className="logout-button">
        <FiLogOut size={20} />
        Deslogar
      </button>
    </aside>
  );
}

export default Sidebar;
import { FiFileText, FiLogOut } from "react-icons/fi";
import logo from "../../assets/AkaerLogo.png";
import "./Sidebar.css";

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">
          <img src={logo} alt="Akaer Logo" />
        </div>
      </div>

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
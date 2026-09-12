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
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M6 3H14L19 8V21H6V3Z"
              stroke="currentColor"
              strokeWidth="1.8"
            />

            <path
              d="M14 3V8H19"
              stroke="currentColor"
              strokeWidth="1.8"
            />
          </svg>

          Documentos
        </button>
      </nav>

      <button className="logout-button">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M10 5H5V19H10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d="M14 8L19 12L14 16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d="M19 12H9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>

        Deslogar
      </button>
    </aside>
  );
}

export default Sidebar;
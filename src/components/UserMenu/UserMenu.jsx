import { useEffect, useRef, useState } from "react";
import { FiCopy, FiSettings, FiUser } from "react-icons/fi";

function UserMenu({ user, onOpenProfile, onOpenConsent }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handlePointerDown(event) {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function handleSelect(action) {
    setIsOpen(false);
    action?.();
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        className="flex h-10 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3.5 text-[13.5px] font-medium text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-150 ease-in-out hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Abrir menu do usuário"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <FiUser size={18} className="shrink-0 text-[#7A0026]" aria-hidden="true" />
        <span className="hidden sm:inline">{user?.name ?? "Usuário"}</span>
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Menu do usuário"
          className="absolute right-0 top-[calc(100%+10px)] z-[900] w-60 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-[0_18px_35px_rgba(15,23,42,0.16)]"
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left text-[15px] font-medium text-[#1b4066] transition-colors duration-150 ease-in-out hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none"
            onClick={() => handleSelect(onOpenProfile)}
          >
            <FiSettings size={18} aria-hidden="true" />
            Meus dados
          </button>

          <div className="mx-4 my-1 h-px bg-slate-200" aria-hidden="true" />

          <button
            type="button"
            role="menuitem"
            className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left text-[15px] font-medium text-[#1b4066] transition-colors duration-150 ease-in-out hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none"
            onClick={() => handleSelect(onOpenConsent)}
          >
            <FiCopy size={18} aria-hidden="true" />
            Consentimento
          </button>
        </div>
      )}
    </div>
  );
}

export default UserMenu;

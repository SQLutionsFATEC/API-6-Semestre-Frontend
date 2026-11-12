import { useMemo, useState } from "react";
import {
  FiChevronDown,
  FiEdit2,
  FiLock,
  FiMail,
  FiSettings,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import Pagination from "../../components/Pagination/Pagination";

const PAGE_SIZE = 5;
const SECTORS = ["Técnico", "Normativo", "Jurídico", "Qualitativo"];
const ACCESS_LEVELS = ["Básico", "Comercial", "Militar"];

const MOCK_USERS = Array.from({ length: 20 }, (_, index) => ({
  id: index + 1,
  name: index === 3 ? "Operador de teste" : "Nome do usuário",
  email: index === 3 ? "operador.teste@email.com" : `usuario${index + 1}@email.com`,
  sector: "Técnico",
  accessLevel: index === 3 ? "Operador" : "Militar",
  isOperator: index === 3,
}));

const emailPattern = /^(?!.*\.\.)[A-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?)+$/i;

function validateUser(user) {
  const errors = {};
  if (!user.name.trim()) errors.name = "Informe o nome do usuário.";
  if (!user.email.trim()) {
    errors.email = "Informe o email do usuário.";
  } else if (!emailPattern.test(user.email.trim())) {
    errors.email = "Informe um endereço de email válido.";
  }
  if (!user.sector.trim()) {
    errors.sector = "Selecione um setor.";
  } else if (!SECTORS.includes(user.sector)) {
    errors.sector = "Selecione um setor válido.";
  }
  if (!user.accessLevel.trim()) {
    errors.accessLevel = "Selecione um nível de acesso.";
  } else if (!ACCESS_LEVELS.includes(user.accessLevel)) {
    errors.accessLevel = "Selecione um nível de acesso válido.";
  }
  return errors;
}

function UserEditModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({ ...user });
  const [errors, setErrors] = useState({});

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validateUser(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      window.alert(`Erro de validação: ${Object.values(validationErrors).join(" ")}`);
      return;
    }

    const updatedUser = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
    };
    onSave(updatedUser);
  }

  const fieldClass = (hasError) =>
    `mt-1 w-full rounded-[10px] border bg-white px-3 py-2 text-sm text-[#30343b] outline-none transition focus:border-[#8e1b54] focus:ring-2 focus:ring-[#8e1b54]/15 ${
      hasError ? "border-red-500" : "border-[#9aa8c2]"
    }`;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/35 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        className="w-full max-w-[500px] rounded-[22px] border border-[#cbaebb] bg-white px-4 py-4 shadow-[0_20px_60px_rgba(27,16,24,0.2)] sm:px-5"
        onSubmit={handleSubmit}
        noValidate
        aria-labelledby="user-edit-title"
      >
        <header className="flex items-center gap-2 border-b border-[#eadde3] px-1 pb-3 text-[#98677f]">
          <FiUser size={23} className="text-black" aria-hidden="true" />
          <FiEdit2 size={16} className="-ml-3 mt-2 text-black" aria-hidden="true" />
          <h2 id="user-edit-title" className="m-0 text-[17px] font-medium">
            Editar Usuário
          </h2>
        </header>

        <label className="sr-only" htmlFor="user-name">Nome</label>
        <input
          id="user-name"
          name="name"
          required
          value={form.name}
          onChange={updateField}
          placeholder="Nome"
          className={`mt-3 w-full rounded-[12px] border bg-white px-4 py-1 text-[32px] leading-tight text-[#4c102d] outline-none focus:border-[#8e1b54] ${errors.name ? "border-red-500" : "border-[#8797b5]"}`}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "user-name-error" : undefined}
        />
        {errors.name && <p id="user-name-error" className="mt-1 text-xs text-red-600">{errors.name}</p>}

        <div className="mt-2 border-t border-[#eadde3] pt-5">
          <label htmlFor="user-email" className="flex items-center gap-1 text-sm text-[#98677f]">
            <FiMail size={17} className="text-black" aria-hidden="true" /> Email
          </label>
          <input
            id="user-email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={updateField}
            className={fieldClass(Boolean(errors.email))}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "user-email-error" : undefined}
          />
          {errors.email && <p id="user-email-error" className="mt-1 text-xs text-red-600">{errors.email}</p>}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-b border-[#eadde3] pb-4 max-[420px]:grid-cols-1">
          <div>
            <label htmlFor="user-sector" className="flex items-center gap-1 text-sm text-[#98677f]">
              <FiSettings size={15} className="text-black" aria-hidden="true" /> Setor
            </label>
            <div className="relative">
              <select
                id="user-sector"
                name="sector"
                required
                value={form.sector}
                onChange={updateField}
                className={`${fieldClass(Boolean(errors.sector))} appearance-none pr-9 text-lg text-[#063476]`}
                aria-invalid={Boolean(errors.sector)}
              >
                {SECTORS.map((sector) => <option key={sector}>{sector}</option>)}
              </select>
              <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black" aria-hidden="true" />
            </div>
            {errors.sector && <p className="mt-1 text-xs text-red-600">{errors.sector}</p>}
          </div>
          <div>
            <label htmlFor="user-access-level" className="flex items-center gap-1 text-sm text-[#98677f]">
              <FiUser size={15} className="text-black" aria-hidden="true" /> Nível de Acesso
            </label>
            <div className="relative">
              <select
                id="user-access-level"
                name="accessLevel"
                required
                value={form.accessLevel}
                onChange={updateField}
                className={`${fieldClass(Boolean(errors.accessLevel))} appearance-none pr-9 text-lg text-[#063476]`}
                aria-invalid={Boolean(errors.accessLevel)}
              >
                {ACCESS_LEVELS.map((level) => <option key={level}>{level}</option>)}
              </select>
              <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black" aria-hidden="true" />
            </div>
            {errors.accessLevel && <p className="mt-1 text-xs text-red-600">{errors.accessLevel}</p>}
          </div>
        </div>

        <footer className="mt-5 flex justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-w-32 rounded-[11px] border border-[#b8b8b8] bg-white px-4 py-1.5 text-sm text-[#222] hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-[11px] bg-[#86164f] px-4 py-1.5 text-sm text-white hover:bg-[#6e1041]"
          >
            <FiEdit2 size={15} aria-hidden="true" /> Salvar alterações
          </button>
        </footer>
      </form>
    </div>
  );
}

export default function UserManagement() {
  const [users, setUsers] = useState(MOCK_USERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const totalPages = Math.ceil(users.length / PAGE_SIZE);
  const visibleUsers = useMemo(
    () => users.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [currentPage, users]
  );

  function saveUser(updatedUser) {
    const originalUser = users.find((user) => user.id === updatedUser.id);
    if (originalUser?.isOperator) {
      window.alert("Operadores não podem alterar os dados de outros operadores.");
      setSelectedUser(null);
      return;
    }

    setUsers((currentUsers) => currentUsers.map((user) => (
      user.id === updatedUser.id ? updatedUser : user
    )));
    window.alert(
      `Usuário atualizado com sucesso:\nNome: ${updatedUser.name}\nEmail: ${updatedUser.email}\nSetor: ${updatedUser.sector}\nNível de Acesso: ${updatedUser.accessLevel}`
    );
    setSelectedUser(null);
  }

  function handleOpenUser(user) {
    if (user.isOperator) {
      window.alert("Operadores não podem alterar os dados de outros operadores.");
      return;
    }
    setSelectedUser(user);
  }

  return (
    <main className="flex min-h-[calc(100vh-64px)] w-full flex-col">
      <header className="flex min-h-[56px] items-center justify-between border-b border-[#e8dce1] pb-1">
        <div className="flex items-center gap-2 text-[#4c102d]">
          <FiUsers size={30} className="text-black" aria-hidden="true" />
          <h1 className="m-0 text-[30px] font-medium tracking-[-0.02em] max-[560px]:text-[23px]">
            Usuários
          </h1>
        </div>
        <div className="flex items-center gap-2 border-b border-[#e8dce1] px-1 pb-2 text-[13px] text-[#333]" aria-label="Usuário atual">
          <FiUser size={23} className="text-black" aria-hidden="true" />
          <span className="max-[560px]:hidden">Nome do usuário</span>
        </div>
      </header>

      <section className="mt-6" aria-label="Lista de usuários">
        <div className="mb-1 grid grid-cols-[minmax(160px,1fr)_minmax(125px,0.55fr)_minmax(85px,0.34fr)_minmax(105px,0.38fr)_40px] items-center gap-3 px-3 pl-[46px] text-[10px] text-[#8c6a78] max-[800px]:hidden">
          <span className="flex items-center gap-1"><FiUser size={12} /> Funcionário</span>
          <span className="flex items-center gap-1"><FiMail size={12} /> Email de contato</span>
          <span className="flex items-center gap-1"><FiSettings size={12} /> Setor</span>
          <span className="flex items-center gap-1"><FiUser size={12} /> Nível de Acesso</span>
          <span className="flex items-center gap-1"><FiSettings size={12} /> Ação</span>
        </div>

        <div className="flex flex-col gap-[10px]">
          {visibleUsers.map((user) => (
            <button
              key={user.id}
              type="button"
              aria-label={user.isOperator ? `Usuário operador bloqueado: ${user.name}` : `Editar usuário ${user.name}`}
              onClick={() => handleOpenUser(user)}
              className="grid min-h-[46px] w-full grid-cols-[24px_minmax(130px,1fr)_minmax(105px,0.55fr)_minmax(75px,0.34fr)_minmax(92px,0.38fr)_30px] items-center gap-3 rounded-[9px] border border-[#dce6f8] bg-white px-3 py-1.5 text-left shadow-[0_2px_6px_rgba(33,73,137,0.14)] transition hover:border-[#9db6e8] hover:shadow-[0_3px_9px_rgba(33,73,137,0.2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#86164f] max-[800px]:grid-cols-[24px_minmax(0,1fr)_auto] max-[800px]:gap-x-3 max-[800px]:gap-y-2"
            >
              <FiUser size={23} className="text-black" aria-hidden="true" />
              <span className="truncate text-[15px] text-[#496084] max-[800px]:text-[13px]">{user.name}</span>
              <span className="truncate text-[9px] text-[#496084] max-[800px]:col-start-2 max-[800px]:text-[10px]">
                <span className="hidden pr-1 text-slate-500 max-[800px]:inline">Email:</span>{user.email}
              </span>
              <span className="rounded-full bg-[#f0f3ff] px-2.5 py-1 text-center text-[12px] text-blue-700 max-[800px]:col-start-2 max-[800px]:w-fit">
                <span className="hidden pr-1 text-slate-500 max-[800px]:inline">Setor:</span>{user.sector}
              </span>
              <span className="rounded-full bg-[#fff0f2] px-2.5 py-1 text-center text-[12px] text-[#4c102d] max-[800px]:col-start-2 max-[800px]:w-fit">
                <span className="hidden pr-1 text-slate-500 max-[800px]:inline">Nível:</span>{user.accessLevel}
              </span>
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-white max-[800px]:col-start-3 max-[800px]:row-span-3 max-[800px]:row-start-1 ${user.isOperator ? "bg-slate-500" : "bg-[#86164f]"}`}
                aria-label={user.isOperator ? "Edição bloqueada para operador" : undefined}
                title={user.isOperator ? "Operador: edição bloqueada" : undefined}
              >
                {user.isOperator ? <FiLock size={14} aria-hidden="true" /> : <FiEdit2 size={14} aria-hidden="true" />}
              </span>
            </button>
          ))}
        </div>
      </section>

      <nav className="mt-auto" aria-label="Paginação de usuários">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          className="!mb-3 !mt-0 pt-16 max-[560px]:pt-8"
        />
      </nav>

      {selectedUser && (
        <UserEditModal
          key={selectedUser.id}
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onSave={saveUser}
        />
      )}
    </main>
  );
}

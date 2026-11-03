# API-6-Semestre-Frontend

## Desenvolvimento local com Keycloak

O Frontend usa o realm `sqlutions` e o client público `frontend` definidos no
realm local do Backend. A autenticação usa OpenID Connect com Authorization
Code + PKCE; tokens de acesso são mantidos em memória, renovados quando estão
perto de expirar e enviados como `Authorization: Bearer <token>` nas chamadas
à API e no carregamento de PDFs.

1. Inicie o Keycloak e seu banco a partir da pasta `deploy` do repositório
   Backend:

   ```powershell
   cd ..\API-6-Semestre-Backend\deploy
   docker compose up -d keycloak backend
   ```

2. Na pasta deste repositório, crie `.env` a partir de `.env.example` se
   precisar alterar os endereços padrão.
3. Instale as dependências e inicie o Frontend:

   ```powershell
   npm install
   npm run dev
   ```

Por padrão, a API fica em `http://localhost:8000` e o Keycloak em
`http://localhost:8080`. Configure `VITE_API_URL`, `VITE_KEYCLOAK_URL`,
`VITE_KEYCLOAK_REALM` e `VITE_KEYCLOAK_CLIENT_ID` no `.env` quando esses
endereços ou identificadores forem diferentes. O Vite precisa ser reiniciado
após alterar essas variáveis.

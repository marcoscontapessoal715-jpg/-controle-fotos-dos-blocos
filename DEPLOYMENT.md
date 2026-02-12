# Guia de Publicação (Internet)

Para colocar seu app no ar para todo mundo acessar, siga estes passos simples:

## 1. Prepare seu código
Eu já deixei os arquivos prontos:
- `Dockerfile`: Ensina o servidor como rodar seu app.
- `server.js`: Atualizado para autenticação e nuvem.
- `package.json`: Com as novas dependências de login.

## 2. Envie para o GitHub
1. Abra o seu repositório no [GitHub](https://github.com).
2. Suba (Upload) os arquivos que alteramos (principalmente `server.js`, `app.js`, `index.html`, `styles.css` e `package.json`).

## 3. Configurações no Render
Se o seu app já está no Render, você só precisa adicionar as novas variáveis:
1. Acesse o seu painel do [Render](https://dashboard.render.com).
2. Selecione o serviço `controle-fotos-dos-blocos`.
3. Vá em **"Environment"**.
4. Adicione as seguintes variáveis (as mesmas do Supabase):
   - `SUPABASE_URL`: (Sua URL do Supabase)
   - `SUPABASE_KEY`: (Sua Key Anon do Supabase)
5. Clique em **"Save Changes"**.

## 4. Deploy!
O Render deve detectar a mudança no GitHub e fazer o deploy automático. Em alguns minutos, sua URL `https://controle-fotos-dos-blocos.onrender.com/` terá o sistema de login ativo!

---
> [!IMPORTANT]
> A segurança agora é real: sem login, ninguém conseguirá ver ou alterar seus dados no banco de dados.

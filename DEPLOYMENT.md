# Guia de Publicação (Internet)

Para colocar seu app no ar para todo mundo acessar, siga estes passos simples:

## 1. Prepare seu código
Eu já deixei os arquivos prontos:
- `Dockerfile`: Ensina o servidor como rodar seu app.
- `server.js`: Atualizado para funcionar em nuvem.
- `.env.example`: Guia de configurações.

## 2. Envie para o GitHub
1. Crie um repositório no [GitHub](https://github.com).
2. Suba todos os arquivos da pasta do projeto para lá.

## 3. Conecte ao Render (Recomendado)
O **Render** é gratuito para iniciar e muito fácil:
1. Crie uma conta em [render.com](https://render.com).
2. Clique em **"New +"** > **"Web Service"**.
3. Conecte sua conta do GitHub e selecione o repositório do app.
4. **Configurações Importantes**:
   - **Runtime**: Selecione `Docker`.
   - **Disk (Obrigatório para fotos)**: Vá em "Advanced" > "Disks".
     - Adicione um disco com o caminho `/app/uploads`. Isso garante que suas fotos não sumam!
     - Adicione outro disco (opcional mas recomendado) para `/app/blocks.db`.

## 4. Acesse seu link!
O Render vai te dar um link como `seu-app.onrender.com`. Pronto, seu inventário está na internet!

---
> [!IMPORTANT]
> Lembre-se que em planos gratuitos o servidor "dorme" após algum tempo sem uso, e pode demorar alguns segundos para acordar na primeira visita.

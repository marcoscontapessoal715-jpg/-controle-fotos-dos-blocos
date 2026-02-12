# Block Inventory Management Application

Sistema empresarial para gerenciamento de inventário de blocos com documentação fotográfica completa.

## Início Rápido

```bash
# Instalar dependências
npm install

# Iniciar servidor
npm start
```

Acesse: **http://localhost:3000**

## Recursos

- ✅ Cadastro de blocos com código, material e dimensões
- ✅ Upload de 4 fotos por bloco (frente, trás, esquerda, direita)
- ✅ Galeria visual com busca e filtros
- ✅ Edição e exclusão de blocos
- ✅ Armazenamento persistente (SQLite)
- ✅ Interface premium e responsiva
- ✅ Suporte multi-usuário

## Tecnologias

**Backend**: Node.js, Express, SQLite, Multer  
**Frontend**: HTML5, CSS3, JavaScript  
**Design**: Glassmorphism, gradientes, animações suaves

## Estrutura

```
├── server.js          # Servidor Express + API REST
├── database.js        # Operações SQLite
├── public/            # Frontend
│   ├── index.html    # Interface principal
│   ├── styles.css    # Design premium
│   └── app.js        # Lógica da aplicação
├── uploads/          # Armazenamento de fotos
└── blocks.db         # Banco de dados
```

## API Endpoints

- `GET /api/blocks` - Listar todos os blocos
- `GET /api/blocks/:id` - Obter bloco específico
- `GET /api/blocks/search/:query` - Buscar blocos
- `POST /api/blocks` - Criar novo bloco
- `PUT /api/blocks/:id` - Atualizar bloco
- `DELETE /api/blocks/:id` - Excluir bloco

## Acesso em Rede

Para acessar de outros dispositivos:
1. Encontre o IP do computador (ex: 192.168.1.100)
2. Acesse: `http://192.168.1.100:3000`

## Produção e Monitoramento

Este aplicativo foi otimizado para ambientes de produção empresariais, especialmente em infraestruturas que utilizam hibernação (como o plano free do Render).

### Recursos de Estabilidade
- **Health Check Robusto**: O endpoint `/health` verifica a conectividade com o banco de dados Supabase em tempo real.
- **Cold Start Handling**: O frontend detecta automaticamente se o servidor está "acordando" e exibe uma mensagem amigável ao usuário.
- **Retry Automático**: Falhas temporárias (erro 503/504) são resolvidas com até 3 tentativas automáticas com backoff exponencial.

### Recomendação de Monitoramento
Para garantir que seu sistema esteja sempre disponível:
1. Use o **[UptimeRobot](https://uptimerobot.com/)** (plano gratuito disponível).
2. Configure uma verificação HTTP para `https://seu-app.render.com/health`.
3. Defina o intervalo para 5 ou 10 minutos para evitar que o servidor entre em hibernação profunda.

## Desenvolvido com ❤️

Sistema profissional e confiável para empresas que buscam excelência operacional.

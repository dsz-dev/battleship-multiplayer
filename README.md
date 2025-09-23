# 🚢 Batalha Naval 5x5 - Multiplayer

Um jogo de Batalha Naval multiplayer completo e funcional desenvolvido com React + TypeScript (frontend) e PHP (backend). Sistema totalmente testado e aprovado com funcionalidades multiplayer em tempo real.

## 🎮 Como Jogar

### 1. **Registro de Jogador**
- Digite seu nome para entrar no jogo
- Sistema gera automaticamente IDs únicos para cada jogador

### 2. **Posicionamento de Navios**
Posicione estrategicamente seus 3 navios no tabuleiro 5x5:
- **Navio Grande**: 3 células ⛵⛵⛵
- **Navio Médio**: 2 células ⛵⛵  
- **Navio Pequeno**: 1 célula ⛵

**Controles:**
- Selecione o navio desejado
- Escolha orientação (Horizontal/Vertical)
- Clique no tabuleiro para posicionar

### 3. **Modos de Jogo**
- **🆕 Criar Novo Jogo**: Cria um jogo e aguarda outro jogador
- **🔗 Entrar em Jogo**: Digite o ID de um jogo existente para se conectar

### 4. **Batalha Multiplayer**
- **🎯 Sua Vez**: Clique nas células do tabuleiro oponente para atacar
- **⏳ Aguardar**: Espere sua vez quando o oponente estiver jogando
- **🔥 Turnos Consecutivos**: Continue atacando quando acertar um navio
- **🏆 Vitória**: Afunde todos os navios do oponente para ganhar

## 🚀 Configuração e Instalação

### Pré-requisitos
- **Node.js** (versão 16+)
- **XAMPP** (Apache + MySQL + PHP)
- **Navegador web moderno**

### 1. Configuração do Frontend

```bash
# Clonar o repositório
git clone https://github.com/dsz-dev/battleship-multiplayer.git
cd battleship

# Instalar dependências
npm install

# Executar servidor de desenvolvimento
npm run dev
```

O frontend estará disponível em: `http://localhost:5175`

### 2. Configuração do Backend

#### 2.1. Iniciar XAMPP
- Inicie o **Apache** e **MySQL** no painel do XAMPP

#### 2.2. Configurar Banco de Dados
```sql
-- Acesse phpMyAdmin: http://localhost/phpmyadmin
-- Execute o script database.sql para criar todas as tabelas:

CREATE DATABASE IF NOT EXISTS battleship;
USE battleship;

-- Tabelas: users, games, ship_positions, player_attacks, moves, game_turns
```

#### 2.3. Configurar Arquivos PHP
- Coloque `api.php` e `db.php` em: `C:/xampp/htdocs/battleship/`
- Verifique as credenciais do banco em ambos os arquivos

#### 2.4. Testar API
```bash
# Teste básico da API
curl http://localhost/battleship/api.php?action=register
```

### 3. Estrutura do Projeto

```
battleship/
├── 📁 src/
│   ├── 📁 components/ui/      # Componentes de interface (Button, Card, Input)
│   ├── 📄 App.tsx            # Componente principal do jogo
│   ├── 📄 main.tsx           # Ponto de entrada React
│   └── 📄 index.css          # Estilos customizados
├── 📄 api.php                # API REST backend completa
├── 📄 db.php                 # Configuração do banco de dados
├── 📄 database.sql           # Schema completo do banco
├── 📄 package.json           # Dependências e scripts
├── 📄 vite.config.ts         # Configuração do Vite
└── 📄 README.md              # Este arquivo
```

## ✨ Funcionalidades Completas

### 🔐 **Sistema de Autenticação**
- ✅ Registro automático de usuários
- ✅ Geração de IDs únicos
- ✅ Nomes de exibição personalizados
- ✅ Validação de campos obrigatórios

### 🚢 **Posicionamento de Navios**
- ✅ Interface visual intuitiva
- ✅ Orientação horizontal/vertical
- ✅ Validação de posições válidas
- ✅ Salvamento automático no banco de dados
- ✅ Prevenção de sobreposição de navios

### 🎮 **Sistema Multiplayer**
- ✅ Criação de jogos em tempo real
- ✅ Entrada em jogos existentes via ID
- ✅ Sincronização automática entre jogadores
- ✅ Interface dual (seu tabuleiro + oponente)
- ✅ Exibição de nomes dos jogadores

### ⚡ **Sistema de Turnos Avançado**
- ✅ Controle rigoroso de turnos
- ✅ Validação "não é sua vez"
- ✅ **Turnos consecutivos**: Continue jogando quando acertar
- ✅ Alternância automática quando errar
- ✅ Sincronização em tempo real via polling

### 🎯 **Sistema de Ataques**
- ✅ Detecção precisa de acertos/erros
- ✅ Baseado em posições reais dos navios (não aleatório)
- ✅ Marcação visual: 💥 (acerto) e 💦 (erro)
- ✅ Prevenção de ataques duplicados
- ✅ Validação de posições válidas

### 🏆 **Sistema de Vitória**
- ✅ Detecção automática de fim de jogo
- ✅ Condição: todos os navios do oponente afundados
- ✅ Tela de vitória com troféu grande 🏆
- ✅ Opção "Jogar Novamente"
- ✅ Sem alertas indesejados do navegador

### 🔄 **Sincronização em Tempo Real**
- ✅ Polling contínuo durante o jogo
- ✅ Atualizações automáticas de estado
- ✅ Detecção de mudanças de turno
- ✅ Sincronização de ataques entre jogadores

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 19** - Biblioteca de interface moderna
- **TypeScript** - Tipagem estática para maior robustez
- **Vite** - Build tool rápido e dev server
- **CSS Custom** - Estilização responsiva e moderna

### Backend
- **PHP 8+** - API REST completa
- **MySQL 8+** - Banco de dados relacional
- **PDO** - Conexão segura com banco de dados
- **JSON** - Comunicação frontend-backend

### Arquitetura
- **SPA (Single Page Application)** - Interface fluida
- **REST API** - Comunicação padronizada
- **Polling** - Sincronização em tempo real
- **Responsive Design** - Funciona em qualquer dispositivo

## 🧪 Testes Realizados

### ✅ **Testes de Funcionalidade**
- **Registro de Usuários**: 2 jogadores testados (IDs: 15, 17)
- **Posicionamento**: 6 navios posicionados com sucesso
- **Multiplayer**: Jogo ID: 6 criado e sincronizado
- **Turnos**: Validação "não é sua vez" funcionando
- **Ataques**: Acertos e erros detectados corretamente
- **Vitória**: Condição de fim de jogo testada

### ✅ **Testes de Interface**
- **Responsividade**: Funciona em diferentes resoluções
- **Visual**: Navios, ataques e estados exibidos corretamente
- **UX**: Interface intuitiva e fácil de usar
- **Performance**: Carregamento rápido e fluido

### ✅ **Testes de Backend**
- **API Endpoints**: Todos os 6 endpoints funcionando
- **Banco de Dados**: Todas as 6 tabelas criadas e funcionais
- **Validações**: Entrada de dados validada corretamente
- **Segurança**: Prevenção de SQL injection via PDO

## 🐛 Solução de Problemas

### Erro de CORS
```php
// Verifique se estes headers estão no api.php:
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');
```

### Banco de dados não conecta
1. ✅ Verifique se MySQL está rodando no XAMPP
2. ✅ Confirme credenciais em `db.php` e `api.php`
3. ✅ Execute `database.sql` no phpMyAdmin
4. ✅ Teste conexão: `http://localhost/battleship/api.php`

### Frontend não carrega
```bash
# Reinstalar dependências
npm install

# Limpar cache e reiniciar
npm run dev
```

### Problemas de sincronização
- ✅ Verifique se ambos os servidores estão rodando
- ✅ Teste a API diretamente no navegador
- ✅ Verifique console do navegador para erros

## 📈 Próximas Melhorias

- [ ] 💬 Chat em tempo real entre jogadores
- [ ] 📊 Sistema de pontuação e ranking
- [ ] 🤖 Modo single-player contra IA
- [ ] 🎨 Temas visuais personalizáveis
- [ ] 📱 App mobile nativo
- [ ] 🌐 Salas de jogo públicas/privadas
- [ ] 📈 Estatísticas detalhadas de jogos
- [ ] 🔊 Efeitos sonoros e música

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. **Fork** o projeto
2. **Crie** uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. **Abra** um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👨‍💻 Autor e Direitos Autorais

**© 2024 - Todos os direitos reservados**

**Desenvolvido por:** Ana Martins, Diego Souza e Micheal Ortiz

### 🏆 Créditos do Projeto

- **Arquitetura e Design**: Desenvolvido do zero com foco em performance e UX
- **Sistema Multiplayer**: Implementação própria com polling em tempo real
- **Interface Visual**: Design moderno e responsivo criado especificamente para este projeto
- **Lógica de Jogo**: Algoritmos próprios para detecção de acertos e controle de turnos
- **Testes**: Bateria completa de testes funcionais e de integração

### 📞 Suporte

Para suporte, dúvidas ou sugestões:
- 📧 **Email**: suporte@icloud.com
- 💬 **Issues**: Abra uma issue no GitHub

---

### 🌟 **Status do Projeto: COMPLETO E FUNCIONAL** 🌟

**✅ Teste Multiplayer: 100% Aprovado**  
**✅ Todas as funcionalidades implementadas e testadas**  
**✅ Pronto para produção**

---

**Desenvolvido com ❤️ usando React + TypeScript + PHP + MySQL**

*"Um jogo clássico reimaginado para a era moderna do desenvolvimento web"*

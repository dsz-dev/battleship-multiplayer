# 🚀 Guia Completo: Como Subir o Projeto para o GitHub

## 📋 Pré-requisitos

### 1. Instalar Git
```bash
# Verificar se Git está instalado
git --version

# Se não estiver instalado, baixe em: https://git-scm.com/
```

### 2. Configurar Git (primeira vez)
```bash
# Configurar seu nome e email
git config --global user.name "Diego Souza"
git config --global user.email "diegodev.pt@icloud.com"

# Verificar configuração
git config --list
```

## 🔧 Passo-a-Passo para Subir o Projeto

### Passo 1: Inicializar Repositório Local
```bash
# No terminal, navegue até a pasta do projeto
cd c:/xampp/htdocs/battleship

# Inicializar repositório Git
git init

# Verificar status
git status
```

### Passo 2: Criar .gitignore
```bash
# Criar arquivo .gitignore (já existe no projeto)
# Verificar se contém as exclusões necessárias
```

### Passo 3: Adicionar Arquivos ao Repositório
```bash
# Adicionar todos os arquivos
git add .

# Ou adicionar arquivos específicos
git add README.md
git add src/
git add package.json
git add database.sql
git add api.php

# Verificar o que foi adicionado
git status
```

### Passo 4: Fazer o Primeiro Commit
```bash
# Commit inicial
git commit -m "🚢 Inicial: Jogo Batalha Naval Multiplayer completo

✅ Frontend React + TypeScript
✅ Backend PHP + MySQL  
✅ Sistema multiplayer em tempo real
✅ Testes completos aprovados
✅ Documentação completa"
```

### Passo 5: Criar Repositório no GitHub

#### 5.1. Via Site GitHub:
1. **Acesse**: https://github.com/dsz-dev
2. **Clique**: "New repository" (botão verde)
3. **Nome**: `battleship-multiplayer`
4. **Descrição**: `🚢 Jogo Batalha Naval Multiplayer - React + TypeScript + PHP + MySQL`
5. **Público/Privado**: Escolha conforme preferir
6. **NÃO marque**: "Add a README file" (já temos um)
7. **Clique**: "Create repository"

#### 5.2. Via GitHub CLI (alternativo):
```bash
# Instalar GitHub CLI: https://cli.github.com/
gh repo create battleship-multiplayer --public --description "🚢 Jogo Batalha Naval Multiplayer - React + TypeScript + PHP + MySQL"
```

### Passo 6: Conectar Repositório Local ao GitHub
```bash
# Adicionar origem remota (substitua dsz-dev pelo seu usuário)
git remote add origin https://github.com/dsz-dev/battleship-multiplayer.git

# Verificar se foi adicionado
git remote -v
```

### Passo 7: Enviar Código para o GitHub
```bash
# Enviar para o branch main
git branch -M main
git push -u origin main

# Se pedir autenticação, use seu token do GitHub
```

## 🔐 Configurar Autenticação GitHub

### Opção 1: Token de Acesso Pessoal (Recomendado)
1. **GitHub** → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. **Generate new token** → **Classic**
3. **Scopes**: Marque `repo` (acesso completo aos repositórios)
4. **Copie o token** e use como senha quando solicitado

### Opção 2: SSH (Mais Seguro)
```bash
# Gerar chave SSH
ssh-keygen -t ed25519 -C "diegodev.pt@icloud.com"

# Adicionar ao ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Copiar chave pública
cat ~/.ssh/id_ed25519.pub

# Adicionar no GitHub: Settings → SSH and GPG keys → New SSH key
```

## 📁 Estrutura Recomendada do Repositório

```
battleship-multiplayer/
├── 📄 README.md                    # Documentação principal
├── 📄 GUIA_GITHUB.md              # Este guia
├── 📄 TESTE_MULTIPLAYER_RESULTADO.md # Relatório de testes
├── 📄 .gitignore                  # Arquivos ignorados
├── 📄 package.json                # Dependências frontend
├── 📄 vite.config.ts              # Configuração Vite
├── 📄 database.sql                # Schema do banco
├── 📄 api.php                     # API backend
├── 📄 db.php                      # Configuração DB
├── 📁 src/                        # Código fonte React
│   ├── 📄 App.tsx                 # Componente principal
│   ├── 📄 main.tsx                # Entry point
│   ├── 📄 index.css               # Estilos
│   └── 📁 components/ui/          # Componentes UI
└── 📁 public/                     # Arquivos públicos
```

## 🔄 Comandos Git Úteis para o Futuro

### Atualizações Futuras:
```bash
# Verificar status
git status

# Adicionar mudanças
git add .

# Commit com mensagem
git commit -m "✨ Nova funcionalidade: [descrição]"

# Enviar para GitHub
git push origin main
```

### Branches (para features):
```bash
# Criar nova branch
git checkout -b feature/nova-funcionalidade

# Trabalhar na branch...

# Voltar para main
git checkout main

# Merge da branch
git merge feature/nova-funcionalidade
```

### Sincronizar com GitHub:
```bash
# Baixar mudanças do GitHub
git pull origin main

# Ver histórico
git log --oneline
```

## 🌟 Dicas Importantes

### ✅ **Boas Práticas:**
- **Commits frequentes** com mensagens descritivas
- **Usar .gitignore** para excluir arquivos desnecessários
- **README.md atualizado** sempre
- **Branches** para features grandes
- **Tags** para versões importantes

### ❌ **Evitar:**
- Commitar `node_modules/`
- Senhas ou dados sensíveis no código
- Commits muito grandes
- Mensagens de commit vagas

### 📝 **Mensagens de Commit Sugeridas:**
```bash
git commit -m "🚢 Inicial: Projeto Batalha Naval completo"
git commit -m "✨ Adicionar: Nova funcionalidade X"
git commit -m "🐛 Corrigir: Bug no sistema de turnos"
git commit -m "📚 Docs: Atualizar README.md"
git commit -m "🎨 Melhorar: Interface do usuário"
git commit -m "⚡ Performance: Otimizar polling"
```

## 🆘 Solução de Problemas

### Erro: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/dsz-dev/battleship-multiplayer.git
```

### Erro: "failed to push"
```bash
# Forçar push (cuidado!)
git push -f origin main

# Ou sincronizar primeiro
git pull origin main --allow-unrelated-histories
git push origin main
```

### Erro de autenticação:
- Use **token** em vez de senha
- Configure **SSH** para maior segurança

## 🎯 Próximos Passos Após Upload

1. **✅ Verificar** se todos os arquivos subiram
2. **✅ Testar** clone em outra pasta
3. **✅ Configurar** GitHub Pages (se quiser hospedar)
4. **✅ Adicionar** badges no README
5. **✅ Criar** releases para versões

---

**🚀 Seu projeto estará no ar em: https://github.com/dsz-dev/battleship-multiplayer**

**Boa sorte com o upload! 🎉**

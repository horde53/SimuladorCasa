# Casa Programada - Simulador Financeiro (Versão Estática)

Este é um simulador financeiro que compara financiamento bancário com consórcio imobiliário, convertido para uma versão estática que pode ser hospedada em qualquer servidor de hospedagem compartilhada.

## 📋 Características

- **100% Frontend**: Não requer servidor Node.js ou banco de dados
- **Cálculos em JavaScript**: Todas as simulações são feitas no navegador
- **Responsivo**: Funciona em desktop, tablet e mobile
- **Armazenamento Local**: Usa localStorage para manter dados entre páginas
- **Fácil Deploy**: Pode ser hospedado em qualquer servidor web

## 🚀 Como Hospedar

### 1. Hospedagem Compartilhada (Hostgator, GoDaddy, etc.)

1. Faça download de todos os arquivos
2. Compacte em um arquivo ZIP
3. Acesse o cPanel da sua hospedagem
4. Vá para o "Gerenciador de Arquivos"
5. Navegue até a pasta `public_html`
6. Faça upload do arquivo ZIP
7. Extraia os arquivos
8. Acesse seu domínio para testar

### 2. GitHub Pages (Gratuito)

1. Crie um repositório no GitHub
2. Faça upload de todos os arquivos
3. Vá em Settings > Pages
4. Selecione "Deploy from a branch"
5. Escolha "main" branch
6. Seu site estará disponível em `https://seuusuario.github.io/nome-do-repo`

### 3. Netlify (Gratuito)

1. Acesse [netlify.com](https://netlify.com)
2. Arraste a pasta do projeto para a área de deploy
3. Seu site estará online em segundos

### 4. Vercel (Gratuito)

1. Acesse [vercel.com](https://vercel.com)
2. Conecte seu repositório GitHub
3. Deploy automático

## 📁 Estrutura de Arquivos

```
/
├── index.html              # Página principal do simulador
├── resultado.html           # Página de resultados
├── css/
│   ├── styles.css          # Estilos principais
│   └── resultado.css       # Estilos da página de resultados
├── js/
│   ├── config.js           # Configurações globais
│   ├── script.js           # Script principal
│   └── resultado.js        # Script da página de resultados
├── images/
│   ├── logo.png            # Logo da empresa
│   ├── favicon.png         # Ícone do site
│   └── bacen-logo.png      # Logo do Banco Central
└── README.md               # Este arquivo
```

## ⚙️ Configurações

As configurações principais estão no arquivo `js/config.js`:

```javascript
const CONFIG_FINANCIAMENTO = {
    PRAZO_MESES: 420,           // 35 anos
    TAXA_JUROS_ANUAL: 0.1149,  // 11.49% ao ano
    TEXTO_PRAZO: "420 meses (35 anos)"
};

const CONFIG_CONSORCIO = {
    PRAZO_MESES: 240,           // 20 anos
    TAXA_ADMIN: 0.28,           // 28% taxa administrativa
    TEXTO_PRAZO: "240 meses (20 anos)"
};
```

## 🔧 Personalização

### Alterar Cores
Edite as variáveis CSS no arquivo `css/styles.css`:

```css
:root {
    --azul-escuro: #046986;
    --azul-claro: #0a8eab;
    --laranja: #f68b1f;
    /* ... outras cores */
}
```

### Alterar Logo
Substitua o arquivo `images/logo.png` pela sua logo.

### Alterar WhatsApp
No arquivo `js/resultado.js`, altere o número:

```javascript
window.open(`https://wa.me/5519991946424?text=${mensagem}`, '_blank');
```

## 📱 Funcionalidades

- ✅ Formulário de dados do cliente
- ✅ Validação de CPF, email e telefone
- ✅ Busca automática de endereço por CEP
- ✅ Cálculo de financiamento bancário
- ✅ Cálculo de consórcio imobiliário
- ✅ Comparativo de economia
- ✅ Página de resultados detalhada
- ✅ Botão para contato via WhatsApp
- ✅ Design responsivo

## 🌐 Compatibilidade

- ✅ Chrome, Firefox, Safari, Edge
- ✅ Internet Explorer 11+
- ✅ Dispositivos móveis (iOS/Android)
- ✅ Tablets

## 📞 Suporte

Para suporte técnico ou dúvidas sobre personalização, entre em contato através do WhatsApp: (19) 99194-6424

## 📄 Licença

Este projeto é propriedade da Casa Programada. Todos os direitos reservados.
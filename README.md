# CyberTaxas

CyberTaxas é um site estático de apresentação e dashboard financeiro criado com HTML, CSS e JavaScript. O projeto combina uma landing page moderna com páginas de login/registro, dashboards de investimentos, comparativos de IDH e recursos de suporte como contato e doação via PIX.

## Funcionalidades principais

- Página inicial (`index.html`) com navegação para About Us, Buy Me a Coffee e Contato.
- Página `aboutUs.html` com seção institucional e destaques do serviço.
- Dashboard de ações/bolsas (`actions.html`) com seleção de ativos, exibição de preço, variação e gráfico de evolução usando Chart.js.
- Página IDH (`idh.html`) que carrega dados de países de um arquivo JSON e exibe rankings.
- Página `coins.html` para acompanhar ativos/coins (atualmente reutiliza infraestrutura semelhante ao dashboard de ações).
- Formulários de `login.html`, `register.html` e `contato.html` com validação básica em JavaScript.
- Página `buyMeAcoffe.html` com opção de copiar chave PIX e QR Code de doação.

## Estrutura do projeto

- `index.html` - landing page principal.
- `aboutUs.html` - página institucional.
- `buyMeAcoffe.html` - página de doações via PIX.
- `contato.html` - formulário de contato.
- `idh.html` - dashboard de IDH global.
- `actions.html` - dashboard de ações e bolsas.
- `coins.html` - página adicional de ativos.
- `login.html` / `register.html` - telas de autenticação.
- `css/` - estilos de cada página.
- `js/` - scripts de aplicação.
- `imgs/` - imagens e ícones usados pelo site.
- `settings/` - dados estáticos em JSON para ações e países.

## Arquivos principais de dados

- `settings/acoes-valores.json` - dados de ações com histórico de preços para gerar gráficos.
- `settings/paises.json` - dados de países com IDH, PIB e sinalização de bandeira.

## Dependências

- Chart.js via CDN para renderização de gráficos.
- Google Fonts para tipografia.

## Como executar

1. Abra o projeto em um servidor estático. Exemplo usando Python no diretório do projeto:

```powershell
python -m http.server 8000
```

2. Acesse `http://localhost:8000` no navegador.

> Observação: algumas funcionalidades usam `fetch` para carregar arquivos JSON locais. Se você abrir os arquivos diretamente com `file://`, pode haver bloqueios de CORS ou erro de leitura de dados.

## Notas importantes

- O projeto é estático e não possui backend ou banco de dados.
- As telas de login, registro e contato são apenas de demonstração com validação local.
- A página `actions.html` usa dados estáticos para simular um dashboard de investimentos.

## Melhorias sugeridas

- Implementar backend para autenticação real e envio de formulário de contato.
- Criar uma página dedicada e funcional para `coins.html` com dados reais de criptomoedas.
- Adicionar busca e filtros ao dashboard de IDH.
- Melhorar a experiência mobile e a acessibilidade.

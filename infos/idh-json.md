# Documentação da Refatoração de IDH com JSON

## 1. Visão Geral

O objetivo desta alteração foi refatorar `idh.html` para que a lista de países com maior e menor IDH seja gerada dinamicamente a partir do arquivo `settings/paises.json`.

Antes, o HTML continha valores fixos de ranking, bandeiras e valores de IDH. Isso tornava a manutenção difícil e exigia atualizações manuais no HTML sempre que os dados mudassem.

Com a nova abordagem, a página agora carrega automaticamente o conteúdo do JSON usando `fetch` e renderiza as listas de maneira dinâmica. Isso garante que alterações em `settings/paises.json` apareçam imediatamente na interface sem modificar `idh.html`.

## 2. Estrutura do JSON

O `settings/paises.json` contém uma lista de objetos, onde cada objeto representa um país e suas métricas econômicas.

Campos utilizados na implementação:

- `pais`: nome do país.
- `caminho_bandeira`: caminho da imagem da bandeira.
- `pib`: valor do PIB em formato legível.
- `idh`: valor numérico do IDH.

Exemplo de registro real:

```json
{
  "pais": "Austrália",
  "caminho_bandeira": "imgs/australia.png",
  "pib": "1.69T USD",
  "idh": 0.946,
  "pib_per_capita": "64,500 USD",
  "inflacao": "4.1%",
  "moeda": "AUD"
}
```

O código leva em conta apenas os campos necessários para a exibição do ranking e ignora registros inválidos.

## 3. Carregamento dos Dados

O arquivo `js/idh.js` contém a lógica de carregamento.

- `fetch('settings/paises.json')` é utilizado para buscar o arquivo JSON.
- A chamada é feita com `async/await` dentro de `loadIdhData()`.
- `response.ok` é verificado para garantir que o arquivo foi retornado corretamente.
- O retorno é convertido em JavaScript usando `response.json()`.

Tratamento de erros:

- Se o arquivo `settings/paises.json` não for encontrado ou retornar erro HTTP, o `catch` exibe uma mensagem amigável.
- Se o JSON não contiver registros válidos de países, também é exibido um aviso para o usuário.
- Todos os erros são registrados no `console` para facilitar o debug.

## 4. Ordenação dos Países

Após o carregamento e validação, os países são ordenados pelo campo `idh`.

A função `sortByIdhDescending()` faz a ordenação em ordem decrescente:

```js
function sortByIdhDescending(countries) {
  return [...countries].sort((first, second) => second.idh - first.idh);
}
```

A comparação utiliza `second.idh - first.idh` para garantir que os valores maiores apareçam primeiro.

## 5. Geração das Listas

A página agora possui duas listas separadas:

- `#highest-idh-list` — países com maior IDH em ordem decrescente.
- `#lowest-idh-list` — países com menor IDH em ordem crescente.

O fluxo de geração é:

1. Normaliza os registros válidos do JSON.
2. Ordena todos os países por IDH.
3. Renderiza a lista de maior IDH diretamente a partir da ordenação decrescente.
4. Renderiza a lista de menor IDH usando a mesma lista ordenada, mas invertida.

Exemplo prático:

```js
const sortedCountries = sortByIdhDescending(validCountries);
renderCountries(highestListElement, sortedCountries);
renderCountries(lowestListElement, [...sortedCountries].reverse());
```

Cada item de ranking é criado em HTML com a função `createRankingItem()`.

## 6. Estrutura Final do Código

As responsabilidades ficaram divididas em funções claras:

- `createFeedbackMessage(message, type)` — exibe mensagens de status ou erro.
- `parseIdhValue(value)` — converte valores de IDH para número.
- `normalizeCountryRecord(rawRecord)` — valida registros e remove dados inválidos.
- `extractCountriesFromJson(data)` — trata estruturas de JSON alternativas.
- `sortByIdhDescending(countries)` — ordena os países por IDH.
- `createRankingItem(country, rank)` — monta o HTML de cada país.
- `renderCountries(container, countries)` — renderiza os itens no DOM.
- `loadIdhData()` — faz o `fetch` do arquivo JSON.
- `initializeIdhPage()` — controla o fluxo completo de carregamento e renderização.

Fluxo completo de execução:

1. Inicia a página com `initializeIdhPage()`.
2. Busca os dados em `settings/paises.json`.
3. Valida e normaliza o conteúdo.
4. Ordena por IDH.
5. Renderiza as duas seções da interface.
6. Exibe mensagens de erro caso falhe.

## 7. Manutenção Futura

Para adicionar novos países:

- Basta inserir um novo objeto na lista de `settings/paises.json`.
- Não é necessário alterar `idh.html` ou `js/idh.js`.

Para alterar informações existentes:

- Atualize o registro correspondente no JSON.
- A próxima vez que a página for carregada, as mudanças serão refletidas automaticamente.

Como o sistema reage automaticamente:

- A página carrega o JSON sempre que aberta.
- A ordenação e a renderização são feitas em tempo de execução.
- Qualquer modificação no arquivo `settings/paises.json` é refletida sem mudanças no HTML.

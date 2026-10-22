# Minimali Criativa

Loja demonstrativa em **HTML5, CSS3 e JavaScript puro**, sem frameworks, instalação de dependências ou etapa de build.

## Visualizar

Abra `index.html` no navegador ou sirva esta pasta pelo Apache do XAMPP. Também é possível usar `node preview.cjs` e acessar `http://localhost:4173`.

## Publicar na Hostinger

Envie `index.html`, `assets/`, `css/` e `js/` para a pasta `public_html` do domínio usando o Gerenciador de Arquivos ou FTP. Preserve a estrutura de pastas. Não é necessário enviar `REFERENCIA`, este README ou o servidor de prévia. Os caminhos são relativos e permitem hospedar em uma subpasta.

## O que já funciona

- Layout responsivo, navegação por categorias e menu móvel.
- Busca sem distinção de acentos, filtro de novidades e ordenação por nome e preço.
- Detalhes dos produtos, notas de personalização e seleção de quantidade.
- Favoritos e sacola persistidos no `localStorage`, incluindo remoção e atualização de quantidades.
- Revisão da seleção e tratamento de catálogo e sacola vazios.
- Modais com navegação por teclado, fechamento com Escape e foco controlado pelo elemento `dialog` nativo.

## Revisão de UI/UX

A interface recebeu uma revisão completa de hierarquia, contraste, legibilidade, espaçamento e uso no celular. Textos essenciais usam tamanhos mais confortáveis; botões e controles têm áreas de toque maiores; o catálogo exibe contagem de resultados, categorias, ordenação e mensagens específicas para buscas e favoritos vazios. O fluxo entre produto, sacola e revisão preserva o contexto e devolve o foco ao controle de origem para facilitar a navegação por teclado.

## Conteúdo provisório

O catálogo de `js/catalog.js` contém exemplos e valores demonstrativos baseados na referência. Todas as áreas de fotografia usam blocos de cor pastel com o texto `PLACEHOLDER`, incluindo banners, produtos, detalhes e sacola. A cor de cada produto é configurada em `placeholderColor` no catálogo; as cores dos banners ficam no HTML. Alguns exemplos adicionais de canecas e papelaria têm valores apenas ilustrativos. A marca foi representada em texto e formas SVG.

Não existe checkout real, cobrança, cadastro, autenticação ou envio de pedido. Nenhum telefone, prazo de entrega ou política comercial foi inventado. A revisão da sacola informa explicitamente que os pedidos ainda não estão disponíveis.

## Integração futura com Supabase

Nenhuma conexão com banco foi feita e não há chaves ou dependências do Supabase nesta etapa. `js/catalog.js` centraliza os dados; `js/app.js` concentra busca, filtros, favoritos e sacola; `css/styles.css` contém a identidade visual e a responsividade.

Na próxima etapa, os produtos podem vir do PostgreSQL, as imagens do Storage e as contas do Auth. A precificação final, estoque, envio e criação de pedidos precisarão de validação no backend; valores do navegador não devem autorizar cobranças. Planejar as políticas RLS antes de habilitar acesso aos dados e nunca incluir a chave `service_role` no frontend.

Antes do lançamento comercial, confirmar catálogo, fotos, preços, dados de contato, modalidades de personalização, frete, prazos, políticas e fluxo de pagamento.

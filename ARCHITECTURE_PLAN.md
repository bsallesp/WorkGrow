# Arquitetura de Nuvem e Escolha de Banco de Dados

## 1. Recomendação de Banco de Dados: Azure Cosmos DB (Modo Serverless)

Para armazenar o conteúdo gerado (perguntas, quizzes) e manter a compatibilidade com o formato JSON da nossa documentação, a melhor escolha equilibrando **custo** e **modernidade** é o **Azure Cosmos DB for NoSQL** utilizando a camada **Serverless**.

### Por que Serverless?
*   **Custo Zero quando Ocioso:** Ao contrário dos bancos provisionados tradicionais onde você paga por hora (mesmo se ninguém usar), no modo Serverless você paga apenas por **Request Unit (RU)** consumida. Se ninguém acessar o app, você paga apenas centavos pelo armazenamento (espaço em disco).
*   **Nativo JSON:** Como toda a nossa documentação está em JSON, o Cosmos DB armazena esses documentos nativamente sem necessidade de ORMs complexos ou conversão de esquema (Schema-less).
*   **Escalabilidade:** Se o app crescer, ele escala automaticamente.

### Alternativa "Ultra-Low Cost" (Apenas se o orçamento for extremamente restrito)
*   **Azure Table Storage:** É mais barato que o Cosmos DB, mas é um armazenamento de chave-valor simples.
    *   *Contra:* Não permite consultas complexas (ex: "me dê todas as perguntas de nível difícil sobre useEffect"). Você teria que fazer essa filtragem no código, o que aumenta a complexidade.
    *   *Recomendação:* Fique com o Cosmos DB Serverless pela facilidade de desenvolvimento, a menos que o volume de dados seja gigantesco e o orçamento quase zero.

---

## 2. Arquitetura Proposta: Azure Serverless

Para garantir a "forma barata" que você solicitou, a arquitetura deve ser totalmente orientada a eventos (Serverless). Isso elimina custos fixos de servidores rodando 24/7.

### Componentes:

1.  **Frontend (Hospedagem):**
    *   **Serviço:** Azure Static Web Apps.
    *   **Custo:** Possui um **Plano Gratuito** generoso que inclui hospedagem global, certificado SSL e CI/CD integrado com GitHub.

2.  **Backend (API & Lógica):**
    *   **Serviço:** Azure Functions.
    *   **Plano:** Consumption Plan (Plano de Consumo).
    *   **Custo:** Os primeiros 1 milhão de execuções por mês são **gratuitos**. Você paga apenas quando a função roda para gerar uma pergunta ou salvar um resultado.

3.  **Banco de Dados:**
    *   **Serviço:** Azure Cosmos DB for NoSQL (Serverless).
    *   **Custo:** Pay-per-operation. Estimativa para dev/teste é muito baixa (< $5/mês para uso moderado).

4.  **Armazenamento de Arquivos (Imagens/Assets):**
    *   **Serviço:** Azure Blob Storage.
    *   **Custo:** Centavos por GB.

### Fluxo de Dados:

```mermaid
graph TD
    User[Usuário] -->|Acessa App| StaticWeb[Azure Static Web App (React)]
    StaticWeb -->|Requisita Quiz| FuncApp[Azure Functions (Node.js/Python)]
    
    subgraph "Camada de Dados"
        FuncApp -->|Lê Documentação| Blob[Azure Blob Storage (JSONs Originais)]
        FuncApp -->|Lê/Escreve Perguntas| Cosmos[Azure Cosmos DB (Serverless)]
    end
    
    FuncApp -->|Gera Pergunta| AI[Azure OpenAI / OpenAI API]
```

## Resumo da Decisão

*   **Banco:** Azure Cosmos DB for NoSQL (Serverless).
*   **Arquitetura:** Serverless (Static Web Apps + Azure Functions).
*   **Vantagem Principal:** Custo fixo virtualmente zero. O custo escala linearmente com o uso real.

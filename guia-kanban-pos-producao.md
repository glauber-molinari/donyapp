# Guia: como montar um Kanban de pós-produção (genérico)

Este texto descrece **padrões e decisões comuns** para implementar um quadro estilo Kanban para pós-produção (edição, revisão, entrega). Não traz regras de negócio de um sistema específico — você adapta colunas, papéis e campos ao seu produto.

---

## 1. O que costuma existir nesse tipo de quadro

- **Colunas fixas** que representam o fluxo (ex.: fila de edição → em edição → aprovação → entregue). O número e os nomes são decisão sua.
- **Cards** com identificação do trabalho (cliente, job, pedido), prazos relevantes e quem está responsável.
- **Arrastar e soltar** para mudar de coluna e, às vezes, reordenar dentro da coluna.
- **Visão filtrada** (por pessoa, por tipo de entrega, por busca) sem quebrar a consistência dos dados.

---

## 2. Abordagem técnica para arrastar e soltar

Seguir este caminho:

| Abordagem | Prós | Contras |
|-----------|------|---------|
| **HTML5 nativo** (`draggable`, eventos de drag) | Zero dependência, leve | Comportamento varia entre browsers; gestos mobile costumam precisar de capa extra |
---

## 3. Modelo de dados (ideia geral)

Normalmente cada **card** tem:

- `id`
- `column_id` ou enum/string da coluna atual
- `position` (inteiro, ordem **dentro** da coluna)
- Campos de negócio que você precisar (título, descrição, datas, flags, FK para pedido/usuário, etc.)

Índice útil no banco: `(column_id, position)` ou equivalente, para listar e atualizar rápido.

**Ordem ao mover entre colunas:** após o drop, o cliente envia para o servidor a nova coluna do card **e** a ordem desejada dos IDs nas colunas afetadas (origem e destino). O servidor valida e grava `position` sequencial (0, 1, 2…).

---

## 4. API: padrão de “movimento”

Um `PATCH` ou `POST` dedicado costuma receber algo como:

- id do card movido
- coluna de origem e de destino
- listas ordenadas de ids (`sourceOrder`, `destOrder`) **após** o estado que o usuário vê

No backend:

1. Atualiza a coluna (e campos derivados, se houver — ex.: data de conclusão ao entrar na última coluna).
2. Reaplica `position` para os cards listados em cada coluna tocada.

Se **usuários diferentes** enxergam subconjuntos de cards (ex.: cada editor só os seus), a validação precisa garantir que ninguém altere ordem ou coluna de cards que não pode tocar — isso é regra **sua**, não genérica.

---

## 5. Interface: boas práticas

- **Atualização otimista:** mover no estado local e, se a API falhar, **reverter** para o estado anterior.
- **Bloquear drag** quando houver **filtro ou busca ativa** que não mostre todos os cards da coluna — senão a ordem enviada não bate com o banco.
- **Modo somente leitura** para perfis que só acompanham (sem `draggable`, sem ações destrutivas).
- **Painel lateral ou modal** para editar detalhes sem poluir o card na coluna.

---

## 6. Prazos e indicadores visuais

Um padrão útil (você define limites):

- Comparar **data limite** com “hoje” (definir se usa fim do dia, timezone, etc.).
- Estados típicos: *ok*, *próximo do limite*, *atrasado*, *sem data*.
- Se a última coluna significa “entregue”, pode fazer sentido guardar **data efetiva de entrega** e um flag *no prazo / fora do prazo*, calculado conforme sua política.

Tudo isso são **decisões de produto**, não algo fixo.

---

## 7. Segurança e multiusuário

- Autenticação em todas as rotas que alteram cards.
- Autorização alinhada ao que cada papel pode ver e mover (definido por você).
- Se usar banco com RLS (ex.: Postgres), políticas por papel ou por `assigned_to` são comuns — o desenho depende do seu domínio.

---

## 8. O que definir antes de codar

1. Nomes e quantidade das **colunas** e se são fixas ou configuráveis depois.  
2. **Campos mínimos** do card e se há vínculo com pedido/projeto.  
3. Quem pode **criar**, **editar**, **mover** e **excluir**.  
4. Se a **ordem dentro da coluna** importa para todo mundo ou só para um subconjunto (ex.: por responsável).  
5. **Timezone** e regra de “dia” para prazos.  
6. Se precisa de **histórico/auditoria** (quem moveu, quando).

---

## 9. Resumo

Um Kanban de pós-produção “parecido” em espírito combina: **colunas de fluxo**, **cards com posição**, **DnD com persistência consistente**, **filtros conscientes**, e **regras de permissão** claras. O restante — nomes, SLAs, notificações e integrações — é específico do **seu** sistema; use este guia como lista de decisões e padrões técnicos, não como regra de outro produto.

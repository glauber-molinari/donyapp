# Checklist de Testes - Melhorias Mobile Responsivas

## ✅ Implementações Concluídas

### 1. ✅ Skill Instalada
- Localização: `.cursor/skills/responsive-design/`
- Conteúdo: SKILL.md + references/ (container-queries, breakpoint-strategies, fluid-layouts)

### 2. ✅ Container Queries Plugin
- Plugin instalado: `@tailwindcss/container-queries`
- Configurado em: `tailwind.config.ts`
- Classes disponíveis: `@container`, `@md:`, `@lg:`, etc.

### 3. ✅ Tipografia Fluida
- Arquivo: `app/globals.css`
- Variáveis CSS implementadas:
  - `--font-size-h1` a `--font-size-small` (usando clamp())
  - `--space-xs` a `--space-2xl` (espaçamento fluido)
- Escala de 320px (mobile) a 1200px (desktop)

### 4. ✅ Touch Targets (44×44px WCAG 2.1)
Arquivos modificados:
- `app/(app)/board/board-view.tsx` - botão de arrastar: `min-h-[44px] min-w-[44px]`
- `components/app/job-detail-modal.tsx` - tabs: `min-h-[44px]`
- `components/layout/app-shell.tsx` - links do menu: `min-h-[44px]`

### 5. ✅ Kanban Otimizado
- Scroll horizontal com snap points: `scroll-smooth snap-x snap-mandatory`
- Container queries nas colunas: `@container`
- Cards responsivos: padding ajusta com `p-2 @md:p-3`
- Snap para cada coluna mobile: `snap-start`

### 6. ✅ Navegação Mobile
- Header mobile reduzido: `min-h-[48px]` (antes 56px)
- Botão menu hamburger: `min-h-[44px] min-w-[44px]`
- Header desktop também otimizado

### 7. ✅ Modais Responsivos
- Altura dinâmica: `max-h-[90dvh]` (Dynamic Viewport Height)
- Container com `maxHeight: '100dvh'`
- Conteúdo com scroll: `overflow-y-auto`
- Botão fechar: `min-h-[44px] min-w-[44px]`

### 8. ✅ Tokens Adicionais (tailwind.config.ts)
```typescript
spacing: {
  'touch-target': '2.75rem', // 44px
  'mobile-padding': 'max(1rem, env(safe-area-inset-left, 0px))',
}
screens: {
  'tablet-landscape': { raw: '(min-width: 768px) and (orientation: landscape)' },
}
```

---

## 🧪 Testes a Realizar no Chrome DevTools

### A. Viewports Mobile
Testar nos seguintes tamanhos:

1. **iPhone SE (375×667)**
   - [ ] Kanban: scroll horizontal suave com snap
   - [ ] Cards: conteúdo legível, não cortado
   - [ ] Botões: fáceis de tocar (44×44px)
   - [ ] Modal: ocupa ≤90% da tela, fecha fácil
   - [ ] Tipografia: tamanhos mínimos aplicados

2. **iPhone 12/13/14 (390×844)**
   - [ ] Menu mobile: abre/fecha suavemente
   - [ ] Header: altura adequada (48px)
   - [ ] Touch targets: todos ≥44px
   - [ ] Safe areas: respeitadas (notch)

3. **iPhone 14 Pro Max (430×932)**
   - [ ] Kanban: 2-3 colunas visíveis
   - [ ] Scroll horizontal: funciona bem
   - [ ] Tipografia: escala adequada

### B. Viewports Tablet

1. **iPad Mini (768×1024)**
   - [ ] Sidebar: comportamento correto
   - [ ] Kanban: mais colunas visíveis
   - [ ] Container queries: cards expandem
   - [ ] Tipografia: tamanhos intermediários

2. **iPad Air (820×1180)**
   - [ ] Layout: aproveitamento do espaço
   - [ ] Touch targets: mantidos em 44px
   - [ ] Modais: tamanho proporcional

3. **iPad Pro 11" (834×1194)**
   - [ ] Breakpoint `tablet-landscape` ativo
   - [ ] Container queries funcionando
   - [ ] Grid responsivo adaptado

### C. Orientação Landscape
Testar rotação em tablets:
- [ ] iPad em landscape (1024×768)
- [ ] Sidebar: comportamento adequado
- [ ] Kanban: mais colunas visíveis
- [ ] Header: mantém altura mínima

### D. Cenários Críticos

#### Kanban Board
- [ ] **Arrastar cards**: handle 44×44px fácil de tocar
- [ ] **Scroll horizontal**: funciona suavemente (sem snap automático)
- [ ] **Colunas visíveis**: todas as colunas aparecem corretamente
- [ ] **Cards adaptam**: padding muda com container
- [ ] **Busca ativa**: desabilita drag corretamente
- [ ] **Colunas vazias**: altura mínima mantida

> **Nota**: Snap scroll foi removido por causar problemas de renderização em mobile simulators. Scroll é suave mas manual.

#### Navegação
- [ ] **Menu mobile**: overlay funciona
- [ ] **Links**: todos clicáveis (44×44px)
- [ ] **Sidebar colapsada**: ícones centralizados
- [ ] **Transições**: suaves e rápidas

#### Modais
- [ ] **Abertura**: não corta na altura (dvh)
- [ ] **Scroll interno**: funciona quando longo
- [ ] **Fechar**: botão X fácil de tocar
- [ ] **Tabs**: todas tocáveis (44×44px)
- [ ] **Mobile browser bars**: não quebra layout

#### Formulários
- [ ] **Inputs**: tamanho adequado
- [ ] **Buttons**: ≥44×44px
- [ ] **Selects**: fáceis de abrir
- [ ] **Keyboard**: não cobre campos importantes

### E. Performance

1. **Touch Simulation**
   - [ ] Ativar no DevTools
   - [ ] Testar todos os botões
   - [ ] Verificar áreas de toque

2. **Network Throttling**
   - [ ] Fast 3G
   - [ ] Slow 3G
   - [ ] Container queries não afetam performance

3. **Scroll Performance**
   - [ ] Scroll suave no Kanban
   - [ ] Snap points não causam lag
   - [ ] Touch-pan-x funciona bem

---

## 📊 Validação de Conformidade

### WCAG 2.1 Level AA
- [x] Touch targets ≥44×44px
- [x] Tipografia escalável (clamp)
- [x] Contraste mantido
- [ ] Testar com screen reader (opcional)

### Mobile Best Practices
- [x] Mobile-first approach
- [x] Progressive enhancement
- [x] Safe area insets consideradas
- [x] Dynamic viewport height (dvh)

### Container Queries
- [x] Plugin instalado
- [x] `@container` nas colunas Kanban
- [x] Cards adaptam ao container
- [x] Fallback para browsers antigos (media queries ainda presentes)

### Fluid Typography
- [x] Sistema clamp() implementado
- [x] Escala 320px-1200px
- [x] Variáveis CSS documentadas
- [ ] Testar em viewport <320px (edge case)

---

## 🐛 Possíveis Problemas a Observar

1. **Horizontal Overflow**
   - Verificar se nenhum elemento quebra para fora
   - Testar em 375px (iPhone SE)

2. **Viewport Height Mobile**
   - Barras de navegação cobrindo conteúdo
   - Modais cortados
   - `dvh` deve resolver, validar

3. **Touch Targets Pequenos**
   - Botões menores que 44×44px
   - Espaçamento entre elementos tocáveis

4. **Container Query Fallback**
   - Browsers sem suporte (Safari <16)
   - Media queries devem funcionar como fallback

5. **Scroll Horizontal Kanban**
   - ~~Scroll muito rápido/lento~~ → Corrigido: scroll suave
   - ~~Snap points não alinhando~~ → Removido snap por causar bugs
   - ~~Touch-pan não funcionando~~ → Corrigido com touch-pan-x
   - **Colunas não aparecem** → **CORRIGIDO** (ver KANBAN_MOBILE_FIX.md)

---

## 🎯 Critérios de Sucesso

### ✅ Mínimo Aceitável
- Todos os touch targets ≥44×44px
- Modais usam dvh e não cortam
- Kanban com scroll horizontal suave (sem snap forçado)
- Colunas e cards visíveis em todos os viewports
- Tipografia legível em todos os viewports

### 🚀 Ideal
- Container queries funcionando
- Snap points precisos no Kanban
- Transições suaves
- Performance mantida (<100ms interações)
- Zero overflow horizontal

---

## 📝 Como Testar

### Chrome DevTools
1. Abrir DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Selecionar device ou custom dimensions
4. Ativar "Touch" simulation
5. Testar cada viewport da lista acima

### Comandos Úteis
```bash
# Dev server (se não estiver rodando)
npm run dev

# Build production (testar performance)
npm run build
npm start
```

### URLs para Testar
- `/dashboard` - métricas e cards
- `/board` - Kanban principal
- `/contacts` - tabelas e listas
- `/tasks` - lista de tarefas
- `/notes` - formulários
- `/agenda` - calendário

---

## 📚 Referências da Skill

Consultar `.cursor/skills/responsive-design/` para:
- **SKILL.md** - patterns completos
- **references/container-queries.md** - deep dive container queries
- **references/breakpoint-strategies.md** - estratégias de breakpoints
- **references/fluid-layouts.md** - tipografia e layouts fluidos

---

**Data de implementação**: 22/04/2026  
**Status**: ✅ Implementação completa - Pronto para testes

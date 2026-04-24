# Payments & Billing Journey — Frame Specs

> **Journey:** Financial transactions, payouts, and invoice management  
> **Priority:** P2  
> **Route Prefix:** `/financeiro`  
> **Total Frames:** 3  
> **Date:** 2026-04-19

---

## Frame PB-01: Transaction List (`/financeiro/transacoes`)

### Overview
Comprehensive transaction history for professionals. Filterable, sortable table with financial data. Designed for accountants and professionals tracking their earnings.

### Dimensions
| Viewport | Width | Height | Margins |
|----------|-------|--------|---------|
| Desktop | 1440px | 900px | Sidebar 240px |
| Mobile | 375px | 812px | No sidebar; card list |

### Layout Structure
```
Page (surface-page, 100vh, flex row)
├── Sidebar (240px, professional workspace)
│   └── Nav: "Financeiro" active, "Transações" sub-item active
├── Main (flex-1, flex column)
│   ├── Header (64px)
│   │   ├── H1: "Transações"
│   │   └── Date Range Picker (right)
│   └── Content (p-8)
│       ├── Summary Bar (flex, gap-6, mb-8)
│       │   ├── Metric: "Entradas" (value, positive)
│       │   ├── Metric: "Saídas" (value, negative)
│       │   └── Metric: "Saldo do Período" (value)
│       ├── Filter Chips Row (flex wrap, gap-3, mb-6)
│       │   ├── Chip: "Todas" (active)
│       │   ├── Chip: "Consultas"
│       │   ├── Chip: "Reembolsos"
│       │   ├── Chip: "Taxas"
│       │   └── Chip: "Saques"
│       └── Table Card (p-0, overflow-hidden)
│           ├── Table Header
│           │   ├── Col: Data (sortable)
│           │   ├── Col: Descrição
│           │   ├── Col: Cliente
│           │   ├── Col: Tipo
│           │   ├── Col: Status
│           │   └── Col: Valor (sortable)
│           ├── Table Body
│           │   └── Row
│           │       ├── Cell: Date (text-sm, neutral-500)
│           │       ├── Cell: Description + Booking link
│           │       ├── Cell: Client avatar + name
│           │       ├── Cell: Type badge
│           │       ├── Cell: Status badge
│           │       └── Cell: Amount (positive=primary-600, negative=error)
│           └── Table Footer (flex between, p-4)
│               ├── Results count
│               ├── Pagination
│               └── Export Button (secondary, sm, "Exportar CSV")
```

### Components Used
| Component | Variant | Count | Notes |
|-----------|---------|-------|-------|
| Sidebar | professional | 1 | Financeiro section expanded |
| Header | default | 1 | With date picker |
| FilterChip | active/default | 5+ | Transaction type filters |
| Card | default | 1 | Table container, `p-0` |
| Table | data | 1 | Financial data table |
| Avatar | xs | N | Client avatars in table |
| Badge | type variants | N | Consulta, Reembolso, Taxa, Saque |
| Badge | status variants | N | Concluída, Pendente, Cancelada |
| Button | secondary, sm | 1 | Export CSV |
| Pagination | default | 1 | Bottom right |
| Text | H1, body, caption | — | Hierarchy |

### Token Values
| Element | Token | Value |
|---------|-------|-------|
| Summary bar gap | `space-6` | `24px` |
| Metric value font | `text-2xl` / `font-display` / `font-bold` | `31px` |
| Metric value color | `text-primary` | `#1c1917` |
| Metric positive | `primary-600` | `#16a34a` |
| Metric negative | `error` | `#ef4444` |
| Metric label font | `text-sm` / `text-muted` | `13px` `#78716c` |
| Filter chip gap | `space-3` | `12px` |
| Filter chip active | `primary-50` / `primary-200` / `primary-700` | `#f0fdf4` / `#bbf7d0` / `#15803d` |
| Table amount positive | `primary-600` | `#16a34a` |
| Table amount negative | `error` | `#ef4444` |
| Table row height | — | `56px` |
| Status completed | `success-bg` / `primary-700` | `#f0fdf4` / `#15803d` |
| Status pending | `warning-bg` / `warning` | `#fef3c7` / `#e8950f` |
| Status cancelled | `error-bg` / `error` | `#fef2f2` / `#ef4444` |
| Export button gap | `space-4` | `16px` from pagination |
| Footer padding | `p-4` | `16px` |

### States
| State | Trigger | Visual |
|-------|---------|--------|
| Default | Page load | Last 30 days, "Todas" filter active |
| Loading | Data fetch | Skeleton rows, summary shows "—" |
| Empty | No transactions | EmptyState with "Nenhuma transação no período" |
| Filter active | Chip clicked | Chip gets active styling, table filters, URL updates |
| Sort | Column clicked | Arrow rotates, rows reorder |
| Pagination | Page changed | Table body updates, scroll to top |
| Export | Export clicked | Button shows spinner, CSV downloads |
| Row hover | Mouse over row | Background `neutral-50`, cursor pointer |
| Mobile | < 1024px | Table becomes card list; each card shows all fields vertically |

### Accessibility Notes
- **Summary metrics**: `role="region"`, each metric `aria-label="[Label]: [Valor]"`
- **Filter chips**: `role="listbox"` or native toggle buttons, `aria-pressed` for active state
- **Amount values**: Screen readers announce "Entrada de 150 reais" or "Saída de 20 reais" (not just colors)
- **Status badges**: `aria-label="Status: [estado]"`
- **Table**: `role="table"`, sortable columns have `aria-sort`, financial values right-aligned
- **Date picker**: Native `<input type="date">` or accessible custom with `aria-label="Período"`
- **Export button**: `aria-label="Exportar transações como CSV"`
- **Pagination**: `aria-label="Paginação de transações"`

---

## Frame PB-02: Payout Dashboard (`/financeiro/saques`)

### Overview
Professional payout management — balance overview, withdrawal history, and bank account management. Critical for professional trust and cash flow visibility.

### Dimensions
| Viewport | Width | Height | Margins |
|----------|-------|--------|---------|
| Desktop | 1440px | 900px | Sidebar 240px |
| Mobile | 375px | 812px | No sidebar |

### Layout Structure
```
Page (surface-page, 100vh, flex row)
├── Sidebar (240px, professional workspace)
│   └── Nav: "Financeiro" active, "Saques" sub-item active
├── Main (flex-1, flex column)
│   ├── Header (64px)
│   │   └── H1: "Saques"
│   └── Content (p-8, gap-8)
│       ├── Balance Row (2-col desktop, 1-col mobile, gap-6)
│       │   ├── Balance Card (p-6, large)
│       │   │   ├── Label: "Saldo Disponível"
│       │   │   ├── Value: "R$ [amount]" (text-4xl, display)
│       │   │   ├── Sub: "Última atualização: [time]"
│       │   │   └── Button: "Solicitar Saque" (primary, lg)
│       │   └── Bank Info Card (p-6)
│       │       ├── Header
│       │       │   ├── H3: "Conta Bancária"
│       │       │   └── Button: "Editar" (ghost, sm)
│       │       ├── Bank Icon + Name
│       │       ├── Account: "****1234"
│       │       └── Badge: "Conta verificada" (success)
│       ├── Payout History Section (mt-8)
│       │   ├── Section Header (flex between)
│       │   │   ├── H3: "Histórico de Saques"
│       │   │   └── Link: "Ver todas"
│       │   └── History List (card, p-0)
│       │       ├── List Item (p-4, border-bottom)
│       │       │   ├── Left: Date + "Saque para conta ****1234"
│       │       │   ├── Center: Status badge
│       │       │   └── Right: Amount (bold)
│       │       └── ... (max 5 items)
│       └── Info Banner (mt-8, p-4)
│           ├── Icon: Info (20px)
│           └── Text: "Saques são processados em até 2 dias úteis."
```

### Components Used
| Component | Variant | Count | Notes |
|-----------|---------|-------|-------|
| Sidebar | professional | 1 | Financeiro expanded |
| Header | default | 1 | Page title only |
| Card | default | 3 | Balance, bank info, history |
| Button | primary, lg | 1 | Solicitar Saque |
| Button | ghost, sm | 1 | Editar bank |
| Badge | success | 1 | Account verified |
| Badge | status variants | N | Payout statuses |
| Icon | Landmark (bank), Info | 2 | Bank and info icons |
| Text | H1, H3, body, caption | — | Hierarchy |

### Token Values
| Element | Token | Value |
|---------|-------|-------|
| Balance value font | `text-4xl` / `font-display` / `font-bold` | `49px` Space Grotesk |
| Balance value color | `text-primary` | `#1c1917` |
| Balance label font | `text-sm` / `text-muted` | `13px` `#78716c` |
| Balance card bg | `surface-card` | `#ffffff` |
| Balance card border | `border-default` | `1px solid #e7e5e4` |
| Balance card padding | `space-6` | `24px` |
| Bank card padding | `space-6` | `24px` |
| History item padding | `p-4` | `16px` |
| History item border | `border-default` | `1px solid #e7e5e4` |
| History amount font | `text-base` / `font-semibold` | `16px` |
| Info banner bg | `info-bg` | `#eff6ff` |
| Info banner border | `info` | `1px solid #3b82f6` |
| Info banner radius | `radius-md` | `8px` |
| Section gap | `space-8` | `32px` |
| Card gap | `space-6` | `24px` |
| Balance row gap | `space-6` | `24px` |

### States
| State | Trigger | Visual |
|-------|---------|--------|
| Default | Page load | Current balance displayed, last 5 payouts |
| Loading | Data fetch | Skeleton for balance, spinner in history |
| Empty history | No payouts yet | EmptyState "Nenhum saque realizado" |
| Saque click | Withdraw clicked | Modal opens with amount input and confirmation |
| Saque loading | Withdraw submitted | Modal spinner, balance temporarily reduced |
| Saque success | Withdraw confirmed | Success toast, history updates, modal closes |
| Saque error | Withdraw fails | Error in modal, balance restored |
| Bank edit | Edit clicked | Navigation to bank edit form or modal |
| Unverified bank | No bank linked | Bank card shows "Adicionar conta" button instead |
| Pending payout | Payout processing | History item shows "Processando" with spinner badge |

### Accessibility Notes
- **Balance display**: `aria-label="Saldo disponível: [amount] reais"`, `role="status"`
- **Solicitar Saque button**: `aria-describedby` linked to processing time info
- **Bank info**: `aria-label="Conta bancária cadastrada: [Banco] final [digitos]"`
- **History list**: `role="list"`, each item `role="listitem"`
- **Status badges**: `aria-label="Status do saque: [estado]"`
- **Amount announcement**: Screen readers read "Saque de 500 reais" with status
- **Info banner**: `role="note"`
- **Modal (withdraw)**: `role="dialog"`, `aria-modal="true"`, focus trap active
- **Focus order**: Sidebar → Header → Balance card → Saque button → Bank card → Edit → History → Info banner

---

## Frame PB-03: Invoice Detail (`/financeiro/fatura`)

### Overview
Detailed view of a single invoice/transaction. Itemized breakdown with download capability. Used for accounting reconciliation and customer support.

### Dimensions
| Viewport | Width | Height | Margins |
|----------|-------|--------|---------|
| Desktop | 1440px | 900px | Sidebar 240px |
| Mobile | 375px | 812px | No sidebar |

### Layout Structure
```
Page (surface-page, 100vh, flex row)
├── Sidebar (240px, professional workspace)
│   └── Nav: "Financeiro" active
├── Main (flex-1, flex column)
│   ├── Header (64px)
│   │   ├── Back Button + "Voltar"
│   │   └── H1: "Fatura #[ID]"
│   └── Content (p-8, max-width 800px)
│       ├── Invoice Header Card (p-6)
│       │   ├── Flex Row (between)
│       │   │   ├── Left
│       │   │   │   ├── Badge: Status (success)
│       │   │   │   ├── H2: "Fatura #[ID]"
│       │   │   │   └── Text: "Emitida em [date]"
│       │   │   └── Right
│       │   │       └── Button: "Download PDF" (secondary, sm)
│       │   └── Divider (mt-4)
│       ├── Parties Grid (2-col, mt-6)
│       │   ├── From (Muuday)
│       │   │   ├── Label: "De"
│       │   │   ├── Text: "Muuday Tecnologia Ltda."
│       │   │   └── Text: "CNPJ: 00.000.000/0001-00"
│       │   └── To (Professional)
│       │       ├── Label: "Para"
│       │       ├── Text: "[Professional Name]"
│       │       └── Text: "CPF: ***.***.***-**"
│       ├── Items Table Card (mt-6, p-0)
│       │   ├── Table
│       │   │   ├── Header: Descrição | Qtd | Valor Unit | Total
│       │   │   └── Body
│       │   │       ├── Row: Consulta Online | 1 | R$150,00 | R$150,00
│       │   │       ├── Row: Taxa de Plataforma | 1 | -R$15,00 | -R$15,00
│       │   │       └── Row: Taxa de Pagamento | 1 | -R$4,50 | -R$4,50
│       │   └── Table Footer (bg-neutral-50, p-4)
│       │       ├── Row: Subtotal → R$150,00
│       │       ├── Row: Total de Taxas → -R$19,50
│       │       └── Row: Total Líquido → R$130,50 (bold, text-lg)
│       └── Metadata Card (mt-6, p-6)
│           ├── Grid (2-col)
│           │   ├── Método: Cartão de Crédito
│           │   ├── NSU: 123456789
│           │   ├── Data: 15/04/2026
│           │   └── Hora: 14:32:00
│           └── Transaction ID (monospace, text-xs, text-muted)
```

### Components Used
| Component | Variant | Count | Notes |
|-----------|---------|-------|-------|
| Sidebar | professional | 1 | Financeiro active |
| Header | default | 1 | With back button |
| Card | default | 4 | Header, items, metadata, parties |
| Badge | status | 1 | Invoice status |
| Button | secondary, sm | 1 | Download PDF |
| Button | ghost, sm | 1 | Back |
| Table | data | 1 | Itemized list |
| Icon | ArrowLeft, Download | 2 | Navigation and download |
| Text | H1, H2, body, caption, mono | — | Hierarchy |

### Token Values
| Element | Token | Value |
|---------|-------|-------|
| Content max-width | — | `800px` |
| Card bg | `surface-card` | `#ffffff` |
| Card border | `border-default` | `1px solid #e7e5e4` |
| Card radius | `radius-lg` | `12px` |
| Card padding | `space-6` | `24px` |
| Parties label font | `text-xs` / `font-semibold` / `text-muted` | `10px` uppercase |
| Parties value font | `text-base` / `font-medium` | `16px` |
| Table header bg | `neutral-50` | `#fafaf9` |
| Table header font | `text-xs` / `font-semibold` / `text-secondary` | `10px` uppercase |
| Table row height | — | `48px` |
| Table cell padding | `px-4 py-3` | `16px 12px` |
| Negative amount color | `error` | `#ef4444` |
| Total font | `text-lg` / `font-bold` / `text-primary` | `20px` |
| Metadata font | `text-sm` / `text-secondary` | `13px` `#57534e` |
| Transaction ID font | `text-xs` / `font-mono` / `text-muted` | `10px` monospace |
| Section gap | `space-6` | `24px` |
| Parties gap | `space-6` | `24px` |

### States
| State | Trigger | Visual |
|-------|---------|--------|
| Default | Page load | Invoice data displayed |
| Loading | Data fetch | Skeleton for all cards |
| Error | Fetch fails | Error boundary with retry |
| Download | PDF requested | Button shows spinner, download initiates |
| Download success | PDF ready | Button returns to normal, toast confirms |
| Mobile | < 1024px | Single column, table becomes stacked list |

### Accessibility Notes
- **Back button**: `aria-label="Voltar para lista de transações"`
- **Invoice header**: `role="article"`, `aria-label="Fatura [ID]"`
- **Status badge**: `aria-label="Status da fatura: [estado]"`
- **Download button**: `aria-label="Baixar fatura em PDF"`
- **Table**: `role="table"`, financial values right-aligned, negative values announced as "Menos [valor]"
- **Total row**: `aria-label="Total líquido: [valor] reais"`, `role="row"`
- **Metadata**: `role="region"`, `aria-label="Detalhes da transação"`
- **Monospace text**: Transaction ID has `aria-label="Identificador da transação"`
- **Color independence**: Positive/negative values distinguished by sign (+/-) and text, not color alone
- **Focus order**: Back → Download → Table → Metadata

---

*Frame specs for Payments & Billing complete. Reference `tokens.md` and `components.md` for component-level details.*


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.

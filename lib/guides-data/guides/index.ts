import { BANCOS_GUIDES } from "./bancos"
import { CIDADANIA_GUIDES } from "./cidadania"
import { COMPRAS_GUIDES } from "./compras"
import { COMUNICACAO_GUIDES } from "./comunicacao"
import { DOCUMENTOS_GUIDES } from "./documentos"
import { EDUCACAO_GUIDES } from "./educacao"
import { FAMILIA_GUIDES } from "./familia"
import { IMOVEIS_GUIDES } from "./imoveis"
import { IMPOSTOS_GUIDES } from "./impostos"
import { MUDANCA_GUIDES } from "./mudanca"
import { PREVIDENCIA_GUIDES } from "./previdencia"
import { SAUDE_GUIDES } from "./saude"
import { TRABALHO_GUIDES } from "./trabalho"
import { VEICULOS_GUIDES } from "./veiculos"

import type { Guide } from "../types"

export const GUIDES: Guide[] = [
  ...BANCOS_GUIDES,
  ...CIDADANIA_GUIDES,
  ...COMPRAS_GUIDES,
  ...COMUNICACAO_GUIDES,
  ...DOCUMENTOS_GUIDES,
  ...EDUCACAO_GUIDES,
  ...FAMILIA_GUIDES,
  ...IMOVEIS_GUIDES,
  ...IMPOSTOS_GUIDES,
  ...MUDANCA_GUIDES,
  ...PREVIDENCIA_GUIDES,
  ...SAUDE_GUIDES,
  ...TRABALHO_GUIDES,
  ...VEICULOS_GUIDES,
]

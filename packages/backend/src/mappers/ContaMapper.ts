import type { Conta } from '@prisma/client';
import type { ContaResponseDTO } from '../types/dtos/conta.dto.js';

export class ContaMapper {
  static toDTO(conta: Conta): ContaResponseDTO {
    return {
      id: conta.id,
      user_id: conta.userId,
      nome: conta.nome,
      banco: conta.banco ?? null,
      tipo_conta: conta.tipoConta ?? 'corrente',
      saldo_inicial: conta.saldoInicial ? Number(conta.saldoInicial) : 0,
    };
  }

  static toDTOList(contas: Conta[]): ContaResponseDTO[] {
    return contas.map(ContaMapper.toDTO);
  }
}

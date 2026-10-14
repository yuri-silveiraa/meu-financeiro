import type {
  CreateGastoFixoDTO,
  UpdateGastoFixoDTO,
  GastoFixoResponseDTO,
} from '../dtos/gastoFixo.dto.js';

export interface IGastosFixosService {
  list(userId: number): Promise<GastoFixoResponseDTO[]>;
  findById(id: number, userId: number): Promise<GastoFixoResponseDTO>;
  create(userId: number, data: CreateGastoFixoDTO): Promise<GastoFixoResponseDTO & { transacoesCriadas: number }>;
  update(id: number, userId: number, data: UpdateGastoFixoDTO): Promise<GastoFixoResponseDTO>;
  delete(id: number, userId: number): Promise<void>;
  sincronizarParcelas(userId: number): Promise<void>;
}

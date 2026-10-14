export interface IPrivacyService {
  exportMyData(userId: number): Promise<any>;
  deleteAccount(userId: number): Promise<void>;
}

export interface AuthUserDTO {
  id: number;
  email: string;
  name: string | null;
  avatar_url: string | null;
}

export interface AuthResponseDTO {
  token: string;
  user: AuthUserDTO;
}

export interface GoogleLoginDTO {
  credential: string;
  consentAccepted?: boolean;
}

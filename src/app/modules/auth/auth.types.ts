import { Role, Plan } from '@prisma/client';

export type TSanitizedUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string | null;
  plan: Plan;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type TLoginResponse = {
  user: TSanitizedUser;
  accessToken: string;
  refreshToken: string;
};

export type TRegisterResponse = TLoginResponse;

export type TRefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

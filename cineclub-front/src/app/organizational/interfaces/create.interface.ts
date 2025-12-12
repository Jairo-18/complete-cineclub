export interface CreateUserPanel {
  id?: string;
  fullName: string;
  username: string;
  email: string;
  country: string;
  phone: string;
  password?: string;
  confirmPassword?: string;
  roleTypeId?: string;
}

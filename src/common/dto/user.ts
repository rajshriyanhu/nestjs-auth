import { Role } from "src/users/entity/users.entity";

export class UserDTO {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    email: string;
    role: Role;
    tenantId: string;

    constructor(partial: Partial<UserDTO>) {
        Object.assign(this, partial);
      }
}
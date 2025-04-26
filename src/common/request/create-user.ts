import { Role } from "src/users/entity/users.entity";

export class CreateUserRequest {
    name: string;
    email : string;
    password: string;
    role: Role;
    tenantId: string;
}
import { UserDTO } from 'src/common/dto/user';
import { BaseEntity } from 'src/common/entity';
import { Tenant } from 'src/tenant/entity/tenant.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

export enum Role {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

@Entity()
export class User extends BaseEntity {
  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'enum', enum: Role })
  role: Role;

  @Column()
  tenantId: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.users)
  @JoinColumn()
  tenant: Tenant;

  public generateUserDTO(): UserDTO {
    return new UserDTO({
      createdAt: this.createdAt,
      email: this.email,
      id: this.id,
      name: this.name,
      role: this.role,
      tenantId: this.tenantId,
      updatedAt: this.updatedAt,
    });
  }
}

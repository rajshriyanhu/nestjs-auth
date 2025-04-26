import { BaseEntity } from 'src/common/entity';
import {
  Entity,
  Column,
} from 'typeorm';

@Entity()
export class Credentials extends BaseEntity{
  @Column()
  refreshToken: string;

  @Column()
  userAgent: string;

  @Column()
  ipAddress: string;

  @Column({ default: false })
  isRevoked: boolean;

  @Column()
  userId: string;

  @Column()
  tenantId: string;
}

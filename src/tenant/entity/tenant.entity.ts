import { BaseEntity } from "src/common/entity";
import { User } from "src/users/entity/users.entity";
import { Column, Entity, OneToMany } from "typeorm";

@Entity()
export class Tenant extends BaseEntity{
    @Column()
    name: string;

    @Column({unique: true})
    email: string;

    @OneToMany(() => User, user => user.tenant)
    users: User[];
}
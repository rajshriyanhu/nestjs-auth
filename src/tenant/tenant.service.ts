import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Tenant } from './entity/tenant.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CreateTenantRequest } from 'src/common/request/create-tenant';

@Injectable()
export class TenantService {

    constructor(
        @InjectRepository(Tenant)
        private readonly tenantRepository: Repository<Tenant>,
        private readonly configService: ConfigService,
      ) {}

    
      async createTenant(request: CreateTenantRequest): Promise<Tenant> {
        if (request.secret !== this.configService.get<string>('TENANT_SECRET')) {
          throw new Error('Secret does not match');
        }
    
        const newTenant = this.tenantRepository.create({
          email: request.tenantEmail,
          name: request.tenantName,
        });
    
        return await this.tenantRepository.save(newTenant); 
      }

      async deleteTenant(tenantId: string) {
        const result = await this.tenantRepository.delete({ id: tenantId });
      
        if (result.affected === 0) {
          throw new NotFoundException(`Tenant with id ${tenantId} not found.`);
        }
      
        return { message: 'Tenant deleted successfully.' };
      }

      async getTenantByAdminEmail(email: string){
        const tenant = await this.tenantRepository.findOneBy({
          email : email
        })

        if(!tenant){
          throw new NotFoundException("Tenant not found.")
        }
        return tenant;
      }
}

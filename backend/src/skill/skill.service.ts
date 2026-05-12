import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';




@Injectable()
export class SkillService {
  constructor(
    private readonly prisma: PrismaService,
    
  ) {}

  
}

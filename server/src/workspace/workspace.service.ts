import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from './workspace.entity';

@Injectable()
export class WorkspaceService {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
  ) {}

  async findAll(): Promise<Workspace[]> {
    return await this.workspaceRepository.find();
  }

  async findAllByCurrentUser(): Promise<Workspace[]> {
    return await this.workspaceRepository.find();
  }

  async save(workspaces: Workspace[]): Promise<Workspace[]> {
    return await this.workspaceRepository.save(workspaces);
  }

  async delete(workspace: Workspace){
    return await this.workspaceRepository.delete(workspace);
  }

  async deleteById(workspaceId: number){
    return await this.workspaceRepository.delete(workspaceId);
  }
}

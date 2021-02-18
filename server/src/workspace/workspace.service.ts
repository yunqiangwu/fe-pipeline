import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client1_13, ApiRoot } from 'kubernetes-client';
import { Workspace } from './workspace.entity';

@Injectable()
export class WorkspaceService {

  private kubeClient: ApiRoot;

  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
  ) {
    this.kubeClient = new Client1_13({});
  }

  async findNodes(options?: any): Promise<any[]> {
    return await this.kubeClient.api.v1.nodes.get(options);
  }

  async findAll(): Promise<Workspace[]> {
    return await this.workspaceRepository.find();
  }

  async findAllByCurrentUser(userId: number): Promise<Workspace[]> {
    return await this.workspaceRepository.find({ userId });
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

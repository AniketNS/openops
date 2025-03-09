import { OpenOpsId } from '../../common/id-generator';
import { ProjectId } from '../../project/project';
import { WorkerMachineType } from '../../workers';
import { PrincipalType } from './principal-type';

export type Principal = {
  id: OpenOpsId;
  type: PrincipalType;
  projectId: ProjectId;
  organization: {
    id: OpenOpsId;
  };
};

export type WorkerPrincipal = {
  id: OpenOpsId;
  type: PrincipalType.WORKER;
  organization: {
    id: OpenOpsId;
  } | null;
  worker: {
    type: WorkerMachineType;
  };
};

export type EnginePrincipal = {
  id: OpenOpsId;
  type: PrincipalType.ENGINE;
  queueToken: string | undefined;
  projectId: ProjectId;
};

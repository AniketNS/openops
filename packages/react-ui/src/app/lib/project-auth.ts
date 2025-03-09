import { SwitchProjectResponse } from '@openops/shared';
import { api } from './api';

export const projectAuth = {
  getTokenForProject: async (projectId: string) => {
    return api.post<SwitchProjectResponse>(
      `/v1/users/projects/${projectId}/token`,
      {
        projectId,
      },
    );
  },
};

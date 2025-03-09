import { Static, Type } from '@sinclair/typebox';
import { BaseModelSchema } from '../../common';
import { MinimalFlow } from '../flow';

export const UNCATEGORIZED_FOLDER_ID = 'NULL';
export const UNCATEGORIZED_FOLDER_DISPLAY_NAME = 'Uncategorized';

export type FolderId = string;

export const Folder = Type.Object({
  ...BaseModelSchema,
  id: Type.String(),
  projectId: Type.String(),
  displayName: Type.String(),
});

export type Folder = Static<typeof Folder>;

export type FolderDto = Folder & {
  numberOfFlows: number;
  flows?: MinimalFlow[];
  parentFolderId?: string;
  subfolders?: FolderDto[];
};

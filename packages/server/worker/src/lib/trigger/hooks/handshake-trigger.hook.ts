import {
  WebhookHandshakeStrategy,
  WebhookResponse,
} from '@openops/blocks-framework';
import {
  BlockTriggerSettings,
  FlowVersion,
  isNil,
  ProjectId,
  TriggerHookType,
  TriggerPayload,
} from '@openops/shared';
import { engineApiService } from '../../api/server-api.service';
import { engineRunner } from '../../engine';
import { webhookUtils } from '../../utils/webhook-utils';

export async function tryHandshake(
  engineToken: string,
  params: ExecuteHandshakeParams,
): Promise<WebhookResponse | null> {
  const { payload, flowVersion, projectId } = params;

  const settings = flowVersion.trigger.settings as BlockTriggerSettings;
  const blockMetadata = await engineApiService(engineToken).getBlock(
    settings.blockName,
    {
      version: settings.blockVersion,
    },
  );
  const tirggerName = settings.triggerName;
  if (isNil(tirggerName)) {
    return null;
  }
  const handshakeConfig =
    blockMetadata.triggers?.[tirggerName]?.handshakeConfiguration;
  if (isNil(handshakeConfig)) {
    return null;
  }
  const strategy = handshakeConfig.strategy ?? WebhookHandshakeStrategy.NONE;
  switch (strategy) {
    case WebhookHandshakeStrategy.HEADER_PRESENT: {
      if (
        handshakeConfig.paramName &&
        handshakeConfig.paramName.toLowerCase() in payload.headers
      ) {
        return executeHandshake({
          engineToken: params.engineToken,
          flowVersion,
          projectId,
          payload,
        });
      }
      break;
    }
    case WebhookHandshakeStrategy.QUERY_PRESENT: {
      if (
        handshakeConfig.paramName &&
        handshakeConfig.paramName in payload.queryParams
      ) {
        return executeHandshake({
          engineToken: params.engineToken,
          flowVersion,
          projectId,
          payload,
        });
      }
      break;
    }
    case WebhookHandshakeStrategy.BODY_PARAM_PRESENT: {
      if (
        handshakeConfig.paramName &&
        typeof payload.body === 'object' &&
        payload.body !== null &&
        handshakeConfig.paramName in payload.body
      ) {
        return executeHandshake({
          engineToken: params.engineToken,
          flowVersion,
          projectId,
          payload,
        });
      }
      break;
    }
    default:
      break;
  }
  return null;
}

async function executeHandshake(
  params: ExecuteHandshakeParams,
): Promise<WebhookResponse> {
  const { flowVersion, projectId, payload } = params;
  const { result } = await engineRunner.executeTrigger(params.engineToken, {
    hookType: TriggerHookType.HANDSHAKE,
    flowVersion,
    triggerPayload: payload,
    webhookUrl: await webhookUtils.getWebhookUrl({
      flowId: flowVersion.flowId,
      simulate: false,
    }),
    test: false,
    projectId,
  });
  if (!result.success || result.response === undefined) {
    return {
      status: 500,
      body: {
        error: 'Failed to execute handshake',
      },
    };
  }
  return result.response;
}

type ExecuteHandshakeParams = {
  flowVersion: FlowVersion;
  projectId: ProjectId;
  payload: TriggerPayload;
  engineToken: string;
};

const describeSnapshotsCommandMock = jest.fn();
jest.mock('@aws-sdk/client-ec2', () => {
  return {
    ...jest.requireActual('@aws-sdk/client-ec2'),
    DescribeSnapshotsCommand: describeSnapshotsCommandMock,
  };
});

const CREDENTIALS = {
  accessKeyId: 'some accessKeyId',
  secretAccessKey: 'some secretAccessKey',
  sessionToken: 'some sessionToken',
};

const getAwsClientMock = {
  getAwsClient: jest.fn(),
};

jest.mock('../../../src/lib/aws/get-client', () => getAwsClientMock);
import * as EC2 from '@aws-sdk/client-ec2';
import { getEbsSnapshots } from '../../../src/lib/aws/ebs/get-ebs-snapshots';

describe('getEbsSnapshots', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return correct results for regions %p', async () => {
    const sendMock = jest
      .fn()
      .mockResolvedValueOnce({
        Snapshots: [{ SnapshotId: `mockResult1`, Status: 'pending' }],
      })
      .mockResolvedValueOnce({
        Snapshots: [{ SnapshotId: `mockResult2`, Status: 'completed' }],
      });

    getAwsClientMock.getAwsClient.mockImplementation(() => ({
      send: sendMock,
    }));

    const filters = [{ Name: 'some filter', Values: ['some value'] }];
    const result = await getEbsSnapshots(
      CREDENTIALS,
      ['some-region1', 'some-region2'],
      true,
      filters,
    );

    expect(getAwsClientMock.getAwsClient).toBeCalledTimes(2);
    expect(getAwsClientMock.getAwsClient).toBeCalledWith(
      EC2.EC2,
      CREDENTIALS,
      'some-region1',
    );
    expect(getAwsClientMock.getAwsClient).toBeCalledWith(
      EC2.EC2,
      CREDENTIALS,
      'some-region2',
    );
    expect(result).toStrictEqual([
      { Status: 'pending', SnapshotId: 'mockResult1', region: 'some-region1' },
      {
        Status: 'completed',
        SnapshotId: 'mockResult2',
        region: 'some-region2',
      },
    ]);
    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(describeSnapshotsCommandMock).toHaveBeenCalledWith({
      Filters: filters,
      DryRun: true,
      OwnerIds: ['self'],
    });
  });
});

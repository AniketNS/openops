import { BlockAuth, createAction, Property } from '@openops/blocks-framework';
import {
  addRow,
  authenticateDefaultUserInOpenOpsTables,
  getFields,
  getPrimaryKeyFieldFromFields,
  getPropertyFromField,
  getRowByPrimaryKeyValue,
  getTableFields,
  getTableIdByTableName,
  openopsTablesDropdownProperty,
  updateRow,
} from '@openops/common';
import { convertToStringWithValidation, isEmpty } from '@openops/shared';

export const updateRecordAction = createAction({
  auth: BlockAuth.None(),
  name: 'update_record',
  description: 'Add or update a record in an OpenOps table.',
  displayName: 'Add or Update Record',
  props: {
    tableName: openopsTablesDropdownProperty(),
    rowPrimaryKey: Property.DynamicProperties({
      displayName: 'Row Primary Key',
      description:
        'The primary key value of the row to update. If the row does not exist, a new row will be created.',
      required: true,
      refreshers: ['tableName'],
      props: async ({ tableName }) => {
        if (!tableName) {
          return {};
        }

        const fields = await getTableFields(tableName as unknown as string);

        const primaryKeyField = getPrimaryKeyFieldFromFields(fields);

        const properties: { [key: string]: any } = {};
        properties['rowPrimaryKey'] = primaryKeyField.read_only
          ? Property.ShortText({
              displayName: 'Primary Key Value',
              required: false,
              description:
                'The primary key value of the row to update. If left empty, a new row will be created.',
            })
          : Property.ShortText({
              displayName: 'Primary Key Value',
              required: true,
              description:
                'The primary key value of the row to update. If the row does not exist, a new row will be created.',
            });

        return properties;
      },
    }),
    fieldsProperties: Property.DynamicProperties({
      displayName: '',
      description: '',
      required: true,
      refreshers: ['tableName'],
      props: async ({ tableName }) => {
        if (!tableName) {
          return {};
        }

        const tableFields = await getTableFields(
          tableName as unknown as string,
        );

        const properties: { [key: string]: any } = {};
        properties['fieldsProperties'] = Property.Array({
          displayName: 'Fields to update',
          required: true,
          properties: {
            fieldName: Property.StaticDropdown<string>({
              displayName: 'Field name',
              required: true,
              options: {
                options: tableFields
                  .filter((f) => !f.read_only && !f.primary)
                  .map((f) => ({ label: f.name, value: f.name })),
              },
            }),
            newFieldValue: Property.DynamicProperties({
              displayName: 'New field value',
              required: true,
              refreshers: ['fieldName'],
              props: async ({ fieldName }) => {
                const innerProps: { [key: string]: any } = {};
                const currentField = fieldName as unknown as string;
                if (!currentField) {
                  innerProps['newFieldValue'] = {};
                } else {
                  const openOpsField = tableFields.find(
                    (f) => f.name === currentField,
                  );

                  innerProps['newFieldValue'] = openOpsField
                    ? getPropertyFromField(openOpsField, true)
                    : {};
                }
                return innerProps;
              },
            }),
          },
        });
        return properties;
      },
    }),
  },
  async run(context) {
    const { rowPrimaryKey, fieldsProperties } = context.propsValue;
    const tableName = context.propsValue.tableName as unknown as string;
    const tableId = await getTableIdByTableName(tableName);

    const { token } = await authenticateDefaultUserInOpenOpsTables();

    const fields = await getFields(tableId, token);
    const primaryKeyField = getPrimaryKeyFieldFromFields(fields);
    const primaryKeyValue = getPrimaryKey(rowPrimaryKey['rowPrimaryKey']);

    const rowToUpdate = primaryKeyValue
      ? await getRowByPrimaryKeyValue(
          token,
          tableId,
          primaryKeyValue,
          primaryKeyField.name,
        )
      : undefined;

    const fieldsToUpdate = await mapFieldsToObject(fieldsProperties);

    if (!rowToUpdate) {
      fieldsToUpdate[primaryKeyField.name] = primaryKeyValue;
      return await addRow({
        tableId: tableId,
        token: token,
        fields: fieldsToUpdate,
      });
    }

    return await updateRow({
      tableId: tableId,
      token: token,
      rowId: rowToUpdate.id,
      fields: fieldsToUpdate,
    });
  },
});

function getPrimaryKey(rowPrimaryKey: any): string | undefined {
  if (rowPrimaryKey === null || rowPrimaryKey === undefined) {
    return undefined;
  }

  const primaryKeyValue = convertToStringWithValidation(
    rowPrimaryKey,
    'The primary key should be a string',
  );

  return isEmpty(primaryKeyValue) ? undefined : primaryKeyValue;
}

async function mapFieldsToObject(fieldsProperties: any) {
  const updateFieldsProperty = fieldsProperties[
    'fieldsProperties'
  ] as unknown as { fieldName: string; newFieldValue: any }[];

  const fieldsToUpdate: { [key: string]: any } = {};
  updateFieldsProperty?.map((updateFieldData) => {
    fieldsToUpdate[updateFieldData.fieldName] =
      updateFieldData.newFieldValue['newFieldValue'];
  });

  return fieldsToUpdate;
}

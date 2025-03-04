<?php

namespace App\Modules\Sites\Models\Fields\Domains;

use Colibri\Data\Storages\Fields\ObjectField;

# region Uses:
use App\Modules\Sites\Models\Fields\Domains\AdditionalMetaObjectField;
use App\Modules\Sites\Models\Fields\Domains\AdditionalParametersArrayField;
use App\Modules\Sites\Models\Fields\Domains\AdditionalSettingsObjectField;
use Colibri\Data\Storages\Fields\ArrayField;
# endregion Uses;

/**
 * Представление поля в таблице в хранилище Дополнительные параметры
 * @author <author name and email>
 * @package App\Modules\Sites\Models\Fields\Domains\Fields
 * 
 * region Properties:
 * @property AdditionalMetaObjectField|null $meta Мета данные
 * @property AdditionalSettingsObjectField|null $settings Технические данные
 * @property AdditionalParametersArrayField|null $parameters Дополнительные свойства
 * endregion Properties;
 */
class AdditionalObjectField extends ObjectField
{
    public const JsonSchema = [
        'type' => 'object',
        'required' => [
            # region SchemaRequired:

			# endregion SchemaRequired;
        ],
        'properties' => [
            # region SchemaProperties:
			'meta' => [  'oneOf' => [ AdditionalMetaObjectField::JsonSchema, [ 'type' => 'null'] ] ],
			'settings' => [  'oneOf' => [ AdditionalSettingsObjectField::JsonSchema, [ 'type' => 'null'] ] ],
			'parameters' => [  'oneOf' => [ AdditionalParametersArrayField::JsonSchema, [ 'type' => 'null'] ] ],
			# endregion SchemaProperties;
        ]
    ];
}

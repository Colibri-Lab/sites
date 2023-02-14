<?php

namespace App\Modules\Sites\Models\Fields\Pages;

use Colibri\Data\Storages\Fields\ObjectField;

# region Uses:

# endregion Uses;

/**
 * Представление поля в таблице в хранилище Технические данные
 * @author <author name and email>
 * @package App\Modules\Sites\Models\Fields\Pages\Fields
 * 
 * region Properties:
 * @property string|null $component Компонента
 * @property string|null $template Шаблон
 * endregion Properties;
 */
class AdditionalSettingsObjectField extends ObjectField
{
    public const JsonSchema = [
        'type' => 'object',
        'required' => [
            # region SchemaRequired:

			# endregion SchemaRequired;
        ],
        'properties' => [
            # region SchemaProperties:
			'component' => [ 'oneOf' => [ [ 'type' => 'null'], ['type' => 'string', 'maxLength' => 255, ] ] ],
			'template' => [ 'oneOf' => [ [ 'type' => 'null'], ['type' => 'string', 'maxLength' => 255, ] ] ],
			# endregion SchemaProperties;
        ]
    ];
}

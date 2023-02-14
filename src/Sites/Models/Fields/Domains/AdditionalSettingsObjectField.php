<?php

namespace App\Modules\Sites\Models\Fields\Domains;

use Colibri\Data\Storages\Fields\ObjectField;

# region Uses:
use Colibri\Data\Storages\Fields\ValueField;
# endregion Uses;

/**
 * Представление поля в таблице в хранилище Технические данные
 * @author <author name and email>
 * @package App\Modules\Sites\Models\Fields\Domains\Fields
 * 
 * region Properties:
 * @property ValueField|int|float|ValueField $type Тип приложения
 * @property string $module Стартовый модуль
 * @property string|null $component Компонент по умолчанию
 * @property string|null $template Шаблон по умолчанию
 * endregion Properties;
 */
class AdditionalSettingsObjectField extends ObjectField
{
    public const JsonSchema = [
        'type' => 'object',
        'required' => [
            # region SchemaRequired:
			'type',
			'module',
			# endregion SchemaRequired;
        ],
        'properties' => [
            # region SchemaProperties:
			'type' => ['type' => 'string', 'enum' => ['application', 'website']],
			'module' => ['type' => 'string', 'maxLength' => 255, ],
			'component' => [ 'oneOf' => [ [ 'type' => 'null'], ['type' => 'string', 'maxLength' => 255, ] ] ],
			'template' => [ 'oneOf' => [ [ 'type' => 'null'], ['type' => 'string', 'maxLength' => 255, ] ] ],
			# endregion SchemaProperties;
        ]
    ];
}

<?php

namespace App\Modules\Sites\Models\Fields\Domains;

use Colibri\Data\Storages\Fields\ObjectField;

# region Uses:
use App\Modules\Lang\Models\Fields\Text;
# endregion Uses;

/**
 * Представление поля в таблице в хранилище Дополнительные свойства
 * @author <author name and email>
 * @package App\Modules\Sites\Models\Fields\Domains\Fields
 * 
 * region Properties:
 * @property string|null $name Наименование поля
 * @property Text|null $description Описание поля
 * @property string|null $type Тип
 * @property int|null $length Длина
 * @property string|null $default Значение по умолчанию
 * @property string|null $class Класс (PHP)
 * @property string|null $component Компонента (JS)
 * endregion Properties;
 */
class AdditionalParametersObjectField extends ObjectField
{
    public const JsonSchema = [
        'type' => 'object',
        'required' => [
            # region SchemaRequired:

            # endregion SchemaRequired;
        ],
        'properties' => [
            # region SchemaProperties:
			'name' => [ 'oneOf' => [ [ 'type' => 'null'], ['type' => 'string', 'maxLength' => 50, ] ] ],
			'description' => [ 'oneOf' => [ [ 'type' => 'null'], Text::JsonSchema ] ],
			'type' => [ 'oneOf' => [ [ 'type' => 'null'], ['type' => 'string', 'maxLength' => 20, ] ] ],
			'length' => [ 'oneOf' => [ [ 'type' => 'null'], ['type' => 'integer', ] ] ],
			'default' => [ 'oneOf' => [ [ 'type' => 'null'], ['type' => 'string', 'maxLength' => 255, ] ] ],
			'class' => [ 'oneOf' => [ [ 'type' => 'null'], ['type' => 'string', 'maxLength' => 255, ] ] ],
			'component' => [ 'oneOf' => [ [ 'type' => 'null'], ['type' => 'string', 'maxLength' => 255, ] ] ],
            # endregion SchemaProperties;
        ]
    ];
}

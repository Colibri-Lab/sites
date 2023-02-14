<?php

namespace App\Modules\Sites\Models\Fields\Pages;

use Colibri\Data\Storages\Fields\ObjectField;

# region Uses:
use App\Modules\Lang\Models\Fields\Text;
# endregion Uses;

/**
 * Представление поля в таблице в хранилище Мета данные
 * @author <author name and email>
 * @package App\Modules\Sites\Models\Fields\Pages\Fields
 * 
 * region Properties:
 * @property Text|null $title Заголовок страницы
 * @property Text|null $description Описание страницы
 * @property Text|null $keywords Ключевые слова
 * endregion Properties;
 */
class AdditionalMetaObjectField extends ObjectField
{
    public const JsonSchema = [
        'type' => 'object',
        'required' => [
            # region SchemaRequired:

            # endregion SchemaRequired;
        ],
        'properties' => [
            # region SchemaProperties:
			'title' => [ 'oneOf' => [ [ 'type' => 'null'], Text::JsonSchema ] ],
			'description' => [ 'oneOf' => [ [ 'type' => 'null'], Text::JsonSchema ] ],
			'keywords' => [ 'oneOf' => [ [ 'type' => 'null'], Text::JsonSchema ] ],
            # endregion SchemaProperties;
        ]
    ];
}

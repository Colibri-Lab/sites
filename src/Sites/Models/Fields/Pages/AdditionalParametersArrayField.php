<?php

namespace App\Modules\Sites\Models\Fields\Pages;

use Colibri\Data\Storages\Fields\ArrayField;

# region Uses:
use App\Modules\Sites\Models\Fields\Pages\AdditionalParametersObjectField;
# endregion Uses;

/**
 * Представление поля в таблице в хранилище Дополнительные свойства
 * @class
 * @extends ArrayField
 * @method AdditionalParametersObjectField Item(int $index)
 * @method AdditionalParametersObjectField offsetGet(mixed $offset)
 */
class AdditionalParametersArrayField extends ArrayField
{
    public const JsonSchema = [
        'type' => 'array',
        'items' => AdditionalParametersObjectField::JsonSchema
    ];
}

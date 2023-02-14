<?php

namespace App\Modules\Sites\Models\Fields\Domains;

use Colibri\Data\Storages\Fields\ArrayField;

# region Uses:
use App\Modules\Sites\Models\Fields\Domains\AdditionalParametersObjectField;
# endregion Uses;

/**
 * Представление поля в таблице в хранилище Дополнительные свойства
 * @author <author name and email>
 * @package App\Modules\Sites\Models\Fields\Domains\Fields
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

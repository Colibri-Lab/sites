<?php

namespace App\Modules\Sites\Models\Fields;

use Colibri\Data\Storages\Fields\ObjectField;
use Colibri\Data\Storages\Fields\Field;
use Colibri\Data\Storages\Storage;
use Colibri\Data\Storages\Models\DataRow;

class ParametersField extends ObjectField
{

    public function __construct(mixed $data, ? Storage $storage = null, ? Field $field = null, ? DataRow $datarow = null)
    {
        parent::__construct($data, $storage, $field);

        $parameters = $datarow->additional->parameters;
        foreach ($parameters as $parameter) {
            $this->_field->AddField($parameter->name, [
                'type' => $parameter->type,
                'length' => $parameter->length,
                'class' => $parameter->class,
                'component' => $parameter->component,
                'default' => $parameter->default,
                'description' => $parameter->description
            ]);
        }

    }

}
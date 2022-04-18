<?php

namespace App\Modules\Sites\Models;

# region Uses:
use Colibri\Data\Storages\Fields\ValueField;
use Colibri\Data\Storages\Fields\ObjectField;
use App\Modules\Sites\Models\Fields\ParametersField;
# endregion Uses;
use Colibri\Data\Storages\Fields\DateTimeField;
use Colibri\Data\Storages\Models\DataRow as BaseModelDataRow;
use Colibri\Data\MySql\NonQueryInfo;

/**
 * Представление строки в таблице в хранилище Сайты
 * @author <author name and email>
 * @package App\Modules\Sites\Models
 * 
 * region Properties:
 * @property-read int $id ID строки
 * @property-read DateTimeField $datecreated Дата создания строки
 * @property-read DateTimeField $datemodified Дата последнего обновления строки
 * @property ValueField|null $name Ключ домена
 * @property string|null $description Описание страницы
 * @property bool|null $closed Закрыт
 * @property ObjectField|null $additional Дополнительные параметры
 * @property ParametersField|null $parameters 
 * endregion Properties;
 */
class Domain extends BaseModelDataRow {

    public function Delete(): NonQueryInfo
    {
        Publications::DeleteAllByDomain($this);
        Pages::DeleteAllByDomain($this);
        return parent::Delete();
    }

    public function Template(): ?string
    {
        return $this->additional?->settings?->template;
    }

}
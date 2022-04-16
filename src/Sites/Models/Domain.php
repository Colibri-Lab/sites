<?php

namespace App\Modules\Sites\Models;

use Colibri\Data\Storages\Fields\DateTimeField;
use Colibri\Data\Storages\Models\DataRow as BaseModelDataRow;
use Colibri\Data\Storages\Fields\ArrayField;
use Colibri\Data\Storages\Fields\ObjectField;
use Colibri\Data\SqlClient\NonQueryInfo;

/**
 * Представление строки в таблице в хранилище Сайты
 * @author <author name and email>
 * @package App\Modules\Sites\Models
 * 
 * region Properties:
 * @property-read int $id ID строки
 * @property-read DateTimeField $datecreated Дата создания строки
 * @property-read DateTimeField $datemodified Дата последнего обновления строки
 * @property string|null $name Наименование сайта
 * @property string|null $description Описание страницы
 * @property bool|null $closed Закрыт
 * @property ArrayField|null $domains Список доменов
 * @property ObjectField|null $additional Дополнительные параметры
 * endregion Properties;
 */
class Domain extends BaseModelDataRow {

    public function Delete(): NonQueryInfo
    {
        Publications::DeleteAllByDomain($this);
        Pages::DeleteAllByDomain($this);
        return parent::Delete();
    }

}
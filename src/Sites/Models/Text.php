<?php

namespace App\Modules\Sites\Models;

use Colibri\Data\Storages\Fields\DateTimeField;
use Colibri\Data\Storages\Models\DataRow as BaseModelDataRow;
use Colibri\Data\MySql\QueryInfo;


/**
 * Представление строки в таблице в хранилище Тексты
 * @author <author name and email>
 * @package App\Modules\Sites\Models
 * 
 * region Properties:
 * @property-read int $id ID строки
 * @property-read DateTimeField $datecreated Дата создания строки
 * @property-read DateTimeField $datemodified Дата последнего обновления строки
 * @property string|null $title Заголовок
 * @property string $html Содержание
 * endregion Properties;
 */
class Text extends BaseModelDataRow {

    public function Delete(): QueryInfo
    {
        // удаляем все публикации
        Publications::DeleteAllByRow($this);
        return parent::Delete();    
    }

}
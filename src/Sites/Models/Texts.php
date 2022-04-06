<?php

namespace App\Modules\Sites\Models;

use Colibri\Data\DataAccessPoint;
use Colibri\Data\SqlClient\IDataReader;
use Colibri\Data\Storages\Storages;
use Colibri\Data\Storages\Storage;
use Colibri\Data\Storages\Models\DataTable as BaseModelDataTable;
use App\Modules\Sites\Models\Text;

/**
 * Таблица, представление данных в хранилище Тексты
 * @author <author name and email>
 * @package App\Modules\Sites\Models
 * 
 * @method Text[] getIterator()
 * @method Text _createDataRowObject()
 * @method Text _read()
 * 
 */
class Texts extends BaseModelDataTable {

    /**
     * Конструктор
     * @param DataAccessPoint $point точка доступа
     * @param IDataReader|null $reader ридер
     * @param string|\Closure $returnAs возвращать в виде класса
     * @param Storage|null $storage хранилище
     * @return void 
     */
    public function __construct(DataAccessPoint $point, IDataReader $reader = null, string $returnAs = 'Text', Storage|null $storage = null)
    {
        parent::__construct($point, $reader, $returnAs, $storage);
    }

    
    /**
     * Создание модели по названию хранилища
     * @param int $page страница
     * @param int $pagesize размер страницы
     * @param string $filter строка фильтрации
     * @param string $order сортировка
     * @param array $params параметры к запросу
     * @return Texts
     */
    static function LoadByFilter(int $page = -1, int $pagesize = 20, string $filter = null, string $order = null, array $params = []) : Texts
    {
        $storage = Storages::Create()->Load('texts');
        return self::LoadByQuery(
            $storage,
            'select * from ' . $storage->name . 
                ($filter ? ' where ' . $filter : '') . 
                ($order ? ' order by ' . $order : ''), 
            ['page' => $page, 'pagesize' => $pagesize, 'params' => $params]
        );
    }

    /**
     * Загружает без фильтра
     * @param int $page страница
     * @param int $pagesize размер страницы
     * @return Texts 
     */
    static function LoadAll(int $page = -1, int $pagesize = 20) : Texts
    {
        return self::LoadByFilter($page, $pagesize, null, null);
    }

    /**
     * Возвращает модель по ID
     * @param int $id ID строки
     * @return Text|null
     */
    static function LoadById(int $id) : Text|null 
    {
        $table = self::LoadByFilter(1, 1, '{id}=[[id:integer]]', null, ['id' => $id]);
        return $table->Count() > 0 ? $table->First() : null;
    }

    /**
     * Создание модели по названию хранилища
     * @return Text
     */
    static function LoadEmpty() : Text
    {
        $reports = self::LoadByFilter(-1, 20, 'false');
        return $reports->CreateEmptyRow();
    }

    
    /**
     * Удаляет все по списку ID
     * @param int[] $ids ID строки
     * @return void
     */
    static function DeleteAllByIds(array $ids): void
    {
        $storage = Storages::Create()->Load('texts');
        $storage->accessPoint->Delete('texts', 'texts_id in ('.implode(',', $ids).')');
    }

}
<?php

namespace App\Modules\Sites\Models;

use Colibri\Data\DataAccessPoint;
use Colibri\Data\SqlClient\IDataReader;
use Colibri\Data\Storages\Storages;
use Colibri\Data\Storages\Storage;
use Colibri\Data\Storages\Models\DataTable as BaseModelDataTable;
use App\Modules\Sites\Models\Publication;
use Colibri\Data\Storages\Models\DataRow;

/**
 * Таблица, представление данных в хранилище Публикации
 * @author <author name and email>
 * @package App\Modules\Sites\Models
 * 
 * @method Publication[] getIterator()
 * @method Publication _createDataRowObject()
 * @method Publication _read()
 * 
 */
class Publications extends BaseModelDataTable {

    const StartOrder = 1000000;

    /**
     * Конструктор
     * @param DataAccessPoint $point точка доступа
     * @param IDataReader|null $reader ридер
     * @param string|\Closure $returnAs возвращать в виде класса
     * @param Storage|null $storage хранилище
     * @return void 
     */
    public function __construct(DataAccessPoint $point, IDataReader $reader = null, string $returnAs = 'Publication', Storage|null $storage = null)
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
     * @return Publications
     */
    static function LoadByFilter(int $page = -1, int $pagesize = 20, string $filter = null, string $order = null, array $params = []) : Publications
    {
        $storage = Storages::Create()->Load('pubs');
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
     * @return Publications 
     */
    static function LoadAll(int $page = -1, int $pagesize = 20) : Publications
    {
        return self::LoadByFilter($page, $pagesize, null, '{order}');
    }

    /**
     * Возвращает модель по ID
     * @param int $id ID строки
     * @return Publication|null
     */
    static function LoadById(int $id) : Publication|null 
    {
        $table = self::LoadByFilter(1, 1, '{id}=[[id:integer]]', null, ['id' => $id]);
        return $table->Count() > 0 ? $table->First() : null;
    }

    /**
     * Возвращает модель по ID
     * @param int[] $ids ID строки
     * @return Publications
     */
    static function LoadByIds(array $ids) : Publications
    {
        return self::LoadByFilter(-1, 20, '{id} in ('.implode(',', $ids).')', null);
    }

    /**
     * Удаляет все по списку ID
     * @param int[] $ids ID строки
     * @return void
     */
    static function DeleteAllByIds(array $ids): void
    {
        $storage = Storages::Create()->Load('pubs');
        $storage->accessPoint->Delete('pubs', 'pubs_id in ('.implode(',', $ids).')');
    }


    /**
     * Загружает без фильтра
     * @param int $page страница
     * @param int $pagesize размер страницы
     * @return Publications 
     */
    static function LoadByPage(Page|int $folder, ?string $term = '', int $page = -1, int $pagesize = 20) : Publications
    {
        if(!is_numeric($folder)) {
            $folder = $folder->id;
        }
        
        $params = ['folder' => $folder];
        if($term) {
            $params['term'] = '%'.$term.'%';
        }

        return self::LoadByFilter($page, $pagesize, 'pubs_page=[[folder:integer]]'.($term ? ' and {ft} like [[term:string]]' : ''), '{order}', $params);
    }

    /**
     * Создание модели по названию хранилища
     * @return Publication
     */
    static function LoadEmpty() : Publication
    {
        $pubs = self::LoadByFilter(-1, 20, 'false');
        return $pubs->CreateEmptyRow();
    }

    /**
     * Создание модели по названию хранилища
     * @return Publication
     */
    static function CreatePublication(?Page $page, DataRow $datarow) : Publication
    {
        $pubs = self::LoadByFilter(-1, 20, 'false');
        $empty = $pubs->CreateEmptyRow();
        $empty->page = $page ?: 0;
        $empty->storage = $datarow->Storage()->name;
        $empty->row = $datarow->id;
        $empty->order = Publications::NextPublicationOrder($page);
        return $empty;
    }

    
    static function NextPublicationOrder(?Page $page = null): int
    {
        $pubs = Publications::LoadByFilter(1, 1, '{page}=[[page:integer]]', '{order} desc', ['page' => $page ? $page->id : 0]);
        $pub = $pubs->First();
        if(!$pub) {
            return Publications::StartOrder;
        }
        return $pub->order + Publications::StartOrder;
    }

}
<?php

namespace App\Modules\Sites\Models;

use Colibri\Data\DataAccessPoint;
use Colibri\Data\SqlClient\IDataReader;
use Colibri\Data\Storages\Storages;
use Colibri\Data\Storages\Storage;
use Colibri\Data\Storages\Models\DataTable as BaseModelDataTable;
use App\Modules\Sites\Models\Page;

/**
 * Таблица, представление данных в хранилище Публикации
 * @author <author name and email>
 * @package App\Modules\Sites\Models
 * 
 * @method Page[] getIterator()
 * @method Page _createDataRowObject()
 * @method Page _read()
 * 
 */
class Pages extends BaseModelDataTable {

    const StartOrder = 1000000;

    /**
     * Конструктор
     * @param DataAccessPoint $point точка доступа
     * @param IDataReader|null $reader ридер
     * @param string|\Closure $returnAs возвращать в виде класса
     * @param Storage|null $storage хранилище
     * @return void 
     */
    public function __construct(DataAccessPoint $point, IDataReader $reader = null, string $returnAs = 'Page', Storage|null $storage = null)
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
     * @return Pages
     */
    static function LoadByFilter(int $page = -1, int $pagesize = 20, string $filter = null, string $order = null, array $params = []) : Pages
    {
        $storage = Storages::Create()->Load('pages');
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
     * @return Pages 
     */
    static function LoadAll(int $page = -1, int $pagesize = 20) : Pages
    {
        return self::LoadByFilter($page, $pagesize, null, null);
    }

    /**
     * Возвращает модель по ID
     * @param int $id ID строки
     * @return Page|null
     */
    static function LoadById(int $id) : Page|null 
    {
        $table = self::LoadByFilter(1, 1, '{id}=[[id:integer]]', null, ['id' => $id]);
        return $table->Count() > 0 ? $table->First() : null;
    }

    /**
     * Загружает дочерние
     * @param int $page страница
     * @param int $pagesize размер страницы
     * @return Pages 
     */
    static function LoadByParent(Page|int $parent, int $page = -1, int $pagesize = 20) : Pages
    {
        if(!is_numeric($parent)) {
            $parent = $parent->id;
        }
        return self::LoadByFilter($page, $pagesize, '{parent}=[[parent:integer]]', null, ['parent' => $parent]);
    }

    /**
     * Создание модели по названию хранилища
     * @return Page
     */
    static function LoadEmpty(?Page $parent = null) : Page
    {
        $sitePages = self::LoadByFilter(-1, 20, 'false');
        /** Page $sitePage */
        $newPage = $sitePages->CreateEmptyRow();
        if($parent) {
            $newPage->parent = $parent;
        }
        $newPage->order = Pages::NextPageOrder($parent);
        return $newPage;
    }

    /**
     * Возвращает следующий порядковый номер
     */
    static function NextPageOrder(?Page $parent = null): int
    {
        $filter = '';
        $params = [];
        if($parent) {
            $filter = '{parent}=[[parent:integer]]';
            $params['parent'] = $parent->id;
        }

        $sitePages = self::LoadByFilter(1, 1, $filter, '{order} desc', $params);
        $sitePage = $sitePages->First();
        if(!$sitePage) {
            return Pages::StartOrder;
        }
        
        return $sitePage->order + Pages::StartOrder;

    }    

}
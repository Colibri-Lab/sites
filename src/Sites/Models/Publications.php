<?php

namespace App\Modules\Sites\Models;

use Colibri\Data\DataAccessPoint;
use Colibri\Data\SqlClient\IDataReader;
use Colibri\Data\Storages\Storages;
use Colibri\Data\Storages\Storage;
use Colibri\Data\Storages\Models\DataTable as BaseModelDataTable;
use App\Modules\Sites\Models\Publication;
use Colibri\Common\DateHelper;
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
class Publications extends BaseModelDataTable
{

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
    static function LoadByFilter(int $page = -1, int $pagesize = 20, string $filter = null, string $order = null, array $params = [], bool $calculateAffected = true): ? Publications
    {
        $storage = Storages::Instance()->Load('pubs', 'sites');
        return parent::_loadByFilter($storage, $page, $pagesize, $filter, $order, $params, $calculateAffected);

    }

    /**
     * Create table by any filters
     * @param int $page page
     * @param int $pagesize page size
     * @param ?array $filtersArray filters array|object
     * @param string $sortField sort field
     * @param string $sortOrder sort order, default asc
     * @return ?Publications
     */
    public static function LoadBy(
        int $page = -1, 
        int $pagesize = 20, 
        ?string $searchTerm = null,
        ?array $filtersArray = null,
        ?string $sortField = null,
        string $sortOrder = 'asc'
    ) : ?Publications
    {
        $storage = Storages::Instance()->Load('pubs', 'sites');
        [$filter, $order, $params] = $storage->accessPoint->ProcessFilters($storage, $searchTerm, $filtersArray, $sortField, $sortOrder);
        return parent::_loadByFilter($storage, $page, $pagesize, $filter, $order, $params);
    }

    /**
     * Загружает без фильтра
     * @param int $page страница
     * @param int $pagesize размер страницы
     * @return Publications 
     */
    static function LoadAll(int $page = -1, int $pagesize = 20, bool $calculateAffected = false): ? Publications
    {
        return self::LoadByFilter($page, $pagesize, null, '{order}', [], $calculateAffected);
    }

    /**
     * Возвращает модель по ID
     * @param int $id ID строки
     * @return Publication|null
     */
    static function LoadById(int $id): Publication|null
    {
        $table = self::LoadByFilter(1, 1, '{id}=[[id:integer]]', null, ['id' => $id], false);
        return $table && $table->Count() > 0 ? $table->First() : null;
    }

    /**
     * Возвращает модель по ID
     * @param int[] $ids ID строки
     * @return Publications
     */
    static function LoadByIds(array $ids): Publications
    {
        return self::LoadByFilter(-1, 20, '{id} in (' . implode(',', $ids) . ')', null, [], false);
    }

    /**
     * Загружает без фильтра
     * @param int $page страница
     * @param int $pagesize размер страницы
     * @return Publications 
     */
    static function LoadByPage(Domain|int $domain, Page|int $folder, ?string $term = '', int $page = -1, int $pagesize = 20, bool $calculateAffected = false): ? Publications
    {
        if (!is_numeric($domain)) {
            $domain = $domain->id;
        }
        if (!is_numeric($folder)) {
            $folder = $folder->id;
        }

        $params = ['domain' => $domain];
        if($folder !== 0) {
            $params['folder'] = $folder;
        }
        if ($term) {
            $params['term'] = '%' . $term . '%';
        }

        return self::LoadByFilter($page, $pagesize, 'pubs_domain=[[domain:integer]] and pubs_page' . ($folder !== 0 ? '=[[folder:integer]]' : ' is null') . ($term ? ' and {ft} like [[term:string]]' : ''), '{order}', $params, $calculateAffected);
    }

    /**
     * Создание модели по названию хранилища
     * @return Publication
     */
    static function LoadEmpty(): Publication
    {
        $pubs = self::LoadByFilter(-1, 20, 'false');
        return $pubs->CreateEmptyRow();
    }

    /**
     * Создание модели по названию хранилища
     * @return Publication
     */
    static function CreatePublication(Domain $domain, ? Page $page, DataRow $datarow): Publication
    {
        $pubs = self::LoadByFilter(-1, 20, 'false', null, [], false);
        $empty = $pubs->CreateEmptyRow();
        $empty->domain = $domain;
        $empty->page = $page ?: 0;
        $empty->storage = $datarow->Storage()->name;
        $empty->row = $datarow->id;
        $empty->order = Publications::NextPublicationOrder($page);
        return $empty;
    }


    static function NextPublicationOrder(? Page $page = null): float
    {
        // $pubs = Publications::LoadByFilter(1, 1, '{page}=[[page:integer]]', '{order} desc', ['page' => $page ? $page->id : 0], false);
        // $pub = $pubs->First();
        // if (!$pub) {
        //     return Publications::StartOrder;
        // }
        return microtime(true); // (int) $pub->order + Publications::StartOrder;
    }

    /**
     * Удаляет все по списку ID
     * @param int[] $ids ID строки
     * @return bool
     */
    static function DeleteAllByIds(array $ids): bool
    {
        return self::DeleteAllByFilter('{id} in (' . implode(',', $ids) . ')');
    }

    /**
     * Удаляет все по фильтру
     * @param string $filter фильтр, допускается использование элементов вида {field}
     * @return bool
     */
    static function DeleteAllByFilter(string $filter): bool
    {
        $storage = Storages::Instance()->Load('pubs');
        return self::DeleteByFilter($storage, $filter);
    }

    static function DeleteAllByPage(Page|int $page = 0): bool
    {
        return self::DeleteAllByFilter('{page}=' . ($page instanceof Page ? $page->id : $page));
    }

    static function DeleteAllByRow(DataRow $datarow): bool
    {
        return self::DeleteAllByFilter('{storage}=\'' . $datarow->Storage()->name . '\' and {row}=\'' . $datarow->id . '\'');
    }

    static function DeleteAllNotExistsInStorage(Storage|string $storage): bool
    {
        if (is_string($storage)) {
            $storage = Storages::Instance()->Load($storage);
        }
        return self::DeleteAllByFilter('{storage}=\'' . $storage->name . '\' and not {row} in (select ' . $storage->name . '_id from ' . $storage->table . ')');
    }

    static function DeleteAllByDomain(Domain|int $domain): bool
    {
        return self::DeleteAllByFilter('{domain}=' . ($domain instanceof Domain ? $domain->id : $domain));
    }

}
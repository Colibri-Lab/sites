<?php

namespace App\Modules\Sites\Models;

use Colibri\Data\DataAccessPoint;
use Colibri\Data\SqlClient\IDataReader;
use Colibri\Data\Storages\Storages;
use Colibri\Data\Storages\Storage;
use Colibri\Data\Storages\Models\DataTable as BaseModelDataTable;
use App\Modules\Sites\Models\Domain;

/**
 * Таблица, представление данных в хранилище Сайты
 * @author <author name and email>
 * @package App\Modules\Sites\Models
 * 
 * @method Domain[] getIterator()
 * @method Domain _createDataRowObject()
 * @method Domain _read()
 * 
 */
class Domains extends BaseModelDataTable
{

    /**
     * Конструктор
     * @param DataAccessPoint $point точка доступа
     * @param IDataReader|null $reader ридер
     * @param string|\Closure $returnAs возвращать в виде класса
     * @param Storage|null $storage хранилище
     * @return void 
     */
    public function __construct(DataAccessPoint $point, IDataReader $reader = null, string $returnAs = 'Domain', Storage|null $storage = null)
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
     * @return Domains
     */
    static function LoadByFilter(int $page = -1, int $pagesize = 20, string $filter = null, string $order = null, array $params = [], bool $calculateAffected = true): ? Domains
    {
        $storage = Storages::Create()->Load('domains');
        $additionalParams = ['page' => $page, 'pagesize' => $pagesize, 'params' => $params];
        $additionalParams['type'] = $calculateAffected ? DataAccessPoint::QueryTypeReader : DataAccessPoint::QueryTypeBigData;
        return self::LoadByQuery(
            $storage,
            'select * from ' . $storage->name .
            ($filter ? ' where ' . $filter : '') .
            ($order ? ' order by ' . $order : ''),
            $additionalParams
        );

    }

    /**
     * Загружает без фильтра
     * @param int $page страница
     * @param int $pagesize размер страницы
     * @return Domains 
     */
    static function LoadAll(int $page = -1, int $pagesize = 20, bool $calculateAffected = false): ? Domains
    {
        return self::LoadByFilter($page, $pagesize, null, null, [], $calculateAffected);
    }

    /**
     * Возвращает модель по ID
     * @param int $id ID строки
     * @return Domain|null
     */
    static function LoadById(int $id): Domain|null
    {
        $table = self::LoadByFilter(1, 1, '{id}=[[id:integer]]', null, ['id' => $id], false);
        return $table && $table->Count() > 0 ? $table->First() : null;
    }

    /**
     * Возвращает модель наименованию
     * @param string $name
     * @return Domain|null
     */
    static function LoadByName(string $name): Domain|null
    {
        $table = self::LoadByFilter(1, 1, '{name}=[[name:string]]', null, ['name' => $name]);
        return $table && $table->Count() > 0 ? $table->First() : null;
    }

    /**
     * Возвращает модель домену
     * @param string $domain
     * @return Domain|null
     */
    static function LoadByDomain(string $domain): Domain|null
    {
        $table = self::LoadAll();
        foreach ($table as $d) {
            /** @var Domain $d */
            $list = $d->domains;
            foreach ($list as $dd) {
                $res = preg_match('/' . $dd . '/', $domain, $matches);
                if ($res > 0) {
                    return $d;
                }
            }
        }
        return null;
    }


    /**
     * Создание модели по названию хранилища
     * @return Domain
     */
    static function LoadEmpty(): Domain
    {
        $table = self::LoadByFilter(-1, 20, 'false');
        return $table->CreateEmptyRow();
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
        if (!self::DeleteByFilter('domains', $filter)) {
            return false;
        }
        return Pages::DeleteAllByFilter($filter);
    }

}
<?php


/**
 * Search
 *
 * @author Author Name <author.name@action-media.ru>
 * @copyright 2019 Colibri
 * @package App\Modules\Sites
 */
namespace App\Modules\Sites;

use Colibri\App;
use Colibri\Modules\Module as BaseModule;
use Colibri\Utils\Debug;
use App\Modules\Sites\Controllers\Controller;
use Colibri\Utils\Menu\Item;
use Colibri\Data\Storages\Storages;

/**
 * Описание модуля
 * @package App\Modules\Sites
 * 
 * 
 */
class Module extends BaseModule
{

    /**
     * Синглтон
     *
     * @var Module
     */
    public static $instance = null;


    /**
     * Инициализация модуля
     * @return void
     */
    public function InitializeModule(): void
    {
        self::$instance = $this;
    }

	/**
	 * Вызывается для получения Меню болванкой
	 */
    public function GetTopmostMenu(): Item|array|null {

        return [
            Item::Create('struct', '#{mainframe-menu-struct;Структура}', '', 'App.Modules.MainFrame.Icons.StructureIcon', '')->Add([
                Item::Create('structure', '#{sites-menu-struct;Структура сайта}', '#{sites-menu-struct-desc;Структура проекта, папки и конечные страницы, публикация данных}', 'App.Modules.Sites.Icons.FoldersIcon', 'App.Modules.Sites.StructurePage'),
                Item::Create('data', '#{sites-menu-storagesdata;Материалы}', '#{sites-menu-storagesdata-desc;Редактор материалов, которые содержатся в хранилищах данных}', 'App.Modules.Sites.Icons.StoragesIcon', 'App.Modules.Sites.DataPage'),
            ]),
            Item::Create('dev', '#{mainframe-menu-dev;Разработка}', '', 'App.Modules.MainFrame.Icons.DevIcon', '')->Add([
                Item::Create('storages', '#{sites-menu-storages;Хранилища}', '#{sites-menu-storages-desc;Редактор хранилищ данных. Создавайте хранилища для материалов используя удобный интерфейс}', 'App.Modules.Sites.Icons.StoragesManageIcon', 'App.Modules.Sites.StoragesPage'),
                // Item::Create('sources', 'Источники данных', 'Создайте справочники. Внимание! Справочник - это не хранилище, таблица для хранения данных должна уже существовать', '', 'Sites.RouteTo("/sources/")')
            ])
        ];

    }

	public function GetPermissions(): array
    {

        $permissions = parent::GetPermissions();

        $permissions['sites'] = 'Инструменты';
        $permissions['sites.structure'] = 'Доступ к редактору страниц и публикаций';
        $permissions['sites.structure.add'] = 'Создать страницу';
        $permissions['sites.structure.edit'] = 'Редактировать страницу';
        $permissions['sites.structure.remove'] = 'Удалить страницу';
        $permissions['sites.structure.pubs'] = 'Список публикаций';
        $permissions['sites.structure.pubs.add'] = 'Создать публикацию';
        $permissions['sites.structure.pubs.remove'] = 'Удалить публикацию';

        $permissions['sites.storages'] = 'Доступ к редактору хранилищь';
        $permissions['sites.storages.add'] = 'Создать хранилище';
        $permissions['sites.storages.edit'] = 'Редактировать хранилище';
        $permissions['sites.storages.remove'] = 'Удалить хранилище';

        $storages = Storages::Create()->GetStorages();
        foreach($storages as $storage) {
            if( ($storage->params['visible'] ?? true) === false ) {
                continue;
            }
            
            $permissions['sites.storages.'.$storage->name] = 'Доступ к хранилищу «'.$storage->desc.'»';
            $permissions['sites.storages.'.$storage->name.'.list'] = 'Просматривать список строк';
            $permissions['sites.storages.'.$storage->name.'.fields'] = 'Редактировать хранилище';
            $permissions['sites.storages.'.$storage->name.'.indices'] = 'Индексировать строки';
            $permissions['sites.storages.'.$storage->name.'.add'] = 'Добавить строку';
            $permissions['sites.storages.'.$storage->name.'.edit'] = 'Редактировать строку';
            $permissions['sites.storages.'.$storage->name.'.remove'] = 'Удалить строку';
            $permissions['sites.storages.'.$storage->name.'.export'] = 'Экспорт строк';
            $permissions['sites.storages.'.$storage->name.'.import'] = 'Импорт строк';
        }

        $permissions['sites.references'] = 'Доступ к редактору справочников';


        return $permissions;
    }

}

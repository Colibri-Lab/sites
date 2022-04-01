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
            Item::Create('struct', 'Структура', '', 'green', false, '')
                ->Add([
                    Item::Create('sites', 'Сайты и разделы', '', '', false, '')->Add([
                        Item::Create('structure', 'Структура сайта', 'Структура проекта, папки и конечные страницы, публикация данных', '', true, 'Sites.RouteTo("/sites/structure/")'),
                        Item::Create('storages', 'Материалы', 'Редактор материалов, которые содержатся в хранилищах данных', '', false, 'Sites.RouteTo("/sites/storages/")'),
                        Item::Create('references', 'Справочники', 'Справочники, ', 'Редактор справочников. Страны, города и т.д.', false, 'Sites.RouteTo("/sites/references/")'),
                    ])
                ],
            ),
            Item::Create('dev', 'Разработка', '', 'orange', false, '')->Add([
                Item::Create('sites', 'Данные', '', '', false, '')->Add([
                    Item::Create('storages', 'Хранилища', 'Редактор хранилищ данных. Создавайте хранилища для материалов используя удобный интерфейс', '', true, 'Sites.RouteTo("/settings/data/storages/")'),
                    Item::Create('sources', 'Источники данных', 'Создайте справочники. Внимание! Справочник - это не хранилище, таблица для хранения данных должна уже существовать', '', true, 'Sites.RouteTo("/settings/data/sources/")')
                ]),
            ])
        ];

    }

	public function GetPermissions(): array
    {

        $permissions = parent::GetPermissions();

        $permissions['sites'] = 'Инструменты';
        $permissions['sites.backup'] = 'Доступ к системе восстановления';
        $permissions['sites.backup.create'] = 'Создание точки восстановления';
        $permissions['sites.backup.restore'] = 'Восстановление из точки';
        $permissions['sites.execute'] = 'Выполнение скриптов';

        return $permissions;
    }

}

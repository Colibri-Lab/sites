<?php


/**
 * Sites and folders support module package
 *
 * @author Author Name <author.name@action-media.ru>
 * @copyright 2019 Colibri
 * @package App\Modules\Sites
 */
namespace App\Modules\Sites;

use Colibri\Modules\Module as BaseModule;
use Colibri\Utils\Menu\Item;
use Colibri\Data\Storages\Storages;
use Colibri\Utils\Logs\Logger;
use App\Modules\Sites\Models\Domains;
use App\Modules\Sites\Models\Pages;
use App\Modules\Sites\Models\Publications;
use App\Modules\Sites\Models\Texts;

/**
 * Sites and folders support module
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
     * Initializes a module
     * @return void
     */
    public function InitializeModule(): void
    {
        self::$instance = $this;
    }

    /**
     * Returns a topmost menu for backend
     */
    public function GetTopmostMenu(): Item|array |null
    {

        return [
            Item::Create('struct', '#{mainframe-menu-struct}', '', 'App.Modules.MainFrame.Icons.StructureIcon', '')->Add([
                Item::Create('structure', '#{sites-menu-struct}', '#{sites-menu-struct-desc}', 'App.Modules.Sites.Icons.FoldersIcon', 'App.Modules.Sites.StructurePage'),
                Item::Create('data', '#{sites-menu-storagesdata}', '#{sites-menu-storagesdata-desc}', 'App.Modules.Sites.Icons.StoragesIcon', 'App.Modules.Sites.DataPage'),
            ]),
            Item::Create('dev', '#{mainframe-menu-dev}', '', 'App.Modules.MainFrame.Icons.DevIcon', '')->Add([
                Item::Create('storages', '#{sites-menu-storages}', '#{sites-menu-storages-desc}', 'App.Modules.Sites.Icons.StoragesManageIcon', 'App.Modules.Sites.StoragesPage'),
                // Item::Create('sources', 'Источники данных', 'Создайте справочники. Внимание! Справочник - это не хранилище, таблица для хранения данных должна уже существовать', '', 'Sites.RouteTo("/sources/")')

            ])
        ];

    }

    /**
     * Returns a permissions for module
     * @return array
     */
    public function GetPermissions(): array
    {

        $permissions = parent::GetPermissions();

        $permissions['sites'] = '#{sites-permissions}';
        $permissions['sites.structure'] = '#{sites-structure-permissions}';
        $permissions['sites.structure.add'] = '#{sites-structure-addpage-permissions}';
        $permissions['sites.structure.edit'] = '#{sites-structure-editpage-permissions}';
        $permissions['sites.structure.remove'] = '#{sites-structure-deletepage-permissions}';
        $permissions['sites.structure.pubs'] = '#{sites-structure-pubslist-permissions}';
        $permissions['sites.structure.pubs.add'] = '#{sites-structure-pubsadd-permissions}';
        $permissions['sites.structure.pubs.remove'] = '#{sites-structure-pubsdelete-permissions}';

        $permissions['sites.storages'] = '#{sites-storages-permissions}';
        $permissions['sites.storages.add'] = '#{sites-structure-addstorage-permissions}';
        $permissions['sites.storages.edit'] = '#{sites-structure-editstorage-permissions}';
        $permissions['sites.storages.remove'] = '#{sites-structure-deletestorage-permissions}';

        $storages = Storages::Create()->GetStorages();
        foreach ($storages as $storage) {
            if (($storage->{'params'}['visible'] ?? true) === false) {
                continue;
            }

            $permissions['sites.storages.' . $storage->name] = '#{sites-storage-permissions} «' . $storage->{'desc'} . '»';
            $permissions['sites.storages.' . $storage->name . '.list'] = '#{sites-storage-list-permissions}';
            $permissions['sites.storages.' . $storage->name . '.fields'] = '#{sites-storage-fields-permissions}';
            $permissions['sites.storages.' . $storage->name . '.indices'] = '#{sites-storage-indices-permissions}';
            $permissions['sites.storages.' . $storage->name . '.add'] = '#{sites-storage-add-permissions}';
            $permissions['sites.storages.' . $storage->name . '.edit'] = '#{sites-storage-edit-permissions}';
            $permissions['sites.storages.' . $storage->name . '.remove'] = '#{sites-storage-delete-permissions}';
            $permissions['sites.storages.' . $storage->name . '.export'] = '#{sites-storage-export-permissions}';
            $permissions['sites.storages.' . $storage->name . '.import'] = '#{sites-storage-import-permissions}';
        }

        $permissions['sites.references'] = '#{sites-references-permissions}';


        return $permissions;
    }

    /**
     * Backups module data
     * @param Logger $logger
     * @param string $path
     * @return void
     */
    public function Backup(Logger $logger, string $path)
    {
        // Do nothing        

        $logger->debug('Exporting data...');

        $modulePath = $path . 'modules/Sites/';

        $logger->debug('Exporting Domains...');
        $table = Domains::LoadAll();
        $table->ExportJson($modulePath . 'domains.json');

        $logger->debug('Exporting Pages...');
        $table = Pages::LoadAll();
        $table->ExportJson($modulePath . 'pages.json');

        $logger->debug('Exporting Publications...');
        $table = Publications::LoadAll();
        $table->ExportJson($modulePath . 'publications.json');

        $logger->debug('Exporting Texts...');
        $table = Texts::LoadAll();
        $table->ExportJson($modulePath . 'texts.json');

    }

}
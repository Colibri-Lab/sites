<?php


namespace App\Modules\Sites;

class Installer
{
    private static function _loadConfig($file): ?array
    {
        return yaml_parse_file($file);
    }

    private static function _saveConfig($file, $config): void
    {
        yaml_emit_file($file, $config, \YAML_UTF8_ENCODING, \YAML_ANY_BREAK);
    }

    private static function _getMode($file): string
    {
        $appConfig = self::_loadConfig($file);
        return $appConfig['mode'];
    }

    private static function _injectIntoModuleConfig($file): void
    {

        $modules = self::_loadConfig($file);
        if(is_array($modules['entries'])) {
            foreach($modules['entries'] as $entry) {
                if($entry['name'] === 'Sites') {
                    return;
                }
            }
        }
        else {
            $modules['entries'] = [];
        }

        $modules['entries'][] = [
            'name' => 'Sites',
            'entry' => '\Sites\Module',
            'desc' => 'Модуль создания простых сайтов',
            'enabled' => true,
            'visible' => true,
            'for' => [],
            'config' => 'include(/config/sites.yaml)'
        ];

        self::_saveConfig($file, $modules);

    }
    private static function _copyOrSymlink($mode, $pathFrom, $pathTo, $fileFrom, $fileTo): void 
    {
        print_r('Копируем '.$mode.' '.$pathFrom.' '.$pathTo.' '.$fileFrom.' '.$fileTo."\n");
        if(!file_exists($pathFrom.$fileFrom)) {
            print_r('Файл '.$pathFrom.$fileFrom.' не существует'."\n");
            return;
        }

        if(file_exists($pathTo.$fileTo)) {
            print_r('Файл '.$pathTo.$fileTo.' существует'."\n");
            return;
        }

        if($mode === 'local') {
            shell_exec('ln -s '.realpath($pathFrom.$fileFrom).' '.$pathTo.($fileTo != $fileFrom ? $fileTo : ''));
        }
        else {
            shell_exec('cp -R '.realpath($pathFrom.$fileFrom).' '.$pathTo.$fileTo);
        }

        // если это исполняемый скрипт
        if(strstr($pathTo.$fileTo, '/bin/') !== false) {
            chmod($pathTo.$fileTo, 0777);
        }
    }


    /**
     *
     * @param PackageEvent $event
     * @return void
     */
    public static function PostPackageInstall($event)
    {

        print_r('Установка и настройка модуля Colibri Sites Module'."\n");

        $vendorDir = $event->getComposer()->getConfig()->get('vendor-dir').'/';
        $operation = $event->getOperation();
        $installedPackage = $operation->getPackage();
        $targetDir = $installedPackage->getName();
        $path = $vendorDir.$targetDir;
        $configPath = $path.'/src/Sites/config-template/';
        $configDir = './config/';

        if(!file_exists($configDir.'app.yaml')) {
            print_r('Не найден файл конфигурации app.yaml'."\n");
            return;
        }

        // берем точку входа
        $webRoot = \getenv('COLIBRI_WEBROOT');
        if(!$webRoot) {
            $webRoot = 'web'; 
        }
        $permanent = \getenv('COLIBRI_PERMANENT');
        if(!$permanent) {
            $permanent = 'res/'; 
        }
        $mode = self::_getMode($configDir.'app.yaml');

        // копируем конфиг
        print_r('Копируем файлы конфигурации'."\n");
        self::_copyOrSymlink($mode, $configPath, $configDir, 'module-'.$mode.'.yaml', 'sites.yaml');
        self::_copyOrSymlink($mode, $configPath, $configDir, 'sites-storages.yaml', 'sites-storages.yaml');
        self::_copyOrSymlink($mode, $configPath, $configDir, 'sites-langtexts.yaml', 'sites-langtexts.yaml');

        print_r('Встраиваем модуль'."\n");
        self::_injectIntoModuleConfig($configDir.'modules.yaml');

        print_r('Установка скриптов'."\n");
        self::_copyOrSymlink($mode, $path.'/src/Sites/bin/', './bin/', 'sites-migrate.sh', 'sites-migrate.sh');
        self::_copyOrSymlink($mode, $path.'/src/Sites/bin/', './bin/', 'sites-models-generate.sh', 'sites-models-generate.sh');

        print_r('Установка завершена'."\n");

    }
}

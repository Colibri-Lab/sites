<?php


namespace App\Modules\Sites;

class Installer
{

    /**
     *
     * @param PackageEvent $event
     * @return void
     */
    public static function PostPackageInstall($event)
    {

        print_r('Установка и настройка модуля Colibri Sites Module'."\n");

        $vendorDir = $event->getComposer()->getConfig()->get('vendor-dir').'/';
        $configDir = './config/';

        if(!file_exists($configDir.'app.yaml')) {
            print_r('Не найден файл конфигурации app.yaml'."\n");
            return;
        }

        $mode = 'dev';
        $appYamlContent = file_get_contents($configDir.'app.yaml');
        if(preg_match('/mode: (\w+)/', $appYamlContent, $matches) >=0 ) {
            $mode = $matches[1];
        }

        $operation = $event->getOperation();
        $installedPackage = $operation->getPackage();
        $targetDir = $installedPackage->getName();
        $path = $vendorDir.$targetDir;

        // копируем конфиг
        print_r('Копируем файл конфигурации'."\n");
        $configPath = $path.'/src/Sites/config-template/module-'.$mode.'.yaml';
        $configTargetPath = $configDir.'sites.yaml';
        if(file_exists($configTargetPath)) {
            print_r('Файл конфигурации найден, пропускаем настройку'."\n");
            return;
        }
        if($mode === 'local') {
            symlink($configPath, $configTargetPath);
        }
        else {
            copy($configPath, $configTargetPath);
        }

        // нужно прописать в модули
        $modulesTargetPath = $configDir.'modules.yaml';
        $modulesConfigContent = file_get_contents($modulesTargetPath);
        if(strstr($modulesConfigContent, '- name: Sites') !== false) {
            print_r('Модуль сконфигурирован, пропускаем'."\n");
            return;
        }

        $modulesConfigContent = $modulesConfigContent.'
  - name: Sites
    entry: \Sites\Module
    enabled: true
    config: include(/config/sites.yaml)';
        file_put_contents($modulesTargetPath, $modulesConfigContent);

        print_r('Установка скриптов'."\n");
        $scriptsPath = $path.'/src/Sites/bin/';
        $binDir = './bin/';

        if($mode === 'local') {
            symlink($scriptsPath.'sites-migrate.sh', $binDir.'sites-migrate.sh');
            symlink($scriptsPath.'sites-models-generate.sh', $binDir.'sites-models-generate.sh');
        }
        else {
            copy($scriptsPath.'sites-migrate.sh', $binDir.'sites-migrate.sh');
            copy($scriptsPath.'sites-models-generate.sh', $binDir.'sites-models-generate.sh');
        }
        print_r('Установка завершена'."\n");

    }
}

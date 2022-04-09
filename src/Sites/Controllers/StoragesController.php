<?php

namespace App\Modules\Sites\Controllers;


use Colibri\App;
use Colibri\Events\EventsContainer;
use Colibri\IO\FileSystem\File;
use Colibri\Utils\Cache\Bundle;
use Colibri\Utils\Debug;
use Colibri\Utils\ExtendedObject;
use Colibri\Web\RequestCollection;
use Colibri\Web\Controller as WebController;
use Colibri\Web\Templates\PhpTemplate;
use Colibri\Web\View;
use ScssPhp\ScssPhp\Compiler;
use ScssPhp\ScssPhp\OutputStyle;
use App\Modules\Sites\Models\Pages;
use App\Modules\Security\Module as SecurityModule;
use App\Modules\Sites\Module;
use Colibri\Data\Models\DataModelException;
use App\Modules\Sites\Models\Publications;
use Colibri\Data\Storages\Storages;
use Colibri\Utils\Config\Config;

class StoragesController extends WebController
{

    public function Save(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {
        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        $module = $post->module;
        if(!$module) {
            return $this->Finish(400, 'Bad request');
        }

        $data = $post->data;
        $isSave = Storages::Create()->Load($data['name']) !== null;
        if(!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.'.($isSave ? '.edit' : '.add'))) {
            return $this->Finish(403, 'Permission denied');
        }

        $moduleObject = App::$moduleManager->$module;
        if(!$moduleObject) {
            return $this->Finish(400, 'Bad request');
        }

        $configPath = $moduleObject->moduleStoragesPath;
        $config = Config::LoadFile($configPath);
        if($isSave) {
            try {
                $storage = $config->Query($data['name'])->AsArray();
            }
            catch(\Throwable $e) {
                return $this->Finish(400, 'Bad request');
            }

            $name = $data['name'];
            unset($data['name']);
            unset($data['path']);

            unset($data['module']);
            foreach($data as $key => $value) {
                $storage[$key] = $value;
            }
            $storage['module'] = $module;

            try {
                $config->Set($name, $storage);
            }
            catch(\Throwable $e) {
                return $this->Finish(400, 'Bad request');
            }

            $config->Save($configPath);
    
        }
        else {
            $name = $data['name'];
            $data->module = $module;
            unset($data->name);
            try {
                $config->Set($name, (array)$data); 
            }
            catch(\Throwable $e) {
                return $this->Finish(400, 'Bad request');
            }
        }
        
        

        return $this->Finish(200, 'ok');

    }

    public function Delete(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {
        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        $storage = $post->storage;
        $data = (object)$post->data;
        $pub = $post->pub;

        if(!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.'.$storage.($data->id ?? 0 ? '.edit' : '.add'))) {
            return $this->Finish(403, 'Permission denied');
        }


        $storage = Storages::Create()->Load($storage);
        [$tableClass, $rowClass] = $storage->GetModelClasses();
        
        if($data->id ?? 0) {
            $datarow = $tableClass::LoadById($data->id);
            if(!$datarow) {
                return $this->Finish(400, 'Bad request');
            }    
        }
        else {
            $datarow = $tableClass::LoadEmpty();
        }

        foreach($data as $key => $value) {
            $datarow->$key = $value;
        }

        $datarow->Save();

        if($pub) {
            $pub = Publications::LoadById($pub);
            $pub->Save();
            $pub = $pub->ToArray(true);
        }
        
        return $this->Finish(200, 'ok', ['datarow' => $datarow->ToArray(true), 'pub' => $pub]);

    }

    public function SaveField(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {

        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if(!SecurityModule::$instance->current->IsCommandAllowed('sites.structure.pubs.add')) {
            return $this->Finish(403, 'Permission denied');
        }

        $storage = $post->storage;
        if(!$storage) {
            return $this->Finish(400, 'Bad request');
        }
        
        if(!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.'.$storage.'.remove')) {
            return $this->Finish(403, 'Permission denied');
        }

        $ids = $post->ids;
        if(!$ids) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = Storages::Create()->Load($storage);
        [$tableClass, $rowClass] = $storage->GetModelClasses();

        $tableClass::DeleteAllByIds(explode(',', $ids));

        return $this->Finish(200, 'ok');
    }

    public function SaveDelete(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {

        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if(!SecurityModule::$instance->current->IsCommandAllowed('sites.structure.pubs.add')) {
            return $this->Finish(403, 'Permission denied');
        }

        $storage = $post->storage;
        if(!$storage) {
            return $this->Finish(400, 'Bad request');
        }
        
        if(!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.'.$storage.'.remove')) {
            return $this->Finish(403, 'Permission denied');
        }

        $ids = $post->ids;
        if(!$ids) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = Storages::Create()->Load($storage);
        [$tableClass, $rowClass] = $storage->GetModelClasses();

        $tableClass::DeleteAllByIds(explode(',', $ids));

        return $this->Finish(200, 'ok');
    }

    public function SaveIndex(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {

        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if(!SecurityModule::$instance->current->IsCommandAllowed('sites.structure.pubs.add')) {
            return $this->Finish(403, 'Permission denied');
        }

        $storage = $post->storage;
        if(!$storage) {
            return $this->Finish(400, 'Bad request');
        }
        
        if(!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.'.$storage.'.remove')) {
            return $this->Finish(403, 'Permission denied');
        }

        $ids = $post->ids;
        if(!$ids) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = Storages::Create()->Load($storage);
        [$tableClass, $rowClass] = $storage->GetModelClasses();

        $tableClass::DeleteAllByIds(explode(',', $ids));

        return $this->Finish(200, 'ok');
    }

    public function DeleteIndex(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {

        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if(!SecurityModule::$instance->current->IsCommandAllowed('sites.structure.pubs.add')) {
            return $this->Finish(403, 'Permission denied');
        }

        $storage = $post->storage;
        if(!$storage) {
            return $this->Finish(400, 'Bad request');
        }
        
        if(!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.'.$storage.'.remove')) {
            return $this->Finish(403, 'Permission denied');
        }

        $ids = $post->ids;
        if(!$ids) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = Storages::Create()->Load($storage);
        [$tableClass, $rowClass] = $storage->GetModelClasses();

        $tableClass::DeleteAllByIds(explode(',', $ids));

        return $this->Finish(200, 'ok');
    }


}
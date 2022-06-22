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
use Colibri\Data\Storages\Storage;
use Colibri\Data\Storages\Fields\Field;

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

        
        $moduleObject = App::$moduleManager->$module;
        if(!$moduleObject) {
            return $this->Finish(400, 'Bad request');
        }


        $data = $post->data;
        $storage = Storages::Create()->Load($data['name']);
        if(!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.'.($storage != null ? '.edit' : '.add'))) {
            return $this->Finish(403, 'Permission denied');
        }

        $name = $data['name'];
        unset($data['name']);

        // если есть мультиязыковая поддержка
        if(App::$moduleManager->lang) {
            // desc, note
            $currentLang = App::$moduleManager->lang->current;
            
            App::$moduleManager->lang->Save(strtolower($module) . '-storages-' . $name . '-desc.' . $currentLang, $data['desc']);
            $data['desc'] = '#{' . strtolower($module) . '-storages-' . $name . '-desc;'.$data['desc'].'}';

        }

        $data['module'] = $module;
        if(!$storage) {
            $storage = Storage::Create($moduleObject, $name, $data);
        }
        else {
            foreach($data as $key => $value) {
                $storage->$key = $value;
            }
        }

        $storage->Save();


        return $this->Finish(200, 'ok');

    }

    public function Delete(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {
        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if(!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.remove')) {
            return $this->Finish(403, 'Permission denied');
        }

        
        $module = $post->module;
        if(!$module) {
            return $this->Finish(400, 'Bad request');
        }
        
        $moduleObject = App::$moduleManager->$module;
        if(!$moduleObject) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = $post->storage;
        if(!$storage) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = Storages::Create()->Load($storage);
        if(!$storage) {
            return $this->Finish(400, 'Bad request');
        }

        $storage->Delete();
        
        return $this->Finish(200, 'ok');

    }

    public function SaveField(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {

        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        $module = $post->module;
        if(!$module) {
            return $this->Finish(400, 'Bad request');
        }
        
        $moduleObject = App::$moduleManager->$module;
        if(!$moduleObject) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = $post->storage;
        if(!$storage) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = Storages::Create()->Load($storage);
        if(!$storage) {
            return $this->Finish(400, 'Bad request');
        }

        $data = $post->data;
        $path = $post->path;

        $field = $storage->GetField($path);
        
        if(!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.'.$storage->name.'.fields')) {
            return $this->Finish(403, 'Permission denied');
        }

        // если есть мультиязыковая поддержка
        if(App::$moduleManager->lang) {
            // desc, note
            $currentLang = App::$moduleManager->lang->current;
            
            App::$moduleManager->lang->Save(strtolower($module) . '-storages-' . $storage->name . '-fields-' . str_replace('/', '-', $path) . '-desc.' . $currentLang, $data['desc']);
            $data['desc'] = '#{' . strtolower($module) . '-storages-' . $storage->name . '-fields-' . str_replace('/', '-', $path) . '-desc;'.$data['desc'].'}';

            if(!$data['note']) {
                $data['note'] = null;
            }
            try {
                App::$moduleManager->lang->Save(strtolower($module) . '-storages-' . $storage->name . '-fields-' . str_replace('/', '-', $path) . '-note.' . $currentLang, $data['note']);
            }
            catch(\Throwable $e) {
                
            }
            $data['note'] && $data['note'] = '#{' . strtolower($module) . '-storages-' . $storage->name . '-fields-' . str_replace('/', '-', $path) . '-note;'.$data['note'].'}';

        }

        if($field) {
            // добавляем
            $field->UpdateData($data);
        }
        else {
            $storage->AddField($path, $data);
        }

        $storage->Save();

        return $this->Finish(200, 'ok');
    }
    public function MoveField(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {

        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        $module = $post->module;
        if(!$module) {
            return $this->Finish(400, 'Bad request');
        }
        
        $moduleObject = App::$moduleManager->$module;
        if(!$moduleObject) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = $post->storage;
        if(!$storage) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = Storages::Create()->Load($storage);
        if(!$storage) {
            return $this->Finish(400, 'Bad request');
        }

        
        $move = $post->move;
        $relative = $post->relative;
        $sibling = $post->sibling;

        $move = $storage->GetField($move);
        $relative = $storage->GetField($relative);
        
        if(!$move || !$relative) {
            return $this->Finish(400, 'Bad request');
        }

        if(!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.'.$storage->name.'.fields')) {
            return $this->Finish(403, 'Permission denied');
        }

        $parentField = $move->parent;
        if(!$parentField) {
            $parentField = $storage;
        }

        $parentField->MoveField($move, $relative, $sibling);

        $storage->Save();

        return $this->Finish(200, 'ok');
    }
    public function DeleteField(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {

        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        $module = $post->module;
        if(!$module) {
            return $this->Finish(400, 'Bad request');
        }
        
        $moduleObject = App::$moduleManager->$module;
        if(!$moduleObject) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = $post->storage;
        if(!$storage) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = Storages::Create()->Load($storage);
        if(!$storage) {
            return $this->Finish(400, 'Bad request');
        }

        $path = $post->path;

        if(!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.'.$storage->name.'.fields')) {
            return $this->Finish(403, 'Permission denied');
        }

        $storage->DeleteField($path);
        $storage->Save();

        return $this->Finish(200, 'ok');
    }

    public function SaveIndex(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {

        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        $module = $post->module;
        if(!$module) {
            return $this->Finish(400, 'Bad request');
        }
        
        $moduleObject = App::$moduleManager->$module;
        if(!$moduleObject) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = $post->storage;
        if(!$storage) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = Storages::Create()->Load($storage);
        if(!$storage) {
            return $this->Finish(400, 'Bad request');
        }

        $data = $post->data;

        if(!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.'.$storage->name.'.indices')) {
            return $this->Finish(403, 'Permission denied');
        }

        $name = $data['name'];
        unset($data['name']);
        $storage->AddIndex($name, $data);
        $storage->Save();

        return $this->Finish(200, 'ok');
    }

    public function DeleteIndex(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {

        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        $module = $post->module;
        if(!$module) {
            return $this->Finish(400, 'Bad request');
        }
        
        $moduleObject = App::$moduleManager->$module;
        if(!$moduleObject) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = $post->storage;
        if(!$storage) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = Storages::Create()->Load($storage);
        if(!$storage) {
            return $this->Finish(400, 'Bad request');
        }

        $name = $post->index;
        if(!$name) {
            return $this->Finish(400, 'Bad request');
        }

        if(!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.'.$storage->name.'.indices')) {
            return $this->Finish(403, 'Permission denied');
        }

        $storage->DeleteIndex($name);
        $storage->Save();

        return $this->Finish(200, 'ok');
    }


}
<?php

namespace App\Modules\Sites\Controllers;


use Colibri\App;
use Colibri\Web\RequestCollection;
use Colibri\Web\Controller as WebController;
use App\Modules\Security\Module as SecurityModule;
use Colibri\Data\Storages\Storages;
use Colibri\Data\Storages\Storage;

class StoragesController extends WebController
{

    public function Save(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {
        if (!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        $module = $post->module;
        if (!$module) {
            return $this->Finish(400, 'Bad request');
        }

        $moduleObject = App::$moduleManager->$module;
        if (!$moduleObject) {
            return $this->Finish(400, 'Bad request');
        }

        $data = $post->data;
        $storage = Storages::Create()->Load($data['name']);
        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.' . ($storage != null ? '.edit' : '.add'))) {
            return $this->Finish(403, 'Permission denied');
        }

        $name = $data['name'];
        unset($data['name']);

        // если есть мультиязыковая поддержка
        if (App::$moduleManager->lang) {
            // desc, note
            $currentLang = App::$moduleManager->lang->current;

            App::$moduleManager->lang->Save(strtolower($module) . '-storages-' . $name . '-desc.' . $currentLang, $data['desc']);
            $data['desc'] = '#{' . strtolower($module) . '-storages-' . $name . '-desc;' . $data['desc'] . '}';

            App::$moduleManager->lang->Save(strtolower($module) . '-storages-' . $name . '-group.' . $currentLang, $data['group']);
            $data['group'] = '#{' . strtolower($module) . '-storages-' . $name . '-group;' . $data['group'] . '}';

        }

        $data['module'] = $module;
        if (!$storage) {
            $storage = Storage::Create($moduleObject, $name, $data);
        } else {
            foreach ($data as $key => $value) {
                $storage->$key = $value;
            }
        }

        $storage->Save();


        return $this->Finish(200, 'ok');

    }

    public function Delete(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {
        if (!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.remove')) {
            return $this->Finish(403, 'Permission denied');
        }


        $module = $post->module;
        if (!$module) {
            return $this->Finish(400, 'Bad request');
        }

        $moduleObject = App::$moduleManager->$module;
        if (!$moduleObject) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = $post->storage;
        if (!$storage) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = Storages::Create()->Load($storage);
        if (!$storage) {
            return $this->Finish(400, 'Bad request');
        }

        $storage->Delete();

        return $this->Finish(200, 'ok');

    }

    public function SaveField(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {

        if (!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        $module = $post->module;
        if (!$module) {
            return $this->Finish(400, 'Bad request');
        }

        $moduleObject = App::$moduleManager->$module;
        if (!$moduleObject) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = $post->storage;
        if (!$storage) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = Storages::Create()->Load($storage);
        if (!$storage) {
            return $this->Finish(400, 'Bad request');
        }

        $data = $post->data;
        $path = $post->path;

        $field = $storage->GetField($path);

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.' . $storage->name . '.fields')) {
            return $this->Finish(403, 'Permission denied');
        }

        // если есть мультиязыковая поддержка
        if (App::$moduleManager->lang) {
            // desc, note
            $currentLang = App::$moduleManager->lang->current;

            App::$moduleManager->lang->Save(strtolower($module) . '-storages-' . $storage->name . '-fields-' . str_replace('/', '-', $path) . '-desc.' . $currentLang, $data['desc']);
            $data['desc'] = '#{' . strtolower($module) . '-storages-' . $storage->name . '-fields-' . str_replace('/', '-', $path) . '-desc;' . $data['desc'] . '}';

            if (!$data['note']) {
                $data['note'] = null;
            }

            try {
                App::$moduleManager->lang->Save(strtolower($module) . '-storages-' . $storage->name . '-fields-' . str_replace('/', '-', $path) . '-note.' . $currentLang, $data['note']);
            } catch (\Throwable $e) {
            }
            $data['note'] && $data['note'] = '#{' . strtolower($module) . '-storages-' . $storage->name . '-fields-' . str_replace('/', '-', $path) . '-note;' . $data['note'] . '}';

            if (isset($data['group']) && $data['group'] !== 'window') {
                App::$moduleManager->lang->Save(strtolower($module) . '-storages-' . $storage->name . '-fields-' . str_replace('/', '-', $path) . '-group.' . $currentLang, $data['group']);
                $data['group'] = '#{' . strtolower($module) . '-storages-' . $storage->name . '-fields-' . str_replace('/', '-', $path) . '-group;' . $data['group'] . '}';
            }

            if (isset($data['params'])) {

                if ($data['params']['addlink'] ?? '') {
                    App::$moduleManager->lang->Save(strtolower($module) . '-storages-' . $storage->name . '-fields-' . str_replace('/', '-', $path) . '-params-addlink.' . $currentLang, $data['params']['addlink']);
                    $data['params']['addlink'] = '#{' . strtolower($module) . '-storages-' . $storage->name . '-fields-' . str_replace('/', '-', $path) . '-params-addlink;' . $data['params']['addlink'] . '}';
                }

                if ($data['params']['validate'] ?? '') {
                    $validate = $data['params']['validate'];
                    foreach ($validate as $index => $validator) {
                        $key = strtolower($module) . '-storages-' . $storage->name . '-fields-' . str_replace('/', '-', $path) . '-params-validator.' . $index;
                        App::$moduleManager->lang->Save($key . '.' . $currentLang . '.' . $currentLang, $validator['message']);
                        $validator['message'] = '#{' . $key . ';' . $validator['message'] . '}';
                        $validate[$index] = $validator;
                    }
                    $data['params']['validate'] = $validate;
                }

            }

            if (isset($data['values']) && is_array($data['values'])) {
                $newValues = [];
                foreach ($data['values'] as $value) {

                    if (preg_match('/[^\'\/~`\!@#\$%\^&\*\(\)_\-\+=\{\}\[\]\|;:"\<\>,\.\?\\\0-9]/', $value['title'])) {

                        try {
                            App::$moduleManager->lang->Save(strtolower($module) . '-storages-' . $storage->name . '-fields-' . str_replace('/', '-', $path) . '-values-' . $value['value'] . '.' . $currentLang, $value['title']);
                        } catch (\Throwable $e) {

                        }
                        $value['title'] = '#{' . strtolower($module) . '-storages-' . $storage->name . '-fields-' . str_replace('/', '-', $path) . '-values-' . $value['value'] . ';' . $value['title'] . '}';

                    }

                    $newValues[] = $value;

                }
                $data['values'] = $newValues;
            }

        }

        if ($field) {
            // добавляем
            $field->UpdateData($data);
        } else {
            $storage->AddField($path, $data);
        }

        $storage->Save();

        return $this->Finish(200, 'ok');
    }
    public function MoveField(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {

        if (!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        $module = $post->module;
        if (!$module) {
            return $this->Finish(400, 'Bad request');
        }

        $moduleObject = App::$moduleManager->$module;
        if (!$moduleObject) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = $post->storage;
        if (!$storage) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = Storages::Create()->Load($storage);
        if (!$storage) {
            return $this->Finish(400, 'Bad request');
        }


        $move = $post->move;
        $relative = $post->relative;
        $sibling = $post->sibling;

        $move = $storage->GetField($move);
        $relative = $storage->GetField($relative);

        if (!$move || !$relative) {
            return $this->Finish(400, 'Bad request');
        }

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.' . $storage->name . '.fields')) {
            return $this->Finish(403, 'Permission denied');
        }

        $parentField = $move->parent;
        if (!$parentField) {
            $parentField = $storage;
        }

        $parentField->MoveField($move, $relative, $sibling);

        $storage->Save();

        return $this->Finish(200, 'ok');
    }
    public function DeleteField(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {

        if (!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        $module = $post->module;
        if (!$module) {
            return $this->Finish(400, 'Bad request');
        }

        $moduleObject = App::$moduleManager->$module;
        if (!$moduleObject) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = $post->storage;
        if (!$storage) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = Storages::Create()->Load($storage);
        if (!$storage) {
            return $this->Finish(400, 'Bad request');
        }

        $path = $post->path;

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.' . $storage->name . '.fields')) {
            return $this->Finish(403, 'Permission denied');
        }

        $storage->DeleteField($path);
        $storage->Save();

        return $this->Finish(200, 'ok');
    }

    public function SaveIndex(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {

        if (!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if (!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        $module = $post->module;
        if (!$module) {
            return $this->Finish(400, 'Bad request');
        }

        $moduleObject = App::$moduleManager->$module;
        if (!$moduleObject) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = $post->storage;
        if (!$storage) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = Storages::Create()->Load($storage);
        if (!$storage) {
            return $this->Finish(400, 'Bad request');
        }

        $data = $post->data;

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.' . $storage->name . '.indices')) {
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

        if (!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if (!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        $module = $post->module;
        if (!$module) {
            return $this->Finish(400, 'Bad request');
        }

        $moduleObject = App::$moduleManager->$module;
        if (!$moduleObject) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = $post->storage;
        if (!$storage) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = Storages::Create()->Load($storage);
        if (!$storage) {
            return $this->Finish(400, 'Bad request');
        }

        $name = $post->index;
        if (!$name) {
            return $this->Finish(400, 'Bad request');
        }

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.' . $storage->name . '.indices')) {
            return $this->Finish(403, 'Permission denied');
        }

        $storage->DeleteIndex($name);
        $storage->Save();

        return $this->Finish(200, 'ok');
    }


}

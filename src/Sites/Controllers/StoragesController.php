<?php

namespace App\Modules\Sites\Controllers;

use App\Modules\Security\Module as SecurityModule;
use Colibri\App;
use Colibri\Data\Storages\Storage;
use Colibri\Data\Storages\Storages;
use Colibri\Web\Controller as WebController;
use Colibri\Web\RequestCollection;

/**
 * Storages controller
 */
class StoragesController extends WebController
{
    
    /**
     * Saves a storage data
     * @param RequestCollection $get
     * @param RequestCollection $post
     * @param mixed|null $payload
     * @return object
     */
    public function Save(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {
        if (!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        $module = $post->{'module'};
        if (!$module) {
            return $this->Finish(400, 'Bad request');
        }

        $moduleObject = App::$moduleManager->$module;
        if (!$moduleObject) {
            return $this->Finish(400, 'Bad request');
        }

        $data = $post->{'data'};
        $storage = Storages::Create()->Load($data['name']);
        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.' . ($storage != null ? '.edit' : '.add'))) {
            return $this->Finish(403, 'Permission denied');
        }

        $name = $data['name'];
        unset($data['name']);

        if (!$data['group_enabled'] || $data['group_enabled'] === false) {
            unset($data['group']);
            unset($data['group_enabled']);
            $data['group'] = null;
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

    /**
     * Deletes a storage
     * @param RequestCollection $get
     * @param RequestCollection $post
     * @param mixed|null $payload
     * @return object
     */
    public function Delete(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {
        if (!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.remove')) {
            return $this->Finish(403, 'Permission denied');
        }


        $module = $post->{'module'};
        if (!$module) {
            return $this->Finish(400, 'Bad request');
        }

        $moduleObject = App::$moduleManager->$module;
        if (!$moduleObject) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = $post->{'storage'};
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

    /**
     * Saves a field
     * @param RequestCollection $get
     * @param RequestCollection $post
     * @param mixed|null $payload
     * @return object
     */
    public function SaveField(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {

        if (!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        $module = $post->{'module'};
        if (!$module) {
            return $this->Finish(400, 'Bad request');
        }

        $moduleObject = App::$moduleManager->$module;
        if (!$moduleObject) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = $post->{'storage'};
        if (!$storage) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = Storages::Create()->Load($storage);
        if (!$storage) {
            return $this->Finish(400, 'Bad request');
        }

        $data = $post->{'data'};
        $path = $post->{'path'};

        $field = $storage->GetField($path);

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.' . $storage->name . '.fields')) {
            return $this->Finish(403, 'Permission denied');
        }

        if (!$data['group_enabled'] || $data['group_enabled'] === false) {
            unset($data['group']);
            unset($data['group_enabled']);
            $data['group'] = 'window';
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

    /**
     * Moves a field
     * @param RequestCollection $get
     * @param RequestCollection $post
     * @param mixed|null $payload
     * @return object
     */
    public function MoveField(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {

        if (!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        $module = $post->{'module'};
        if (!$module) {
            return $this->Finish(400, 'Bad request');
        }

        $moduleObject = App::$moduleManager->$module;
        if (!$moduleObject) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = $post->{'storage'};
        if (!$storage) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = Storages::Create()->Load($storage);
        if (!$storage) {
            return $this->Finish(400, 'Bad request');
        }


        $move = $post->{'move'};
        $relative = $post->{'relative'};
        $sibling = $post->{'sibling'};

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

    /**
     * Deletes a field
     * @param RequestCollection $get
     * @param RequestCollection $post
     * @param mixed|null $payload
     * @return object
     */
    public function DeleteField(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {

        if (!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        $module = $post->{'module'};
        if (!$module) {
            return $this->Finish(400, 'Bad request');
        }

        $moduleObject = App::$moduleManager->$module;
        if (!$moduleObject) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = $post->{'storage'};
        if (!$storage) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = Storages::Create()->Load($storage);
        if (!$storage) {
            return $this->Finish(400, 'Bad request');
        }

        $path = $post->{'path'};

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.' . $storage->name . '.fields')) {
            return $this->Finish(403, 'Permission denied');
        }

        $storage->DeleteField($path);
        $storage->Save();

        return $this->Finish(200, 'ok');
    }

    /**
     * Saves an index
     * @param RequestCollection $get
     * @param RequestCollection $post
     * @param mixed|null $payload
     * @return object
     */
    public function SaveIndex(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {

        if (!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if (!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        $module = $post->{'module'};
        if (!$module) {
            return $this->Finish(400, 'Bad request');
        }

        $moduleObject = App::$moduleManager->$module;
        if (!$moduleObject) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = $post->{'storage'};
        if (!$storage) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = Storages::Create()->Load($storage);
        if (!$storage) {
            return $this->Finish(400, 'Bad request');
        }

        $data = $post->{'data'};

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.' . $storage->name . '.indices')) {
            return $this->Finish(403, 'Permission denied');
        }

        $name = $data['name'];
        unset($data['name']);
        $storage->AddIndex($name, $data);
        $storage->Save();

        return $this->Finish(200, 'ok');
    }

    /**
     * Deletes an index
     * @param RequestCollection $get
     * @param RequestCollection $post
     * @param mixed|null $payload
     * @return object
     */
    public function DeleteIndex(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {

        if (!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if (!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        $module = $post->{'module'};
        if (!$module) {
            return $this->Finish(400, 'Bad request');
        }

        $moduleObject = App::$moduleManager->$module;
        if (!$moduleObject) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = $post->{'storage'};
        if (!$storage) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = Storages::Create()->Load($storage);
        if (!$storage) {
            return $this->Finish(400, 'Bad request');
        }

        $name = $post->{'index'};
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
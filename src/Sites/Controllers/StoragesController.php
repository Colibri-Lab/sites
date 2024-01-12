<?php

namespace App\Modules\Sites\Controllers;

use App\Modules\Security\Module as SecurityModule;
use Colibri\App;
use Colibri\Data\Storages\Storage;
use Colibri\Data\Storages\Storages;
use Colibri\Exceptions\BadRequestException;
use Colibri\Exceptions\PermissionDeniedException;
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
            throw new PermissionDeniedException('Permission denied', 403);
        }

        $module = $post->{'module'};
        if (!$module) {
            throw new BadRequestException('Bad request', 400);
        }

        $moduleObject = App::$moduleManager->$module;
        if (!$moduleObject) {
            throw new BadRequestException('Bad request', 400);
        }

        $data = $post->{'data'};
        $storage = Storages::Create()->Load($data['name']);
        if (!SecurityModule::$instance->current->IsCommandAllowed(
            'sites.storages.' . ($storage != null ? '.edit' : '.add')
        )) {
            throw new PermissionDeniedException('Permission denied', 403);
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
            throw new PermissionDeniedException('Permission denied', 403);
        }

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.remove')) {
            throw new PermissionDeniedException('Permission denied', 403);
        }


        $module = $post->{'module'};
        if (!$module) {
            throw new BadRequestException('Bad request', 400);
        }

        $moduleObject = App::$moduleManager->$module;
        if (!$moduleObject) {
            throw new BadRequestException('Bad request', 400);
        }

        $storage = $post->{'storage'};
        if (!$storage) {
            throw new BadRequestException('Bad request', 400);
        }

        $storage = Storages::Create()->Load($storage);
        if (!$storage) {
            throw new BadRequestException('Bad request', 400);
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
            throw new PermissionDeniedException('Permission denied', 403);
        }

        $module = $post->{'module'};
        if (!$module) {
            throw new BadRequestException('Bad request', 400);
        }

        $moduleObject = App::$moduleManager->$module;
        if (!$moduleObject) {
            throw new BadRequestException('Bad request', 400);
        }

        $storage = $post->{'storage'};
        if (!$storage) {
            throw new BadRequestException('Bad request', 400);
        }

        $storage = Storages::Create()->Load($storage);
        if (!$storage) {
            throw new BadRequestException('Bad request', 400);
        }

        $data = $post->{'data'};
        $path = $post->{'path'};

        $field = $storage->GetField($path);

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.' . $storage->name . '.fields')) {
            throw new PermissionDeniedException('Permission denied', 403);
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
            throw new PermissionDeniedException('Permission denied', 403);
        }

        $module = $post->{'module'};
        if (!$module) {
            throw new BadRequestException('Bad request', 400);
        }

        $moduleObject = App::$moduleManager->$module;
        if (!$moduleObject) {
            throw new BadRequestException('Bad request', 400);
        }

        $storage = $post->{'storage'};
        if (!$storage) {
            throw new BadRequestException('Bad request', 400);
        }

        $storage = Storages::Create()->Load($storage);
        if (!$storage) {
            throw new BadRequestException('Bad request', 400);
        }


        $move = $post->{'move'};
        $relative = $post->{'relative'};
        $sibling = $post->{'sibling'};

        $move = $storage->GetField($move);
        $relative = $storage->GetField($relative);

        if (!$move || !$relative) {
            throw new BadRequestException('Bad request', 400);
        }

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.' . $storage->name . '.fields')) {
            throw new PermissionDeniedException('Permission denied', 403);
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
            throw new PermissionDeniedException('Permission denied', 403);
        }

        $module = $post->{'module'};
        if (!$module) {
            throw new BadRequestException('Bad request', 400);
        }

        $moduleObject = App::$moduleManager->$module;
        if (!$moduleObject) {
            throw new BadRequestException('Bad request', 400);
        }

        $storage = $post->{'storage'};
        if (!$storage) {
            throw new BadRequestException('Bad request', 400);
        }

        $storage = Storages::Create()->Load($storage);
        if (!$storage) {
            throw new BadRequestException('Bad request', 400);
        }

        $path = $post->{'path'};

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.' . $storage->name . '.fields')) {
            throw new PermissionDeniedException('Permission denied', 403);
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
            throw new PermissionDeniedException('Permission denied', 403);
        }

        if (!SecurityModule::$instance->current) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        $module = $post->{'module'};
        if (!$module) {
            throw new BadRequestException('Bad request', 400);
        }

        $moduleObject = App::$moduleManager->$module;
        if (!$moduleObject) {
            throw new BadRequestException('Bad request', 400);
        }

        $storage = $post->{'storage'};
        if (!$storage) {
            throw new BadRequestException('Bad request', 400);
        }

        $storage = Storages::Create()->Load($storage);
        if (!$storage) {
            throw new BadRequestException('Bad request', 400);
        }

        $data = $post->{'data'};

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.' . $storage->name . '.indices')) {
            throw new PermissionDeniedException('Permission denied', 403);
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
            throw new PermissionDeniedException('Permission denied', 403);
        }

        if (!SecurityModule::$instance->current) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        $module = $post->{'module'};
        if (!$module) {
            throw new BadRequestException('Bad request', 400);
        }

        $moduleObject = App::$moduleManager->$module;
        if (!$moduleObject) {
            throw new BadRequestException('Bad request', 400);
        }

        $storage = $post->{'storage'};
        if (!$storage) {
            throw new BadRequestException('Bad request', 400);
        }

        $storage = Storages::Create()->Load($storage);
        if (!$storage) {
            throw new BadRequestException('Bad request', 400);
        }

        $name = $post->{'index'};
        if (!$name) {
            throw new BadRequestException('Bad request', 400);
        }

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.' . $storage->name . '.indices')) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        $storage->DeleteIndex($name);
        $storage->Save();

        return $this->Finish(200, 'ok');
    }


}
